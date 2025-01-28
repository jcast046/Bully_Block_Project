import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import TreebankWordTokenizer
from nltk.stem import PorterStemmer
import spacy
import json

# Download NLTK data
nltk.download('stopwords')

# Initialize tools
nlp = spacy.load("en_core_web_sm")
tokenizer = TreebankWordTokenizer()
stemmer = PorterStemmer()

"""
This script demonstrates a complete text preprocessing pipeline using Python, NLTK, and spaCy. 
It includes tokenization, removal of punctuation and numbers, stopword removal, lemmatization, 
and stemming. The `clean_text` function processes input text and returns a list of cleaned tokens.

Modules and Tools:
- re: Regular expressions for text cleaning.
- nltk: Provides stopword removal and tokenization.
- spacy: Used for lemmatization and additional stopword removal.
- TreebankWordTokenizer (NLTK): Tokenizes text into words.
- PorterStemmer (NLTK): Performs stemming on tokens.

Function Overview:
1. `clean_text`:
    - Converts text to lowercase.
    - Removes punctuation and numbers.
    - Tokenizes text.
    - Removes stopwords using both NLTK and spaCy.
    - Lemmatizes tokens using spaCy.
    - Stems tokens using NLTK's PorterStemmer.
    - Supports debugging mode to display intermediate steps.

Setup Requirements:
- Download NLTK stopwords using `nltk.download('stopwords')`.
- Install the spaCy language model `en_core_web_sm`.

Usage:
- Call `clean_text` with the input text. Optional parameters:
    - `custom_stopwords`: Add additional stopwords if needed.
    - `debug`: Set to True to print intermediate processing steps for debugging purposes.

Example:
- Input: "Natural Language Processing (NLP) is a sub-field of artificial intelligence (AI). It's a booming area!"
- Output: Stemmed tokens after full preprocessing.

Note:
Ensure all necessary libraries and models (e.g., spaCy's `en_core_web_sm`) are installed before running the script.
"""
        
def clean_text(text, custom_stopwords=None, debug=False):
    # Step 1: Convert text to lowercase
    text = text.lower()
    
    # Step 2: Remove punctuation and numbers
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()  # Remove extra spaces
    
    # Step 3: Tokenize text
    tokens = tokenizer.tokenize(text)
    
    # Step 4: Remove stop words using NLTK and spaCy
    nltk_stopwords = set(stopwords.words('english'))
    tokens = [word for word in tokens if word not in nltk_stopwords]
    
    # Use spaCy's stop word removal
    doc = nlp(" ".join(tokens))
    tokens = [token.text for token in doc if not token.is_stop]
    
    # Step 5: Lemmatize using spaCy
    lemmatized = [token.lemma_ for token in nlp(" ".join(tokens))]
    
    # Step 6:  Stemming
    stemmed = [stemmer.stem(word) for word in lemmatized]
    
    if debug:
        print(f"Original text: {text}")
        print(f"Tokens: {tokens}")
        print(f"Lemmatized tokens: {lemmatized}")
        print(f"Stemmed tokens: {stemmed}")
    
    return stemmed

# Read sample text from json file
with open('ai_algorithms/initial_datasets.json') as file:
    # Read and save each individual text in the json file
    lines = file.readlines()
    for line in lines:
        # Create a substring containing only the text
        start_word = "text"
        end_word = "label"
        message = line.split(start_word, 1)
        if len(message) > 1:
            result = message[1].split(end_word, 1)[0].strip()
            text = result[4:len(result) - 4]
            print("")
            print(text)
            print(clean_text(text, debug=True))
            

# Example usage
# sample_text = "Natural Language Processing (NLP) is a sub-field of artificial intelligence (AI). It's a booming area!"
# cleaned_text = clean_text(sample_text, debug=True)
# print(cleaned_text)
