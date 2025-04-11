"""
This script implements a complete text preprocessing pipeline using Python, NLTK, and spaCy.

Features:
- Text anonymization to handle sensitive data like emails, phone numbers, and names.
- Text cleaning: lowercase conversion, removal of punctuation/numbers, tokenization, 
  stop word removal, lemmatization, and stemming.
- Dataset loading and error handling for JSON input.
- Export of processed text to a JSON file.

Modules Used:
- re: For regular expressions in text cleaning and anonymization.
- nltk: Provides tokenization, stop word removal, and stemming.
- spacy: Used for lemmatization and additional stop word removal.

Setup:
- Ensure the `nltk` library is installed, and download stopwords using 
  `nltk.download('stopwords')`.
- Install spaCy and download the language model `en_core_web_sm`.

Usage:
1. Prepare a JSON input file containing a list of records, each with a 'content' 
   or 'text' field.
2. Run the script to process the text and save the cleaned output to 
   `ai_algorithms/processed_data.json`.
"""

import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import TreebankWordTokenizer
from nltk.stem import PorterStemmer
import spacy
import json
import os

# Get the base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Download necessary NLTK data
nltk.download('stopwords')

# Initialize NLP tools
nlp = spacy.load("en_core_web_sm")
tokenizer = TreebankWordTokenizer()
stemmer = PorterStemmer()

# List to save the content type of each record
content_types = []

# List to save content id of each record
content_ids = []

# List to save author_ids of each record
author_ids = []

def anonymize_text(text):
    """Anonymize sensitive information like emails, numbers, and names in the text.

    Replaces potential emails, long numbers (4+ digits), and capitalized names 
    (like "First Last") with placeholders like <EMAIL>, <NUMBER>, and <NAME>.

    Args:
        text (str): Input text to be anonymized.

    Returns:
        str: Anonymized text with sensitive information replaced by placeholders.
    """
    text = re.sub(r'\b[A-Za-z]+@[A-Za-z]+\.[A-Za-z]{2,}\b', '<EMAIL>', text)  # Mask emails
    text = re.sub(r'\b\d{4,}\b', '<NUMBER>', text)  # Mask long numbers
    text = re.sub(r'\b[A-Z][a-z]+\s[A-Z][a-z]+\b', '<NAME>', text)  # Mask full names
    return text

def clean_text(text, custom_stopwords=None, debug=False):
    """Clean and preprocess the input text through multiple steps.

    Pipeline:
    1. Anonymize sensitive data using `anonymize_text`.
    2. Convert text to lowercase.
    3. Remove punctuation and numbers using regex.
    4. Tokenize text using NLTK's TreebankWordTokenizer.
    5. Remove stop words (NLTK standard list + optional custom list).
    6. Further remove stop words and lemmatize tokens using spaCy.
    7. Stem the lemmatized tokens using NLTK's PorterStemmer.

    Args:
        text (str): Input text string to clean.
        custom_stopwords (set, optional): A set of additional custom stopwords 
            to remove. Defaults to None.
        debug (bool, optional): If True, prints intermediate processing steps. 
            Defaults to False.

    Returns:
        list: A list of cleaned, lemmatized, and stemmed tokens.
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
    """Load a dataset from a specified JSON file.

    Expects the JSON file to contain a list of records.

    Args:
        filepath (str): The path to the JSON dataset file.

    Returns:
        list: A list of records loaded from the JSON file. Returns an empty list 
              if the file is not found, is not valid JSON, or does not contain a list.

    Raises:
        Prints error messages to stderr if file loading fails due to 
        FileNotFoundError, json.JSONDecodeError, or ValueError (if data is not a list).
    """
    try:
        with open(os.path.join(BASE_DIR, filepath), 'r') as file:
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
    """Save the processed text data to a JSON file.

    Args:
        processed_texts (list): A list of dictionaries, where each dictionary 
            represents a processed record (e.g., containing 'original' and 
            'processed' text fields).
        output_path (str): The path where the output JSON file will be saved.

    Raises:
        Prints an error message to stderr if saving fails due to any exception.
    """
    try:
        with open(os.path.join(BASE_DIR, output_path), 'w') as file:
            json.dump(processed_texts, file, indent=4)
        print(f"Processed data saved to {output_path}")
    except Exception as e:
        print(f"Error saving processed data: {e}")
        
def get_content_type(i):
    """Retrieve the content type for a specific record index.

    Args:
        i (int): The index of the record in the processed dataset.

    Returns:
        str: The content type (e.g., "post", "comment", "Unspecified") 
             associated with the record at the given index.
    """
    type = content_types[i]
    return type

def get_content_id(i):
    """Retrieve the content ID for a specific record index.

    Args:
        i (int): The index of the record in the processed dataset.

    Returns:
        str: The content ID (e.g., post_id, message_id, comment_id, "Unspecified") 
             associated with the record at the given index.
    """
    id = content_ids[i]
    return id

def get_author_id(i):
    """Retrieve the author ID for a specific record index.

    Args:
        i (int): The index of the record in the processed dataset.

    Returns:
        str: The author ID associated with the record at the given index, 
             or "Unspecified" if not found.
    """
    author_id = author_ids[i]
    return author_id

def main():
    """Main execution function for the text cleaning pipeline.
    
    Orchestrates the loading of the dataset, processing of each text record 
    using `clean_text`, extraction of metadata (content type, ID, author ID), 
    and saving the processed data using `save_processed_data`.
    """
    input_file = os.path.join("ai_algorithms", "initial_datasets.json")  # Path to the input dataset
    output_file = os.path.join("ai_algorithms", "processed_data.json")  # Path to the output file

    # Load the dataset
    dataset = load_dataset(input_file)
    if not dataset:
        print("No data to process. Exiting.")
        return

    processed_texts = []

    # Process each record
    for record in dataset:
        content_id = "Unspecified"  # Default value
        author_id = record.get('author_id', "Unspecified")  # Extract author_id

        if 'content' in record:
            cleaned = clean_text(record['content'], debug=True)
            processed_texts.append({
                'original': record['content'],
                'processed': cleaned,
                'author_id': author_id  # Include author_id in processed data
            })

            if 'contentType' in record:
                if record['contentType'] in ["post", "message", "comment"]:
                    content_types.append(record['contentType'])

                    # Extract the correct content ID based on contentType
                    if record['contentType'] == "post" and 'post_id' in record:
                        content_id = record['post_id']
                    elif record['contentType'] == "message" and 'message_id' in record:
                        content_id = record['message_id']
                    elif record['contentType'] == "comment" and 'comment_id' in record:
                        content_id = record['comment_id']
                else:
                    content_types.append("Unspecified")
            else:
                content_types.append("Unspecified")

        elif 'text' in record:
            cleaned = clean_text(record['text'], debug=True)
            processed_texts.append({
                'original': record['text'],
                'processed': cleaned,
                'author_id': author_id  # Include author_id for text-based records
            })

        else:
            print(f"Warning: No valid text field found in record: {record}")

        # Save content_id and author_id
        content_ids.append(content_id)
        author_ids.append(author_id)

    # Save the processed data
    save_processed_data(processed_texts, output_file)


