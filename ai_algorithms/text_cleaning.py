import json
import re
import nltk
from nltk.tokenize import word_tokenize
import os

# Ensure the NLTK tokenizers are downloaded
nltk.download('punkt')

def clean_text(text):
    """
    Clean the input text by converting to lowercase, removing punctuation and numbers,
    and tokenizing into words.

    Parameters:
    text (str): A string containing the text to be cleaned.

    Returns:
    list: A list of tokens (words) extracted from the cleaned text.
    """
    # 1.2.1 Convert text to lowercase to standardize the input
    text = text.lower()
    
    # 1.2.2 Remove punctuation and numbers using a regular expression
    text = re.sub(r'[\d!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]', '', text)
    
    # 1.2.3 Tokenize the cleaned text into words using NLTK's tokenizer
    tokens = word_tokenize(text)
    
    return tokens

def process_file(filename):
    """
    Process a JSON file containing text data, clean each text entry, and output the results.

    Parameters:
    filename (str): The path to the JSON file to be processed.

    Outputs:
    Prints the original and tokenized text to the console.
    """
    # Load data from the specified JSON file
    with open(filename, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Process each item in the dataset and print the results
    for item in data:
        text = item['text']
        cleaned_tokens = clean_text(text)
        print(f"Original: {text}")
        print(f"Tokens: {cleaned_tokens}\n")

# Specify the path to the JSON file
filename = 'jcast046/Bully_Block_Project/ai_algorithms/initial_datasets.json'
process_file(filename)
