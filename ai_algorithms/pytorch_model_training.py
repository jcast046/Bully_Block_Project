"""
PyTorch Model Training for Cyberbullying Classification.

This script implements deep learning models (LSTM and CNN) for binary classification
of cyberbullying severity using PyTorch. It includes data preprocessing, model training,
and performance evaluation.

Dependencies:
    - torch: Deep learning framework
    - sklearn: Data splitting and preprocessing
    - tensorflow.keras: Text tokenization and sequence padding
    - matplotlib: Visualization
    - numpy: Numerical operations
    - json, os, subprocess: File and system operations

Workflow:
    1. Run preprocessing scripts (text_cleaning.py, feature_extraction.py)
    2. Load and preprocess data (TF-IDF and tokenized sequences)
    3. Create PyTorch datasets and dataloaders
    4. Train and evaluate LSTM and CNN models
    5. Generate performance visualizations
"""

import os
import json
import subprocess
import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset, DataLoader
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.feature_extraction.text import TfidfVectorizer
import torch.nn.functional as F

# Get the base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Global variables for tracking model performance
overall_accuracy = []
model_names = []


def run_preprocessing():
    """Execute preprocessing scripts in sequence.

    Runs the following scripts in order:
    1. text_cleaning.py: Cleans and normalizes input text
    2. feature_extraction.py: Extracts features from cleaned text
    3. tensorflow_scikit_model_training.py: Prepares data for model training

    Raises:
        FileNotFoundError: If feature_dataset.json is not found after preprocessing.
    """
    scripts = [
        os.path.join("ai_algorithms", "text_cleaning.py"),
        os.path.join("ai_algorithms", "feature_extraction.py"),
        os.path.join("ai_algorithms", "tensorflow_scikit_model_training.py"),
    ]

    for script in scripts:
        print(f"Running `{script}`...")
        subprocess.run(["python", os.path.join(BASE_DIR, script)], check=True)

    if not os.path.exists(os.path.join(BASE_DIR, "ai_algorithms", "feature_dataset.json")):
        raise FileNotFoundError(
            "Feature extraction failed. Check `feature_extraction.py` for errors."
        )


def load_tfidf_data(filepath=os.path.join("ai_algorithms", "feature_dataset.json")):
    """Load and transform text data into TF-IDF features.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        tuple:
            - np.ndarray: TF-IDF feature matrix [n_samples, n_features]
            - np.ndarray: Binary labels (0.0 for low, 1.0 for high severity)
    """
    with open(os.path.join(BASE_DIR, filepath), "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([
        0.0 if record["severity_level"] == "low"
        else 1.0  # high severity
        for record in data
    ])

    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    X_tfidf = vectorizer.fit_transform(texts).toarray()

    return X_tfidf, labels


def load_tokenized_data(filepath=os.path.join("ai_algorithms", "feature_dataset.json")):
    """Load and tokenize text data for sequence-based models.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        tuple:
            - np.ndarray: Padded token sequences [n_samples, max_sequence_length]
            - np.ndarray: Binary labels (0.0 for low, 1.0 for high severity)
    """
    with open(os.path.join(BASE_DIR, filepath), "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([
        0.0 if record["severity_level"] == "low"
        else 1.0  # high severity
        for record in data
    ])

    tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
    tokenizer.fit_on_texts(texts)
    sequences = tokenizer.texts_to_sequences(texts)
    X_tokenized = pad_sequences(sequences, maxlen=150, padding="post", truncating="post")

    return X_tokenized, labels


class TextDataset(Dataset):
    """Custom PyTorch Dataset for text classification.

    Handles both tokenized sequences and TF-IDF vectors, converting them to
    appropriate PyTorch tensors for model training.

    Args:
        texts (np.ndarray): Input features (tokenized sequences or TF-IDF vectors)
        labels (np.ndarray): Target labels
        use_tfidf (bool): If True, treats texts as TF-IDF vectors and converts to
            FloatTensor. Otherwise, uses LongTensor for tokenized data.

    Attributes:
        texts (torch.Tensor): Feature matrix in tensor form
        labels (torch.Tensor): Target labels in tensor form
        use_tfidf (bool): Flag indicating feature format
    """

    def __init__(self, texts, labels, use_tfidf=False):
        """Initialize the dataset.

        Args:
            texts (np.ndarray): Input features
            labels (np.ndarray): Target labels
            use_tfidf (bool): Whether to use TF-IDF features
        """
        self.use_tfidf = use_tfidf
        self.texts = torch.tensor(texts, dtype=torch.float if use_tfidf else torch.long)
        self.labels = torch.tensor(labels, dtype=torch.float)

    def __len__(self):
        """Return the total number of samples.

        Returns:
            int: Number of samples in the dataset
        """
        return len(self.texts)

    def __getitem__(self, idx):
        """Get a sample from the dataset.

        Args:
            idx (int): Index of the sample to retrieve

        Returns:
            tuple: (feature_tensor, label_tensor)
        """
        return self.texts[idx], self.labels[idx]


class LSTMModel(nn.Module):
    """Bidirectional LSTM model with attention for text classification.

    A deep learning model that uses word embeddings, bidirectional LSTM layers,
    attention mechanism, and fully connected layers for binary classification.

    Args:
        vocab_size (int): Size of the vocabulary (default: 5000)
        embedding_dim (int): Dimension of word embeddings (default: 300)
        hidden_dim (int): Number of hidden units in LSTM (default: 256)
        output_dim (int): Number of output classes (default: 1 for binary)

    Attributes:
        embedding (nn.Embedding): Word embedding layer
        lstm1 (nn.LSTM): First bidirectional LSTM layer
        lstm2 (nn.LSTM): Second bidirectional LSTM layer
        attention (nn.Sequential): Attention mechanism layers
        fc1 (nn.Linear): First fully connected layer
        bn1 (nn.BatchNorm1d): Batch normalization layer
        dropout (nn.Dropout): Dropout layer
        fc2 (nn.Linear): Output layer
        sigmoid (nn.Sigmoid): Sigmoid activation
    """

    def __init__(self, vocab_size=5000, embedding_dim=300, hidden_dim=256, output_dim=1):
        """Initialize the LSTM model architecture.

        Args:
            vocab_size (int): Size of the vocabulary
            embedding_dim (int): Dimension of word embeddings
            hidden_dim (int): Number of hidden units in LSTM
            output_dim (int): Number of output classes
        """
        super(LSTMModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm1 = nn.LSTM(embedding_dim, hidden_dim, num_layers=1, batch_first=True, 
                            bidirectional=True, dropout=0.2)
        self.lstm2 = nn.LSTM(hidden_dim * 2, hidden_dim, num_layers=1, batch_first=True, 
                            bidirectional=True, dropout=0.2)
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )
        self.fc1 = nn.Linear(hidden_dim * 2, 128)
        self.bn1 = nn.BatchNorm1d(128)
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(128, output_dim)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        """Forward pass of the model.

        Args:
            x (torch.Tensor): Input tensor of shape [batch_size, sequence_length]

        Returns:
            torch.Tensor: Output probabilities of shape [batch_size, 1]
        """
        x = self.embedding(x)
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)
        
        attention_weights = self.attention(x)
        attention_weights = F.softmax(attention_weights, dim=1)
        x = torch.sum(attention_weights * x, dim=1)
        
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        return self.sigmoid(x)


class CNNModel(nn.Module):
    """Deep CNN model for text classification using TF-IDF features.

    A fully connected neural network with multiple layers, batch normalization,
    and dropout for regularization. Uses LeakyReLU activation for better gradient flow.

    Args:
        input_dim (int): Dimension of input TF-IDF vectors
        output_dim (int): Number of output classes (default: 1 for binary)

    Attributes:
        fc1-fc5 (nn.Linear): Fully connected layers with decreasing dimensions
        bn1-bn4 (nn.BatchNorm1d): Batch normalization layers
        dropout1-dropout4 (nn.Dropout): Dropout layers
        sigmoid (nn.Sigmoid): Sigmoid activation
    """

    def __init__(self, input_dim, output_dim=1):
        """Initialize the CNN model architecture.

        Args:
            input_dim (int): Dimension of input TF-IDF vectors
            output_dim (int): Number of output classes
        """
        super(CNNModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, 2048)
        self.bn1 = nn.BatchNorm1d(2048)
        self.dropout1 = nn.Dropout(0.3)
        
        self.fc2 = nn.Linear(2048, 1024)
        self.bn2 = nn.BatchNorm1d(1024)
        self.dropout2 = nn.Dropout(0.3)
        
        self.fc3 = nn.Linear(1024, 512)
        self.bn3 = nn.BatchNorm1d(512)
        self.dropout3 = nn.Dropout(0.3)
        
        self.fc4 = nn.Linear(512, 256)
        self.bn4 = nn.BatchNorm1d(256)
        self.dropout4 = nn.Dropout(0.3)
        
        self.fc5 = nn.Linear(256, output_dim)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        """Forward pass of the model.

        Args:
            x (torch.Tensor): Input tensor of shape [batch_size, input_dim]

        Returns:
            torch.Tensor: Output probabilities of shape [batch_size, 1]
        """
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.leaky_relu(x, negative_slope=0.01)
        x = self.dropout1(x)
        
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.leaky_relu(x, negative_slope=0.01)
        x = self.dropout2(x)
        
        x = self.fc3(x)
        x = self.bn3(x)
        x = F.leaky_relu(x, negative_slope=0.01)
        x = self.dropout3(x)
        
        x = self.fc4(x)
        x = self.bn4(x)
        x = F.leaky_relu(x, negative_slope=0.01)
        x = self.dropout4(x)
        
        x = self.fc5(x)
        return self.sigmoid(x)


def train_pytorch_model(model, train_loader, test_loader, model_name, use_tfidf=False):
    """Train and evaluate a PyTorch model.

    Handles the training loop, including optimization, learning rate scheduling,
    early stopping, and model evaluation. Saves the best model based on both loss
    and accuracy metrics.

    Args:
        model (nn.Module): PyTorch model to train
        train_loader (DataLoader): DataLoader for training data
        test_loader (DataLoader): DataLoader for test data
        model_name (str): Identifier for the model
        use_tfidf (bool): Whether to use TF-IDF features

    Side Effects:
        - Saves model checkpoints to disk
        - Generates training loss plots
        - Updates global accuracy tracking variables
    """
    criterion = nn.BCELoss()
    
    if model_name == "CNN":
        optimizer = optim.AdamW(model.parameters(), lr=0.0001, weight_decay=0.0001)
        scheduler = optim.lr_scheduler.OneCycleLR(
            optimizer,
            max_lr=0.0001,
            epochs=5,
            steps_per_epoch=len(train_loader),
            pct_start=0.3,
            anneal_strategy='cos'
        )
    else:
        optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
        scheduler = optim.lr_scheduler.OneCycleLR(
            optimizer,
            max_lr=0.001,
            epochs=5,
            steps_per_epoch=len(train_loader),
            pct_start=0.3
        )
    
    epochs = [1, 2, 3, 4, 5]
    losses = []
    best_loss = float('inf')
    best_accuracy = 0.0
    patience = 3
    patience_counter = 0

    for epoch in range(5):
        model.train()
        epoch_loss = 0
        correct = 0
        total = 0
        
        for batch_x, batch_y in train_loader:
            batch_x = batch_x.float() if use_tfidf else batch_x.long()
            batch_y = batch_y.unsqueeze(1)

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)
            
            optimizer.step()
            scheduler.step()
            
            epoch_loss += loss.item()
            
            predicted = (outputs > 0.5).float()
            correct += (predicted == batch_y).sum().item()
            total += batch_y.size(0)
        
        avg_epoch_loss = epoch_loss / len(train_loader)
        train_accuracy = correct / total
        losses.append(avg_epoch_loss)
        
        print(f"Epoch {epoch+1}/5 ({model_name}): Loss = {avg_epoch_loss:.4f}, "
              f"Train Accuracy = {train_accuracy:.4f}")
        
        if avg_epoch_loss < best_loss and train_accuracy > best_accuracy:
            best_loss = avg_epoch_loss
            best_accuracy = train_accuracy
            torch.save(model.state_dict(), os.path.join(BASE_DIR, "ai_algorithms", f"best_{model_name.lower()}_model.pth"))
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping triggered after {epoch+1} epochs")
                break
    
    model_chart(epochs, model_name, losses)
    
    model.load_state_dict(torch.load(os.path.join(BASE_DIR, "ai_algorithms", f"best_{model_name.lower()}_model.pth")))
    
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            batch_x = batch_x.float() if use_tfidf else batch_x.long()
            batch_y = batch_y.unsqueeze(1)

            outputs = model(batch_x)
            predicted = (outputs > 0.5).float()
            correct += (predicted == batch_y).sum().item()
            total += batch_y.size(0)

    accuracy = correct / total
    print(f"\nPyTorch {model_name} Model Accuracy: {accuracy:.4f}")
    overall_accuracy.append(accuracy)
    model_names.append(model_name)


def model_chart(epochs, model_name, losses):
    """Generate and save a line chart of training losses.

    Args:
        epochs (list): List of epoch numbers
        model_name (str): Name of the model for the chart title
        losses (list): List of loss values corresponding to each epoch

    Side Effects:
        - Creates and displays a matplotlib figure
        - Saves the chart as a PNG file in the ai_algorithms directory
    """
    plt.figure(figsize=(10, 6))
    plt.plot(epochs, losses, marker='o', linewidth=2, markersize=8)
    plt.title(f"PyTorch {model_name} Model Training Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.xticks(epochs)
    
    for i, loss in enumerate(losses):
        plt.annotate(f'{loss:.4f}', 
                    xy=(epochs[i], loss),
                    xytext=(0, 10),
                    textcoords='offset points',
                    ha='center')
    
    plt.tight_layout()
    plt.savefig(os.path.join(BASE_DIR, "ai_algorithms", f"PyTorch{model_name}Loss.png"), dpi=300, bbox_inches='tight')
    #plt.show()


def overall_chart():
    """Generate and save a bar chart comparing model accuracies.

    Creates a bar chart comparing the test accuracies of different models using
    the global variables model_names and overall_accuracy.

    Side Effects:
        - Creates and displays a matplotlib figure
        - Saves the chart as a PNG file in the ai_algorithms directory
    """
    plt.figure(figsize=(10, 6))
    bars = plt.bar(model_names, overall_accuracy)
    plt.title("PyTorch Model Test Accuracy Comparison")
    plt.xlabel("Model")
    plt.ylabel("Test Accuracy")
    plt.grid(True, linestyle='--', alpha=0.7)
    
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.4f}',
                ha='center', va='bottom')
    
    plt.tight_layout()
    plt.savefig(os.path.join(BASE_DIR, "ai_algorithms", "PyTorchOverallAccuracy.png"), dpi=300, bbox_inches='tight')
    #plt.show()


if __name__ == "__main__":
    # 1. Ensure preprocessing scripts are executed
    run_preprocessing()

    # 2. Load TF-IDF data and tokenized sequences
    X_tfidf, y = load_tfidf_data()
    X_text, y = load_tokenized_data()

    # 3. Split TF-IDF data
    X_train_tfidf, X_test_tfidf, y_train, y_test = train_test_split(
        X_tfidf, y, test_size=0.2, stratify=y, random_state=42
    )
    # 4. Split tokenized data
    X_train_text, X_test_text, _, _ = train_test_split(
        X_text, y, test_size=0.2, stratify=y, random_state=42
    )

    # 5. Create PyTorch Datasets
    train_dataset_tfidf = TextDataset(X_train_tfidf, y_train, use_tfidf=True)
    test_dataset_tfidf = TextDataset(X_test_tfidf, y_test, use_tfidf=True)

    train_dataset_text = TextDataset(X_train_text, y_train, use_tfidf=False)
    test_dataset_text = TextDataset(X_test_text, y_test, use_tfidf=False)

    # 6. Create DataLoaders
    train_loader_text = DataLoader(train_dataset_text, batch_size=32, shuffle=True)
    test_loader_text = DataLoader(test_dataset_text, batch_size=32, shuffle=False)

    train_loader_tfidf = DataLoader(train_dataset_tfidf, batch_size=32, shuffle=True)
    test_loader_tfidf = DataLoader(test_dataset_tfidf, batch_size=32, shuffle=False)

    # 7. Train Models
    train_pytorch_model(
        LSTMModel(), 
        train_loader_text, 
        test_loader_text, 
        "LSTM", 
        use_tfidf=False
    )

    train_pytorch_model(
        CNNModel(input_dim=X_train_tfidf.shape[1]), 
        train_loader_tfidf, 
        test_loader_tfidf, 
        "CNN", 
        use_tfidf=True
    )

    # 8. Generate the overall chart
    overall_chart()

