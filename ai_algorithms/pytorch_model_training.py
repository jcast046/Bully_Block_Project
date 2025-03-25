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
    """
    Run necessary preprocessing scripts to generate the required datasets.

    This function executes:
        1. `text_cleaning.py`
        2. `feature_extraction.py`
        3. `tensorflow_scikit_model_training.py`

    Raises:
        FileNotFoundError: If the preprocessed dataset 
            'ai_algorithms/feature_dataset.json' is not found after running scripts.
    """
    scripts = [
        "ai_algorithms/text_cleaning.py",
        "ai_algorithms/feature_extraction.py",
        "ai_algorithms/tensorflow_scikit_model_training.py",
    ]

    for script in scripts:
        print(f"Running `{script}`...")
        subprocess.run(["python", script], check=True)

    # Check if the dataset now exists
    if not os.path.exists("ai_algorithms/feature_dataset.json"):
        raise FileNotFoundError(
            "Feature extraction failed. Check `feature_extraction.py` for errors."
        )


def load_tfidf_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Loads TF-IDF features from a JSON file for classification tasks.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        tuple:
            - X_tfidf (np.ndarray): The TF-IDF feature matrix (shape: [n_samples, n_features]).
            - labels (np.ndarray): The corresponding binary labels 
              (1 for high severity, 0 otherwise).
    """
    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([1 if record["severity_level"] == "high" else 0 for record in data])

    # Apply TF-IDF transformation
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    X_tfidf = vectorizer.fit_transform(texts).toarray()

    return X_tfidf, labels


def load_tokenized_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Loads tokenized text sequences for LSTM-based classification.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        tuple:
            - X_tokenized (np.ndarray): A padded sequence of tokens 
              (shape: [n_samples, max_sequence_length]).
            - labels (np.ndarray): The corresponding binary labels 
              (1 for high severity, 0 otherwise).
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
    """
    Custom PyTorch Dataset for handling text data (tokenized or TF-IDF).

    Args:
        texts (np.ndarray): Tokenized sequences or TF-IDF vectors.
        labels (np.ndarray): Corresponding labels (e.g., 0/1).
        use_tfidf (bool): If True, treats `texts` as TF-IDF vectors 
            and converts to FloatTensor. Otherwise, LongTensor for tokenized data.

    Attributes:
        texts (torch.Tensor): The text features in tensor form (float or long).
        labels (torch.Tensor): The integer labels in tensor form.
        use_tfidf (bool): Flag to indicate feature format.
    """

    def __init__(self, texts, labels, use_tfidf=False):
        self.use_tfidf = use_tfidf

        if use_tfidf:
            # TF-IDF should be FloatTensor
            self.texts = torch.tensor(texts, dtype=torch.float)
        else:
            # Tokenized text should be LongTensor
            self.texts = torch.tensor(texts, dtype=torch.long)

        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        """Returns the total number of samples in the dataset."""
        return len(self.texts)

    def __getitem__(self, idx):
        """
        Retrieves the sample (text features and label) at the given index.

        Args:
            idx (int): Index of the sample to retrieve.

        Returns:
            tuple:
                - (torch.Tensor): The text features for the sample.
                - (torch.Tensor): The label for the sample.
        """
        return self.texts[idx], self.labels[idx]


class LSTMModel(nn.Module):
    """
    LSTM-based model for text classification using PyTorch.

    Args:
        vocab_size (int): Vocabulary size for embeddings.
        embedding_dim (int): Dimensionality of word embeddings.
        hidden_dim (int): Number of hidden units in the LSTM layer.
        output_dim (int): Number of output classes (default is 3).

    Attributes:
        embedding (nn.Embedding): Embedding layer.
        lstm (nn.LSTM): LSTM layer to process sequence data.
        fc (nn.Linear): Fully connected layer for classification.
        softmax (nn.Softmax): Softmax activation for final output probabilities.

    Methods:
        forward(x): Defines the forward pass computation of the model.
    """

    def __init__(self, vocab_size=5000, embedding_dim=128, hidden_dim=128, output_dim=3):
        super(LSTMModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        """
        Forward pass of the LSTM model.

        Args:
            x (torch.Tensor): Tokenized input sequences (batch_size, seq_length).

        Returns:
            torch.Tensor: Output probabilities for each class (batch_size, output_dim).
        """
        x = self.embedding(x)
        x, _ = self.lstm(x)
        x = self.fc(x[:, -1, :])
        return self.softmax(x)


class CNNModel(nn.Module):
    """
    CNN-based model for text classification using TF-IDF features with fully connected layers.

    Args:
        input_dim (int): Dimensionality of the input TF-IDF vector.
        output_dim (int): Number of output classes (default is 3).

    Attributes:
        fc1 (nn.Linear): First fully connected layer.
        bn1 (nn.BatchNorm1d): Batch normalization for first FC layer.
        fc2 (nn.Linear): Second fully connected layer.
        bn2 (nn.BatchNorm1d): Batch normalization for second FC layer.
        fc3 (nn.Linear): Final fully connected layer.
        dropout (nn.Dropout): Dropout layer for regularization.

    Methods:
        forward(x): Defines the forward pass computation of the model.
    """

    def __init__(self, input_dim, output_dim=3):
        super(CNNModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, 512)
        self.bn1 = nn.BatchNorm1d(512)
        self.fc2 = nn.Linear(512, 256)
        self.bn2 = nn.BatchNorm1d(256)
        self.fc3 = nn.Linear(256, output_dim)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        """
        Forward pass of the CNN model using fully connected layers on TF-IDF vectors.

        Args:
            x (torch.Tensor): Input feature matrix (batch_size, input_dim).

        Returns:
            torch.Tensor: Logits for each class (batch_size, output_dim).
        """
        x = F.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = F.relu(self.bn2(self.fc2(x)))
        x = self.fc3(x)
        return x  # Softmax is typically applied in the loss function


def train_pytorch_model(model, train_loader, test_loader, model_name, use_tfidf=False):
    """
    Trains and evaluates a PyTorch model (LSTM or CNN).

    Args:
        model (nn.Module): The PyTorch model instance to train (LSTMModel or CNNModel).
        train_loader (DataLoader): DataLoader for training set.
        test_loader (DataLoader): DataLoader for test set.
        model_name (str): A string identifier for the model (e.g., "LSTM", "CNN").
        use_tfidf (bool): If True, inputs will be cast to float (for TF-IDF); 
            otherwise cast to long (tokenized sequences).

    Side Effects:
        Prints training loss per epoch and final accuracy on the test set.
    """
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0005)
    epochs = [1, 2, 3, 4, 5]
    losses = []

    # Train for 5 epochs
    for epoch in range(5):
        model.train()
        for batch_x, batch_y in train_loader:
            batch_x = batch_x.float() if use_tfidf else batch_x.long()
            batch_y = batch_y.long()

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
        losses.append(loss.item())

        print(f"Epoch {epoch+1}/5 ({model_name}): Loss = {loss.item():.4f}")
    
    # Print chart for model showing losses for each epoch
    model_chart(epochs, model_name, losses)
    
    # Evaluate model on test set
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
    """
    Plots a bar chart of losses over epochs for a given model.

    Args:
        epoches (list or np.ndarray): The epoch indices.
        model_name (str): A string identifier for the model.
        losses (list or np.ndarray): Loss values corresponding to each epoch.

    Side Effects:
        Displays and saves a .png image of the bar chart to 'ai_algorithms' directory.
    """
    plt.bar(epochs, losses)
    plt.title("PyTorch " + model_name + " Model Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.savefig("ai_algorithms/PyTorch" + model_name + ".png")
    #plt.show()


def overall_chart():
    """
    Plots a bar chart of overall accuracy for different PyTorch models.

    Side Effects:
        Uses the global variables `model_names` and `overall_accuracy`.
        Saves the chart to 'ai_algorithms/PyTorchOverallAccuracy.png'.
    """
    plt.bar(model_names, overall_accuracy)
    plt.title("PyTorch Model Accuracy")
    plt.xlabel("PyTorch Model")
    plt.ylabel("Overall Accuracy")
    plt.savefig("ai_algorithms/PyTorchOverallAccuracy.png")
    #plt.show()


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

