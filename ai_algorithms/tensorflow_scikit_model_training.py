"""
Model Training for Cyberbullying Classification.

This script implements machine learning and deep learning models for binary classification
of cyberbullying severity. It includes feature extraction, model training, and performance
evaluation.

Dependencies:
    - sklearn: Machine learning models and utilities
    - tensorflow.keras: Deep learning models and preprocessing
    - numpy, pandas: Data manipulation
    - matplotlib: Visualization
    - json, os, subprocess: File and system operations

Workflow:
    1. Load and preprocess data
    2. Train classical ML models (Logistic Regression, SVM, Random Forest)
    3. Train deep learning models (LSTM, CNN)
    4. Evaluate and compare model performance
"""

import json
import random
import numpy as np
import pandas as pd
import os
import subprocess
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
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
import matplotlib.pyplot as plt

# Global variables for tracking model performance
overall_accuracy = []
model_names = ["LSTM", "CNN"]


def load_text_data(filepath="ai_algorithms/feature_dataset.json"):
    """Load raw text data and severity labels for deep learning training.

    Args:
        filepath (str): Path to the feature dataset JSON file

    Returns:
        tuple:
            - list: List of text content
            - np.ndarray: Binary labels (0 for low, 1 for high severity)

    Raises:
        FileNotFoundError: If the feature dataset is not found
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Feature dataset not found at {filepath}. "
            "Please run feature_extraction.py first."
        )

    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([
        0 if record["severity_level"] == "low"
        else 1  # high severity
        for record in data
    ])

    return texts, labels


def load_feature_data(filepath="ai_algorithms/feature_dataset.json"):
    """Load numerical features and labels from the dataset.

    Combines TF-IDF features with numeric features such as token count,
    named entities, sentiment scores, etc.

    Args:
        filepath (str): Path to the feature dataset JSON file

    Returns:
        tuple:
            - np.ndarray: Feature matrix (TF-IDF + numeric features)
            - np.ndarray: Binary labels (0 for low, 1 for high severity)

    Raises:
        FileNotFoundError: If the feature dataset is not found
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Feature dataset not found at {filepath}. "
            "Please run feature_extraction.py first."
        )

    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    
    # Convert severity levels to binary labels
    y = np.array([
        0 if record["severity_level"] == "low"
        else 1  # high severity
        for record in data
    ])

    # Print class distribution
    unique, counts = np.unique(y, return_counts=True)
    print("\nOriginal Dataset Class Distribution:")
    for severity, count in zip(['Low', 'High'], counts):
        print(f"{severity}: {count} samples")

    # Numeric features
    numeric_features = np.array([
        [
            record["validation"]["token_count"],
            record["validation"]["entity_count"],
            record["validation"]["negative_adjectives"],
            record["validation"]["sentiment_summary"]["positive"],
            record["validation"]["sentiment_summary"]["negative"],
            record["validation"]["sentiment_summary"]["neutral"],
            len(record["validation"]["flagged_entities"])
        ]
        for record in data
    ])

    # TF-IDF features
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    tfidf_features = vectorizer.fit_transform(texts).toarray()

    # Combine TF-IDF and numeric features
    X = np.hstack((tfidf_features, numeric_features))

    return X, y


def cross_validate_models(X, y):
    """Perform cross-validation on multiple machine learning models.

    Uses StratifiedKFold to preserve class distribution across folds and prints
    mean accuracy for each model.

    Args:
        X (np.ndarray): Feature matrix
        y (np.ndarray): Binary labels (0 for low, 1 for high severity)
    """
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    models = {
        "Logistic Regression": LogisticRegression(max_iter=500, solver='lbfgs'),
        "SVM": SVC(kernel='linear', C=1.0),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
    }

    for model_name, model in models.items():
        scores = cross_val_score(model, X, y, cv=skf, scoring='accuracy')
        print(f"\n🔹 {model_name} Cross-Validation Accuracy: "
              f"{scores.mean():.4f} ± {scores.std():.4f}")


def optimize_hyperparameters(X, y):
    """Perform hyperparameter tuning via GridSearchCV.

    Finds the best hyperparameters for each model using cross-validation.

    Args:
        X (np.ndarray): Feature matrix
        y (np.ndarray): Binary labels (0 for low, 1 for high severity)
    """
    param_grid = {
        'Logistic Regression': {'C': [0.01, 0.1, 1, 10]},
        'SVM': {'C': [0.1, 1, 10]},
        'Random Forest': {
            'n_estimators': [50, 100, 200],
            'max_depth': [3, 5, 10]
        },
    }

    models = {
        "Logistic Regression": LogisticRegression(max_iter=500),
        "SVM": SVC(),
        "Random Forest": RandomForestClassifier(random_state=42),
    }

    for model_name, model in models.items():
        grid_search = GridSearchCV(model, param_grid[model_name],
                                 cv=3, scoring='accuracy')
        grid_search.fit(X, y)
        print(f"\n Best Parameters for {model_name}: {grid_search.best_params_}")
        print(f"Best Accuracy: {grid_search.best_score_:.4f}")


def plot_learning_curve(history):
    """Plot training and validation metrics for a deep learning model.

    Creates a figure with two subplots showing loss and accuracy curves.

    Args:
        history (History): Keras History object containing training metrics
    """
    plt.figure(figsize=(12, 4))

    # Loss
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.title("Loss Curve")

    # Accuracy
    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.title("Accuracy Curve")

    plt.show()


def compare_models(models):
    """Compare models and select the best one based on accuracy.

    Args:
        models (dict): Dictionary mapping model names to their accuracies

    Example:
        models = {
            'Logistic Regression': 0.85,
            'LSTM': 0.88,
            'CNN': 0.90
        }
    """
    best_model = max(models, key=models.get)
    print(f"\nBest Model: {best_model} "
          f"with Accuracy: {models[best_model]:.4f}")


def train_models():
    """Train and evaluate classical machine learning models.

    Steps:
        1. Load and split feature data
        2. Resample data to ensure class balance
        3. Train Logistic Regression, SVM, and Random Forest models
        4. Print classification reports for each model
    """
    X, y = load_feature_data()
    
    # Split data while preserving class distribution
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )

    # Print split distribution
    print("\nTraining Set Distribution:")
    unique, counts = np.unique(y_train, return_counts=True)
    for severity, count in zip(['Low', 'High'], counts):
        print(f"{severity}: {count} samples")

    print("\nTest Set Distribution:")
    unique, counts = np.unique(y_test, return_counts=True)
    for severity, count in zip(['Low', 'High'], counts):
        print(f"{severity}: {count} samples")

    # Separate samples by severity level
    train_data = list(zip(X_train, y_train))
    low_samples = [d for d in train_data if d[1] == 0]
    high_samples = [d for d in train_data if d[1] == 1]

    # Ensure we have samples for each class
    if len(low_samples) == 0 or len(high_samples) == 0:
        print("Warning: One or more classes have no samples!")
        return

    # Resample minority classes to match the majority class count
    max_samples = max(len(low_samples), len(high_samples))

    # Resample each class
    low_samples = resample(
        low_samples, replace=True, n_samples=max_samples, random_state=42
    )
    high_samples = resample(
        high_samples, replace=True, n_samples=max_samples, random_state=42
    )

    # Combine and shuffle
    balanced_train_data = low_samples + high_samples
    random.shuffle(balanced_train_data)

    # Unpack balanced data
    X_train, y_train = zip(*balanced_train_data)
    X_train = np.array(X_train)
    y_train = np.array(y_train)

    # Print balanced distribution
    print("\nBalanced Training Set Distribution:")
    unique, counts = np.unique(y_train, return_counts=True)
    for severity, count in zip(['Low', 'High'], counts):
        print(f"{severity}: {count} samples")

    # Train ML models with class weights
    class_weights = dict(zip(range(2), 1.0 / np.bincount(y_train)))

    log_reg = LogisticRegression(
        max_iter=500,
        solver='lbfgs',
        class_weight=class_weights
    )
    log_reg.fit(X_train, y_train)
    y_pred_lr = log_reg.predict(X_test)

    svm_model = SVC(
        kernel='linear',
        C=1.0,
        class_weight=class_weights
    )
    svm_model.fit(X_train, y_train)
    y_pred_svm = svm_model.predict(X_test)

    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42,
        class_weight=class_weights
    )
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)

    # Evaluate Models
    print("\n**Logistic Regression Performance**")
    print(classification_report(y_test, y_pred_lr, labels=[0, 1], target_names=['Low', 'High']))

    print("\n**Support Vector Machine (SVM) Performance**")
    print(classification_report(y_test, y_pred_svm, labels=[0, 1], target_names=['Low', 'High']))

    print("\n**Random Forest Classifier Performance**")
    print(classification_report(y_test, y_pred_rf, labels=[0, 1], target_names=['Low', 'High']))


def train_lstm():
    """Train an LSTM-based deep learning model.

    Steps:
        1. Tokenize and pad text sequences
        2. Train the LSTM model with dropout
        3. Evaluate model performance

    Note:
        The model uses binary classification (low vs. high severity)
    """
    texts, labels = load_text_data()

    tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
    tokenizer.fit_on_texts(texts)
    sequences = tokenizer.texts_to_sequences(texts)
    padded_sequences = pad_sequences(
        sequences, maxlen=150, padding="post", truncating="post"
    )

    X_train, X_test, y_train, y_test = train_test_split(
        padded_sequences,
        labels,
        test_size=0.2,
        stratify=labels,
        random_state=42
    )

    # Define LSTM model
    model = Sequential([
        Embedding(input_dim=5000, output_dim=128, input_length=150),
        SpatialDropout1D(0.5),
        LSTM(128, dropout=0.5, recurrent_dropout=0.5),
        Dense(64, activation="relu"),
        Dense(1, activation="sigmoid")  # Binary classification
    ])

    model.compile(
        loss="binary_crossentropy",
        optimizer="adam",
        metrics=["accuracy"]
    )
    model.fit(
        X_train, y_train,
        epochs=5, batch_size=32,
        validation_data=(X_test, y_test)
    )

    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"\nLSTM Model Accuracy: {accuracy:.4f}")
    overall_accuracy.append(accuracy)


def train_cnn():
    """Train a CNN-based deep learning model.

    Steps:
        1. Tokenize and pad text sequences
        2. Build and train the CNN model
        3. Evaluate model performance

    Note:
        The model uses binary classification (low vs. high severity)
    """
    texts, labels = load_text_data()

    tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
    tokenizer.fit_on_texts(texts)
    sequences = tokenizer.texts_to_sequences(texts)
    padded_sequences = pad_sequences(
        sequences, maxlen=150, padding="post", truncating="post"
    )

    X_train, X_test, y_train, y_test = train_test_split(
        padded_sequences,
        labels,
        test_size=0.2,
        stratify=labels,
        random_state=42
    )

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
        tf.keras.layers.Dense(1, activation="sigmoid")  # Binary classification
    ])

    model.compile(
        loss="binary_crossentropy",
        optimizer="adam",
        metrics=["accuracy"]
    )

    model.fit(
        X_train, y_train,
        epochs=5, batch_size=32,
        validation_data=(X_test, y_test)
    )

    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"\nCNN Model Accuracy: {accuracy:.4f}")
    overall_accuracy.append(accuracy)


def model_chart(epochs, model_name, losses):
    """Plot training losses over epochs.

    Args:
        epochs (list): List of epoch numbers
        model_name (str): Name of the model
        losses (list): List of loss values

    Side Effects:
        - Creates and displays a matplotlib figure
        - Saves the chart as a PNG file
    """
    plt.bar(epochs, losses)
    plt.title(f"Tensorflow {model_name} Model Training Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.savefig(f"ai_algorithms/Tensorflow{model_name}Loss.png")
    plt.show()


def overall_chart():
    """Plot overall accuracy comparison for all models.

    Creates a bar chart comparing the accuracies of different models using
    the global variables model_names and overall_accuracy.

    Side Effects:
        - Creates and displays a matplotlib figure
        - Saves the chart as a PNG file
    """
    plt.bar(model_names, overall_accuracy)
    plt.title("Tensorflow Model Accuracy Comparison")
    plt.xlabel("Model")
    plt.ylabel("Accuracy")
    plt.savefig("ai_algorithms/TensorflowOverallAccuracy.png")
    plt.show()


if __name__ == "__main__":
    # Ensure feature extraction has been run
    if not os.path.exists("ai_algorithms/feature_dataset.json"):
        print("Feature dataset missing. Running `feature_extraction.py`...")
        subprocess.run(["python", "ai_algorithms/feature_extraction.py"], check=True)

    # Load feature data and perform cross-validation + hyperparameter tuning
    X, y = load_feature_data()
    cross_validate_models(X, y)
    optimize_hyperparameters(X, y)

    # Train classical ML models
    train_models()

    # Train deep learning models
    train_lstm()
    train_cnn()
    
    # Create overall accuracy chart
    overall_chart()
