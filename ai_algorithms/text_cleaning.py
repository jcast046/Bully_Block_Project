"""
This script implements a complete text preprocessing pipeline using Python, NLTK, and spaCy.

Features:
- Text anonymization to handle sensitive data like emails, phone numbers, and names.
- Text cleaning: lowercase conversion, removal of punctuation/numbers, tokenization, stop word removal, lemmatization, and stemming.
- Dataset loading and error handling for JSON input.
- Export of processed text to a JSON file.

Modules Used:
- re: For regular expressions in text cleaning and anonymization.
- nltk: Provides tokenization, stop word removal, and stemming.
- spacy: Used for lemmatization and additional stop word removal.

Setup:
- Ensure the `nltk` library is installed, and download stopwords using `nltk.download('stopwords')`.
- Install spaCy and download the language model `en_core_web_sm`.

Usage:
1. Prepare a JSON input file with a list of text records under the key "text".
2. Run the script to process the text and save the cleaned output.
"""

import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import TreebankWordTokenizer
from nltk.stem import PorterStemmer
import spacy
import json

# Download necessary NLTK data
nltk.download('stopwords')

# Initialize NLP tools
nlp = spacy.load("en_core_web_sm")
tokenizer = TreebankWordTokenizer()
stemmer = PorterStemmer()

def anonymize_text(text):
    """
    Anonymize sensitive information in the text.
    
    Args:
        text (str): Input text to be anonymized.

    Returns:
        str: Anonymized text where emails, phone numbers, and names are replaced with placeholders.
    """
    text = re.sub(r'\b[A-Za-z]+@[A-Za-z]+\.[A-Za-z]{2,}\b', '<EMAIL>', text)  # Mask emails
    text = re.sub(r'\b\d{4,}\b', '<NUMBER>', text)  # Mask long numbers
    text = re.sub(r'\b[A-Z][a-z]+\s[A-Z][a-z]+\b', '<NAME>', text)  # Mask full names
    return text

def clean_text(text, custom_stopwords=None, debug=False):
    """
    Clean and preprocess the input text.

    Steps:
    1. Anonymize sensitive data.
    2. Convert text to lowercase.
    3. Remove punctuation and numbers.
    4. Tokenize text.
    5. Remove stop words using both NLTK and spaCy.
    6. Lemmatize tokens using spaCy.
    7. Stem tokens using NLTK's PorterStemmer.

    Args:
        text (str): Input text to clean.
        custom_stopwords (set, optional): Additional stopwords to remove. Defaults to None.
        debug (bool, optional): If True, prints intermediate steps. Defaults to False.

    Returns:
        list: List of processed tokens after cleaning, lemmatization, and stemming.
    """
    text = anonymize_text(text)  # Step 1: Anonymize text
    text = text.lower()  # Step 2: Convert to lowercase
    text = re.sub(r'[^a-z\s]', '', text)  # Step 3: Remove punctuation and numbers
    text = re.sub(r'\s+', ' ', text).strip()  # Remove extra spaces

    tokens = tokenizer.tokenize(text)  # Step 4: Tokenize text
    
    # Remove stop words using NLTK
    nltk_stopwords = set(stopwords.words('english'))
    if custom_stopwords:
        nltk_stopwords.update(custom_stopwords)
    tokens = [word for word in tokens if word not in nltk_stopwords]

    # Remove stop words and lemmatize using spaCy
    doc = nlp(" ".join(tokens))
    tokens = [token.text for token in doc if not token.is_stop]
    lemmatized = [token.lemma_ for token in nlp(" ".join(tokens))]  # Step 6: Lemmatize

    stemmed = [stemmer.stem(word) for word in lemmatized]  # Step 7: Stem

    if debug:
        print(f"Original text: {text}")
        print(f"Tokens: {tokens}")
        print(f"Lemmatized tokens: {lemmatized}")
        print(f"Stemmed tokens: {stemmed}")
    
    return stemmed

def load_dataset(filepath):
    """
    Load a dataset from a JSON file.

    Args:
        filepath (str): Path to the JSON file.

    Returns:
        list: A list of text records if successfully loaded; otherwise, an empty list.
    """
    try:
        with open(filepath, 'r') as file:
            data = json.load(file)
            if not isinstance(data, list):
                raise ValueError("Dataset must be a list of records.")
            return data
    except FileNotFoundError:
        print("Error: File not found.")
        return []
    except json.JSONDecodeError:
        print("Error: Invalid JSON format.")
        return []
    except ValueError as e:
        print(f"Error: {e}")
        return []

def save_processed_data(processed_texts, output_path):
    """
    Save processed text data to a JSON file.

    Args:
        processed_texts (list): List of processed text records.
        output_path (str): Path to the output JSON file.
    """
    try:
        with open(output_path, 'w') as file:
            json.dump(processed_texts, file, indent=4)
        print(f"Processed data saved to {output_path}")
    except Exception as e:
        print(f"Error saving processed data: {e}")

if __name__ == "__main__":
    """
    Main program execution.
    - Load dataset from a JSON file.
    - Process each text record.
    - Save the processed data to a new JSON file.
    """
    input_file = "ai_algorithms/initial_datasets.json"  # Path to the input dataset
    output_file = "ai_algorithms/processed_data.json"  # Path to the output file

    # Load the dataset
    dataset = load_dataset(input_file)
    if not dataset:
        print("No data to process. Exiting.")
    else:
        processed_texts = []

        # Process each record
        for record in dataset:
            if 'text' in record:
                cleaned = clean_text(record['text'], debug=True)
                processed_texts.append({'original': record['text'], 'processed': cleaned})

        # Save the processed data
        save_processed_data(processed_texts, output_file)
