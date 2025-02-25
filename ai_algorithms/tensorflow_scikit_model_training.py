"""
Model Training for Cyberbullying Classification

This script trains machine learning (Logistic Regression, SVM, Random Forest)
and deep learning (LSTM, CNN) models using extracted features from the dataset.

Modules:
    - json, random, numpy, pandas, os, subprocess
    - sklearn (for ML models): TfidfVectorizer, LogisticRegression, SVC, RandomForestClassifier
    - sklearn.model_selection: train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
    - sklearn.metrics: classification_report
    - sklearn.utils: resample
    - tensorflow (for deep learning models): Keras layers, tokenizers, sequences
    - matplotlib for plotting 

Usage:
    1. Ensure feature extraction is done (feature_extraction.py).
    2. Run this script to train ML and DL models.
    3. Compare performance metrics for final model selection.
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

overall_accuracy = []
model_names = ["LSTM", "CNN"]


def load_text_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Loads raw text data and severity labels for deep learning training.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        tuple:
            - texts (list of str): List of text content.
            - labels (np.ndarray): Binary labels (1 = cyberbullying, 0 = not bullying).
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Feature dataset not found at {filepath}. "
            "Please run feature_extraction.py first."
        )

    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    labels = np.array([1 if record["severity_level"] == "high" else 0 for record in data])

    return texts, labels


def load_feature_data(filepath="ai_algorithms/feature_dataset.json"):
    """
    Loads numerical features and labels from the dataset for machine learning training.

    This function combines TF-IDF features and numeric features such as token count,
    named entities, sentiment scores, etc.

    Args:
        filepath (str): Path to the feature dataset JSON file.

    Returns:
        tuple:
            - X (np.ndarray): Feature matrix (TF-IDF + numeric features).
            - y (np.ndarray): Target labels encoded as 0 (low), 1 (medium), 2 (high).
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Feature dataset not found at {filepath}. "
            "Please run feature_extraction.py first."
        )

    with open(filepath, "r") as file:
        data = json.load(file)

    texts = [record["original_text"] for record in data]
    y = np.array([
        0 if record["severity_level"] == "low"
        else 1 if record["severity_level"] == "medium"
        else 2
        for record in data
    ])

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
    """
    Performs cross-validation on multiple machine learning models.

    This function uses a StratifiedKFold approach to preserve class distribution
    across folds, and prints out the mean accuracy for each model.

    Args:
        X (np.ndarray): Feature matrix.
        y (np.ndarray): Target labels (0, 1, 2 for severity levels).
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
    """
    Performs hyperparameter tuning via GridSearchCV to find the best hyperparameters
    for each model.

    Args:
        X (np.ndarray): Feature matrix.
        y (np.ndarray): Target labels (0, 1, 2 for severity levels).
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
    """
    Plots training and validation loss, as well as accuracy for a deep learning model.

    Args:
        history (History): A Keras History object containing loss and accuracy
            metrics for both training and validation sets.
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
    """
    Compares machine learning and deep learning models and selects
    the best one based on accuracy.

    Args:
        models (dict): A dictionary where keys are model names (str)
            and values are their corresponding accuracy (float).

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
    """
    Trains Logistic Regression, SVM, and Random Forest models with balanced data.

    Steps:
        1. Loads and splits feature data.
        2. Resamples data to ensure class balance.
        3. Trains the ML models.
        4. Prints a classification report for each model.
    """
    X, y = load_feature_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )

    # Separate samples by severity level
    train_data = list(zip(X_train, y_train))
    low_samples = [d for d in train_data if d[1] == 0]
    medium_samples = [d for d in train_data if d[1] == 1]
    high_samples = [d for d in train_data if d[1] == 2]

    # Resample minority classes to match the majority class count
    max_samples = max(len(low_samples), len(medium_samples), len(high_samples))

    if len(low_samples) > 0:
        low_samples = resample(
            low_samples, replace=True, n_samples=max_samples, random_state=42
        )
    if len(medium_samples) > 0:
        medium_samples = resample(
            medium_samples, replace=True, n_samples=max_samples, random_state=42
        )
    if len(high_samples) > 0:
        high_samples = resample(
            high_samples, replace=True, n_samples=max_samples, random_state=42
        )

    # Combine and shuffle
    balanced_train_data = low_samples + medium_samples + high_samples
    random.shuffle(balanced_train_data)

    # Unpack balanced data
    X_train, y_train = zip(*balanced_train_data)
    X_train = np.array(X_train)
    y_train = np.array(y_train)

    # Train ML models
    log_reg = LogisticRegression(max_iter=500, solver='lbfgs')
    log_reg.fit(X_train, y_train)
    y_pred_lr = log_reg.predict(X_test)

    svm_model = SVC(kernel='linear', C=1.0)
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


def train_lstm():
    """
    Trains an LSTM-based deep learning model for cyberbullying classification.

    Steps:
        1. Tokenize and pad text sequences.
        2. Train the LSTM model with dropout to prevent overfitting.
        3. Evaluate model performance (accuracy).

    Note:
        The model expects 3 output units (Dense layer) for multi-class
        classification (low, medium, high). Make sure your labels match.
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
        Dense(3, activation="softmax")
    ])

    model.compile(
        loss="sparse_categorical_crossentropy",
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
    # model_chart(epochs=5, model_name="LSTM", losses)


def train_cnn():
    """
    Trains a Convolutional Neural Network (CNN) for cyberbullying classification.

    Steps:
        1. Tokenize and pad text sequences.
        2. Build a CNN model with dropout and multiple convolutional layers.
        3. Evaluate model performance (accuracy).

    Note:
        The model expects 3 output units for multi-class classification (low, medium, high).
        Adjust the final Dense layer and loss function accordingly if your dataset is binary.
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
        tf.keras.layers.Dense(3, activation="softmax")
    ])

    model.compile(
        loss="sparse_categorical_crossentropy",
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
    plt.title("Tensorflow " + model_name + " Model Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.savefig("ai_algorithms/Tensorflow" + model_name + ".png")
    plt.show()

def overall_chart():
    """
    Plots a bar chart of overall accuracy for different Tensorflow models.

    Side Effects:
        Uses the global variables `model_names` and `overall_accuracy`.
        Saves the chart to 'ai_algorithms/TensorflowOverallAccuracy.png'.
    """
    plt.bar(model_names, overall_accuracy)
    plt.title("Tensorflow Model Accuracy")
    plt.xlabel("Tensorflow Model")
    plt.ylabel("Overall Accuracy")
    plt.savefig("ai_algorithms/TensorflowOverallAccuracy.png")
    plt.show()

if __name__ == "__main__":
    # Ensure feature extraction has been run; if not, execute it
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
