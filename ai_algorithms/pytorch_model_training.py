"""
PyTorch Model Training for Cyberbullying Classification

This script runs preprocessing, trains LSTM and CNN models using PyTorch, 
and evaluates their performance.

Modules:
    - torch: For deep learning models (LSTM, CNN).
    - sklearn: For data splitting.
    - TensorFlow/Keras: For tokenization and sequence padding.
    - subprocess: For running external preprocessing scripts.
    - json, os, numpy: For data handling and manipulation.
    - matplotlib: For plotting charts.

Workflow:
    1. Run preprocessing scripts (text_cleaning.py, feature_extraction.py, 
       tensorflow_scikit_model_training.py).
    2. Load preprocessed text data (TF-IDF and tokenized sequences).
    3. Define a custom PyTorch `Dataset` class.
    4. Implement LSTM and CNN models in PyTorch.
    5. Train and evaluate both models; generate accuracy metrics and charts.
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
# Tokenization & Padding (Using TensorFlow's Tokenizer)
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.feature_extraction.text import TfidfVectorizer
import torch.nn.functional as F

# Global variables to track model accuracy
overall_accuracy = []
model_names = []


def run_preprocessing():
    """Run necessary preprocessing scripts to generate required datasets.

    This function executes the following scripts in sequence:
    1. text_cleaning.py - Cleans and normalizes the input text data
    2. feature_extraction.py - Extracts features from cleaned text
    3. tensorflow_scikit_model_training.py - Prepares data for model training

    Raises:
        FileNotFoundError: If the preprocessed dataset 'ai_algorithms/feature_dataset.json'
            is not found after running the scripts.

    Returns:
        None
    """
    scripts = [
        "ai_algorithms/text_cleaning.py",
        "ai_algorithms/feature_extraction.py",
        "ai_algorithms/tensorflow_scikit_model_training.py",
    ]

    for script in scripts:
        print(f"Running `{script}`...")
        subprocess.run(["python", script], check=True)

    if not os.path.exists("ai_algorithms/feature_dataset.json"):
        raise FileNotFoundError(
            "Feature extraction failed. Check `feature_extraction.py` for errors."
        )


def load_tfidf_data(filepath="ai_algorithms/feature_dataset.json"):
    """Load and transform text data into TF-IDF features.

    Args:
        filepath (str, optional): Path to the feature dataset JSON file.
            Defaults to "ai_algorithms/feature_dataset.json".

    Returns:
        tuple: Contains:
            - X_tfidf (np.ndarray): TF-IDF feature matrix of shape [n_samples, n_features].
            - labels (np.ndarray): Binary labels (1 for high severity, 0 otherwise).
    """
    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([1 if record["severity_level"] == "high" else 0 for record in data])

    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    X_tfidf = vectorizer.fit_transform(texts).toarray()

    return X_tfidf, labels


def load_tokenized_data(filepath="ai_algorithms/feature_dataset.json"):
    """Load and tokenize text data for sequence-based models.

    Args:
        filepath (str, optional): Path to the feature dataset JSON file.
            Defaults to "ai_algorithms/feature_dataset.json".

    Returns:
        tuple: Contains:
            - X_tokenized (np.ndarray): Padded sequence of tokens with shape
              [n_samples, max_sequence_length].
            - labels (np.ndarray): Binary labels (1 for high severity, 0 otherwise).
    """
    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([1 if record["severity_level"] == "high" else 0 for record in data])

    tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
    tokenizer.fit_on_texts(texts)
    sequences = tokenizer.texts_to_sequences(texts)
    X_tokenized = pad_sequences(sequences, maxlen=150, padding="post", truncating="post")

    return X_tokenized, labels


class TextDataset(Dataset):
    """Custom PyTorch Dataset for handling text data.

    This class handles both tokenized sequences and TF-IDF vectors, converting them
    to appropriate PyTorch tensors for model training.

    Args:
        texts (np.ndarray): Input features (tokenized sequences or TF-IDF vectors).
        labels (np.ndarray): Target labels.
        use_tfidf (bool, optional): If True, treats texts as TF-IDF vectors and
            converts to FloatTensor. Otherwise, uses LongTensor for tokenized data.
            Defaults to False.

    Attributes:
        texts (torch.Tensor): Feature matrix in tensor form (float or long).
        labels (torch.Tensor): Target labels in tensor form.
        use_tfidf (bool): Flag indicating feature format.
    """

    def __init__(self, texts, labels, use_tfidf=False):
        self.use_tfidf = use_tfidf
        self.texts = torch.tensor(texts, dtype=torch.float if use_tfidf else torch.long)
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        """Return the total number of samples in the dataset.

        Returns:
            int: Number of samples.
        """
        return len(self.texts)

    def __getitem__(self, idx):
        """Get a sample from the dataset.

        Args:
            idx (int): Index of the sample to retrieve.

        Returns:
            tuple: Contains:
                - torch.Tensor: Feature matrix for the sample.
                - torch.Tensor: Label for the sample.
        """
        return self.texts[idx], self.labels[idx]


class LSTMModel(nn.Module):
    """LSTM-based model for text classification.

    A bidirectional LSTM model with attention mechanism for sequence classification.
    Uses word embeddings and multiple LSTM layers with dropout for regularization.

    Args:
        vocab_size (int, optional): Size of the vocabulary. Defaults to 5000.
        embedding_dim (int, optional): Dimension of word embeddings. Defaults to 300.
        hidden_dim (int, optional): Number of hidden units in LSTM. Defaults to 256.
        output_dim (int, optional): Number of output classes. Defaults to 3.

    Attributes:
        embedding (nn.Embedding): Word embedding layer.
        lstm1 (nn.LSTM): First bidirectional LSTM layer.
        lstm2 (nn.LSTM): Second bidirectional LSTM layer.
        attention (nn.Sequential): Attention mechanism layers.
        fc1 (nn.Linear): First fully connected layer.
        bn1 (nn.BatchNorm1d): Batch normalization layer.
        dropout (nn.Dropout): Dropout layer for regularization.
        fc2 (nn.Linear): Output layer.
        softmax (nn.Softmax): Softmax activation for probabilities.
    """

    def __init__(self, vocab_size=5000, embedding_dim=300, hidden_dim=256, output_dim=3):
        super(LSTMModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm1 = nn.LSTM(embedding_dim, hidden_dim, num_layers=1, batch_first=True, bidirectional=True, dropout=0.2)
        self.lstm2 = nn.LSTM(hidden_dim * 2, hidden_dim, num_layers=1, batch_first=True, bidirectional=True, dropout=0.2)
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )
        self.fc1 = nn.Linear(hidden_dim * 2, 128)
        self.bn1 = nn.BatchNorm1d(128)
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(128, output_dim)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        """Forward pass of the LSTM model.

        Args:
            x (torch.Tensor): Input tensor of shape [batch_size, sequence_length].

        Returns:
            torch.Tensor: Output probabilities of shape [batch_size, output_dim].
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
        return self.softmax(x)


class CNNModel(nn.Module):
    """CNN-based model for text classification using TF-IDF features.

    A deep neural network with multiple fully connected layers, batch normalization,
    and dropout for regularization. Uses LeakyReLU activation for better gradient flow.

    Args:
        input_dim (int): Dimension of input TF-IDF vectors.
        output_dim (int, optional): Number of output classes. Defaults to 3.

    Attributes:
        fc1-fc5 (nn.Linear): Fully connected layers with decreasing dimensions.
        bn1-bn4 (nn.BatchNorm1d): Batch normalization layers.
        dropout1-dropout4 (nn.Dropout): Dropout layers for regularization.
    """

    def __init__(self, input_dim, output_dim=3):
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

    def forward(self, x):
        """Forward pass of the CNN model.

        Args:
            x (torch.Tensor): Input tensor of shape [batch_size, input_dim].

        Returns:
            torch.Tensor: Output logits of shape [batch_size, output_dim].
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
        return x


def train_pytorch_model(model, train_loader, test_loader, model_name, use_tfidf=False):
    """Train and evaluate a PyTorch model.

    This function handles the training loop, including optimization, learning rate
    scheduling, early stopping, and model evaluation. It saves the best model based
    on both loss and accuracy metrics.

    Args:
        model (nn.Module): PyTorch model to train (LSTMModel or CNNModel).
        train_loader (DataLoader): DataLoader for training data.
        test_loader (DataLoader): DataLoader for test data.
        model_name (str): Identifier for the model (e.g., "LSTM", "CNN").
        use_tfidf (bool, optional): If True, inputs are TF-IDF vectors.
            Defaults to False.

    Returns:
        None

    Side Effects:
        - Saves model checkpoints to disk
        - Generates training loss plots
        - Updates global accuracy tracking variables
    """
    criterion = nn.CrossEntropyLoss()
    
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
            batch_y = batch_y.long()

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)
            
            optimizer.step()
            scheduler.step()
            
            epoch_loss += loss.item()
            
            predicted = torch.argmax(outputs, dim=1)
            correct += (predicted == batch_y).sum().item()
            total += batch_y.size(0)
        
        avg_epoch_loss = epoch_loss / len(train_loader)
        train_accuracy = correct / total
        losses.append(avg_epoch_loss)
        
        print(f"Epoch {epoch+1}/5 ({model_name}): Loss = {avg_epoch_loss:.4f}, Train Accuracy = {train_accuracy:.4f}")
        
        if avg_epoch_loss < best_loss and train_accuracy > best_accuracy:
            best_loss = avg_epoch_loss
            best_accuracy = train_accuracy
            torch.save(model.state_dict(), f"ai_algorithms/best_{model_name.lower()}_model.pth")
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping triggered after {epoch+1} epochs")
                break
    
    model_chart(epochs, model_name, losses)
    
    model.load_state_dict(torch.load(f"ai_algorithms/best_{model_name.lower()}_model.pth"))
    
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            batch_x = batch_x.float() if use_tfidf else batch_x.long()
            batch_y = batch_y.long()

            outputs = model(batch_x)
            predicted = torch.argmax(outputs, dim=1)
            correct += (predicted == batch_y).sum().item()
            total += batch_y.size(0)

    accuracy = correct / total
    print(f"\nPyTorch {model_name} Model Accuracy: {accuracy:.4f}")
    overall_accuracy.append(accuracy)
    model_names.append(model_name)


def model_chart(epochs, model_name, losses):
    """Generate and save a line chart of training losses.

    Args:
        epochs (list): List of epoch numbers.
        model_name (str): Name of the model for the chart title.
        losses (list): List of loss values corresponding to each epoch.

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
    plt.savefig(f"ai_algorithms/PyTorch{model_name}Loss.png", dpi=300, bbox_inches='tight')
    plt.show()


def overall_chart():
    """Generate and save a bar chart comparing model accuracies.

    This function creates a bar chart comparing the test accuracies of different
    models using the global variables model_names and overall_accuracy.

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
    plt.savefig("ai_algorithms/PyTorchOverallAccuracy.png", dpi=300, bbox_inches='tight')
    plt.show()


# ------------------------------------------------------------------------------
# Main Execution
# ------------------------------------------------------------------------------

# 1. Ensure preprocessing scripts are executed
run_preprocessing()

# 2. Load TF-IDF data and tokenized sequences
X_tfidf, y = load_tfidf_data()
X_text, y = load_tokenized_data()

# 3. Split TF-IDF data
X_train_tfidf, X_test_tfidf, y_train, y_test = train_test_split(
    X_tfidf, y, test_size=0.2, stratify=y, random_state=42
)
# 4. Split tokenized data (we reuse y_train, y_test for simplicity)
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

# 7. Train Models: LSTM (tokenized) and CNN (TF-IDF)
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

# 8. Generate the overall chart (if model_names and accuracies are tracked)
overall_chart()

