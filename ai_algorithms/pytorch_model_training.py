"""
PyTorch Model Training for Cyberbullying Classification

This script runs preprocessing, trains LSTM and CNN models using PyTorch, and evaluates performance.

Modules Used:
- torch: For deep learning models.
- sklearn: For data splitting.
- TensorFlow/Keras: For tokenization and sequence padding.
- subprocess: For executing preprocessing scripts.
- json, os, numpy: For data handling.

Workflow:
1. Run preprocessing scripts (`text_cleaning.py`, `feature_extraction.py`, `tensorflow_scikit_model_training.py`).
2. Load preprocessed text data.
3. Define custom PyTorch `Dataset` class.
4. Implement LSTM and CNN models.
5. Train and evaluate both models.

"""

import os
import json
import subprocess
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset, DataLoader
# Tokenization & Padding (Using TensorFlow's Tokenizer)
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Ensure all necessary preprocessing steps run before PyTorch training
def run_preprocessing():
    """
    Run `text_cleaning.py`, `feature_extraction.py`, and `tensorflow_scikit_model_training.py`
    to ensure all required datasets are generated before PyTorch model training.

    Raises:
        FileNotFoundError: If feature extraction fails and the dataset is not found.
    """
    scripts = [
        "ai_algorithms/text_cleaning.py",
        "ai_algorithms/feature_extraction.py",
        "ai_algorithms/tensorflow_scikit_model_training.py",
    ]

    for script in scripts:
        print(f"Running `{script}` ...")
        subprocess.run(["python", script], check=True)

    # Ensure the dataset exists before continuing
    if not os.path.exists("ai_algorithms/feature_dataset.json"):
        raise FileNotFoundError("Feature extraction failed. Check `feature_extraction.py` for errors.")

# Run preprocessing
run_preprocessing()

# Load text-based data for PyTorch model training
def load_text_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Load text data and severity labels for PyTorch model training.

    Args:
        filepath (str): Path to the dataset JSON file.

    Returns:
        tuple: (texts, labels)
            - texts (list): List of raw text content.
            - labels (numpy array): Binary labels (1 = cyberbullying, 0 = not bullying).
    """
    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([1 if record["severity_level"] == "high" else 0 for record in data])

    return texts, labels

# PyTorch Dataset Class
class TextDataset(Dataset):
    """
    Custom PyTorch Dataset for handling text data.

    Args:
        texts (list): List of tokenized and padded text sequences.
        labels (list): Corresponding labels for classification.

    Methods:
        __len__(): Returns the number of samples.
        __getitem__(idx): Retrieves a specific sample.
    """
    def __init__(self, texts, labels):
        self.texts = texts
        self.labels = labels

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        return torch.tensor(self.texts[idx]), torch.tensor(self.labels[idx])

# Define PyTorch LSTM Model
class LSTMModel(nn.Module):
    """
    LSTM-based model for text classification using PyTorch.

    Args:
        vocab_size (int): Vocabulary size for embeddings.
        embedding_dim (int): Dimension of word embeddings.
        hidden_dim (int): Number of hidden units in LSTM.
        output_dim (int): Number of output classes.

    Methods:
        forward(x): Forward pass through the LSTM model.
    """
    def __init__(self, vocab_size=5000, embedding_dim=128, hidden_dim=128, output_dim=3):
        super(LSTMModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.embedding(x)
        x, _ = self.lstm(x)
        x = self.fc(x[:, -1, :])
        return self.softmax(x)

# Define PyTorch CNN Model
class CNNModel(nn.Module):
    """
    CNN-based model for text classification using PyTorch.

    Args:
        vocab_size (int): Vocabulary size for embeddings.
        embedding_dim (int): Dimension of word embeddings.
        num_filters (int): Number of filters in CNN layers.
        filter_sizes (tuple): Different filter sizes for feature extraction.
        output_dim (int): Number of output classes.

    Methods:
        forward(x): Forward pass through the CNN model.
    """
    def __init__(self, vocab_size=5000, embedding_dim=128, num_filters=100, filter_sizes=(3, 4, 5), output_dim=3):
        super(CNNModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.convs = nn.ModuleList([
            nn.Conv2d(in_channels=1, out_channels=num_filters, kernel_size=(fs, embedding_dim))
            for fs in filter_sizes
        ])
        self.fc = nn.Linear(len(filter_sizes) * num_filters, output_dim)
        self.dropout = nn.Dropout(0.5)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.embedding(x).unsqueeze(1)  # Add channel dimension for CNN
        x = [torch.relu(conv(x)).squeeze(3) for conv in self.convs]
        x = [torch.max(pool, dim=2)[0] for pool in x]  # Max pooling
        x = torch.cat(x, dim=1)
        x = self.dropout(x)
        return self.softmax(self.fc(x))

# Run PyTorch Model Training
def train_pytorch_model(model, train_loader, test_loader, model_name):
    """
    Generic function to train and evaluate a PyTorch model.

    Args:
        model (torch.nn.Module): PyTorch model instance (LSTM or CNN).
        train_loader (DataLoader): Training data loader.
        test_loader (DataLoader): Testing data loader.
        model_name (str): Model identifier (e.g., "LSTM", "CNN").
    """
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Training Loop
    for epoch in range(5):
        model.train()
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
        print(f"Epoch {epoch+1}/5 ({model_name}): Loss = {loss.item():.4f}")

    # Evaluation
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            outputs = model(batch_x)
            predicted = torch.argmax(outputs, dim=1)
            correct += (predicted == batch_y).sum().item()
            total += batch_y.size(0)

    print(f"\n PyTorch {model_name} Model Accuracy: {correct/total:.4f}")

# Train LSTM and CNN Models
texts, labels = load_text_data()

tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=150, padding="post", truncating="post")

X_train, X_test, y_train, y_test = train_test_split(padded_sequences, labels, test_size=0.2, stratify=labels, random_state=42)

train_dataset = TextDataset(X_train, y_train)
test_dataset = TextDataset(X_test, y_test)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

train_pytorch_model(LSTMModel(), train_loader, test_loader, "LSTM")
train_pytorch_model(CNNModel(), train_loader, test_loader, "CNN")
