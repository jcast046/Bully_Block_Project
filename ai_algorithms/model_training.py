"""
Model Training for Cyberbullying Classification

This script trains machine learning (Logistic Regression, SVM, Random Forest)
and deep learning (LSTM) models using extracted features from the dataset.

Modules Used:
- sklearn: For traditional ML models.
- TensorFlow/Keras: For LSTM deep learning model.
- Pandas, NumPy: For data manipulation and processing.

Steps:
1. Load feature dataset (`feature_dataset.json`).
2. Train ML models with balanced data.
3. Train an LSTM model with improved generalization.
4. Evaluate and display performance metrics.

"""

import json
import random
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report
from sklearn.utils import resample

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Embedding, SpatialDropout1D, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

import os
import subprocess

# Ensure feature extraction runs before model training
if not os.path.exists("ai_algorithms/feature_dataset.json"):
    print("Feature dataset missing. Running `feature_extraction.py`...")
    subprocess.run(["python", "ai_algorithms/feature_extraction.py"], check=True)

if not os.path.exists("ai_algorithms/feature_dataset.json"):
    raise FileNotFoundError("Feature extraction failed. Please check `feature_extraction.py` for errors.")

# Load text-based training data for LSTM
def load_text_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Load raw text data and severity labels for deep learning training.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        texts (list): List of text content.
        labels (numpy array): Binary labels (1 = cyberbullying, 0 = not bullying).
    """
    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([1 if record["severity_level"] == "high" else 0 for record in data])

    return texts, labels

# Load feature-based training data for ML models
def load_feature_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Load numerical features and labels from dataset for ML training.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        X (numpy array): Feature matrix (numeric values only).
        y (numpy array): Target labels (0 = low, 1 = medium, 2 = high).
    """
    with open(filepath, "r") as file:
        data = json.load(file)

    # Extract only numeric features
    X = np.array([
        [
            record["validation"]["token_count"],  # Total token count
            record["validation"]["entity_count"],  # Named entities detected
            record["validation"]["negative_adjectives"],  # Count of negative adjectives
            record["validation"]["sentiment_summary"]["positive"],  # Positive sentiment score
            record["validation"]["sentiment_summary"]["negative"],  # Negative sentiment score
            record["validation"]["sentiment_summary"]["neutral"],  # Neutral sentiment score
            len(record["validation"]["flagged_entities"])  # Count of flagged entities
        ]
        for record in data
    ])

    # Convert severity levels to numeric values (low=0, medium=1, high=2)
    y = np.array([
        0 if record["severity_level"] == "low" else 1 if record["severity_level"] == "medium" else 2
        for record in data
    ])

    return X, y

# Train traditional ML models
def train_models():
    """
    Train Logistic Regression, SVM, and Random Forest models with balanced training data.

    Steps:
    1. Load and split feature data.
    2. Resample data to ensure balanced class distribution.
    3. Train Logistic Regression, SVM, and Random Forest.
    4. Evaluate model performance.
    """
    X, y = load_feature_data()

    # Split data (stratify ensures class balance in train/test sets)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    # Separate samples by severity level
    train_data = list(zip(X_train, y_train))
    
    low_samples = [d for d in train_data if d[1] == 0]
    medium_samples = [d for d in train_data if d[1] == 1]
    high_samples = [d for d in train_data if d[1] == 2]

    # Resample minority classes to match majority class count
    max_samples = max(len(low_samples), len(medium_samples), len(high_samples))

    if len(low_samples) > 0:
        low_samples = resample(low_samples, replace=True, n_samples=max_samples, random_state=42)
    if len(medium_samples) > 0:
        medium_samples = resample(medium_samples, replace=True, n_samples=max_samples, random_state=42)
    if len(high_samples) > 0:
        high_samples = resample(high_samples, replace=True, n_samples=max_samples, random_state=42)

    # Combine and shuffle data
    balanced_train_data = low_samples + medium_samples + high_samples
    random.shuffle(balanced_train_data)

    # Unpack balanced data
    X_train, y_train = zip(*balanced_train_data)
    X_train, y_train = np.array(X_train), np.array(y_train)

    # Train ML models
    log_reg = LogisticRegression(max_iter=500, solver='lbfgs')  # Increased max_iter
    log_reg.fit(X_train, y_train)
    y_pred_lr = log_reg.predict(X_test)

    svm_model = SVC(kernel='linear', C=1.0)  # Adjusted hyperparameter
    svm_model.fit(X_train, y_train)
    y_pred_svm = svm_model.predict(X_test)

    rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)

    # Evaluate Models
    print("\n**Logistic Regression Performance**")
    print(classification_report(y_test, y_pred_lr))

    print("\n**Support Vector Machine (SVM) Performance**")
    print(classification_report(y_test, y_pred_svm))

    print("\n**Random Forest Classifier Performance**")
    print(classification_report(y_test, y_pred_rf))

# Train LSTM deep learning model
def train_lstm():
    """
    Train an LSTM-based deep learning model for cyberbullying classification.

    Steps:
    1. Tokenize and pad text sequences.
    2. Train LSTM model with dropout to prevent overfitting.
    3. Evaluate model performance.
    """
    texts, labels = load_text_data()

    tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
    tokenizer.fit_on_texts(texts)
    sequences = tokenizer.texts_to_sequences(texts)
    padded_sequences = pad_sequences(sequences, maxlen=150, padding="post", truncating="post")

    X_train, X_test, y_train, y_test = train_test_split(padded_sequences, labels, test_size=0.2, stratify=labels, random_state=42)

    # Define LSTM model
    model = Sequential([
        Embedding(input_dim=5000, output_dim=128, input_length=150),
        SpatialDropout1D(0.5),
        LSTM(128, dropout=0.5, recurrent_dropout=0.5),
        Dense(64, activation="relu"),
        Dense(3, activation="softmax")
    ])

    model.compile(loss="sparse_categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
    model.fit(X_train, y_train, epochs=5, batch_size=32, validation_data=(X_test, y_test))

    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"\nLSTM Model Accuracy: {accuracy:.4f}")

# Train CNN Model
def train_cnn():
    """
    Train a Convolutional Neural Network (CNN) for cyberbullying classification.
    
    Steps:
    1. Tokenize and pad text sequences.
    2. Train CNN model with dropout and multiple convolutional layers.
    3. Evaluate model performance.
    """
    texts, labels = load_text_data()

    tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
    tokenizer.fit_on_texts(texts)
    sequences = tokenizer.texts_to_sequences(texts)
    padded_sequences = pad_sequences(sequences, maxlen=150, padding="post", truncating="post")

    X_train, X_test, y_train, y_test = train_test_split(padded_sequences, labels, test_size=0.2, stratify=labels, random_state=42)

    # Define CNN model architecture
    model = Sequential([
        Embedding(input_dim=5000, output_dim=128, input_length=150),
        SpatialDropout1D(0.3),  
        
        # 1D Convolutional layers
        tf.keras.layers.Conv1D(filters=64, kernel_size=5, activation='relu'),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        
        tf.keras.layers.Conv1D(filters=64, kernel_size=5, activation='relu'),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        
        # Flatten before fully connected layers
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(3, activation="softmax")  # Multi-class classification
    ])

    model.compile(loss="sparse_categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
    
    # Train the CNN model
    model.fit(X_train, y_train, epochs=5, batch_size=32, validation_data=(X_test, y_test))

    # Evaluate the CNN model
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"\n CNN Model Accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    """
    Main execution: Trains both ML and deep learning models.
    """
    train_models()  # Train traditional ML models (Logistic Regression, SVM, Random Forest)
    train_lstm()  # Train LSTM deep learning model
    train_cnn()  # Train CNN deep learning model
