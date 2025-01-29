import spacy
import json
import pandas as pd

import matplotlib.pyplot as plt
from collections import Counter
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

from collections import Counter


# Load spaCy language model
nlp = spacy.load("en_core_web_sm")
nltk.download('vader_lexicon')

def analyze_sentiment(tokens):
    sia = SentimentIntensityAnalyzer()
    scores = [sia.polarity_scores(token[0]) for token in tokens]
    return {"positive": sum(score['pos'] for score in scores), 
            "negative": sum(score['neg'] for score in scores),
            "neutral": sum(score['neu'] for score in scores)}

def analyze_overall_sentiment(text):
    """
    Analyze the overall sentiment of a sentence or text.
    Args:
        text (str): Input text.

    Returns:
        dict: Overall sentiment scores (positive, neutral, negative, compound).
    """
    sia = SentimentIntensityAnalyzer()
    return sia.polarity_scores(text)

def analyze_entity_context(entities, tokens):
    negative_words = ["stupid", "dumb", "annoying", "loser"]
    flagged_entities = [
        entity[0] for entity in entities if entity[1] == "PERSON" and 
        any(word[0].lower() in negative_words for word in tokens)
    ]
    return flagged_entities

def extract_features(text):
    """
    Extract features from text using spaCy.
    Features:
    1. Tokenization with POS tagging.
    2. Named Entity Recognition (NER).

    Args:
        text (str): Input text.

    Returns:
        dict: A dictionary with tokenized text, POS tags, and named entities.
    """
    doc = nlp(text)
    
    # Tokenization and POS tagging
    tokens = [(token.text, token.pos_) for token in doc]
    
    # Named Entity Recognition (NER)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    
    return {"tokens": tokens, "entities": entities}


def summarize_features(feature_data):
    pos_counts = Counter(pos for record in feature_data for _, pos in record['tokens'])
    entity_counts = Counter(ent[1] for record in feature_data for ent in record['entities'])
    return {
        "POS Distribution": dict(pos_counts),
        "Entity Distribution": dict(entity_counts)
    }

def summarize_dataset(feature_data):
    """
    Summarize the feature dataset.
    Args:
        feature_data (list): Extracted and validated features.

    Returns:
        dict: Summary statistics for the dataset.
    """
    pos_counts = Counter(pos for record in feature_data for _, pos in record['tokens'])
    entity_counts = Counter(ent[1] for record in feature_data for ent in record['entities'])
    avg_sentiments = {
        "positive": sum(record['validation']['sentiment_summary']['positive'] for record in feature_data) / len(feature_data),
        "negative": sum(record['validation']['sentiment_summary']['negative'] for record in feature_data) / len(feature_data),
        "neutral": sum(record['validation']['sentiment_summary']['neutral'] for record in feature_data) / len(feature_data)
    }
    return {
        "POS Distribution": dict(pos_counts),
        "Entity Distribution": dict(entity_counts),
        "Average Sentiments": avg_sentiments
    }


def validate_features(feature_data):
    """
    Validate the extracted features by analyzing their relevance.

    Args:
        feature_data (list): List of feature dictionaries for each text.

    Returns:
        list: Updated feature data with validation statistics.
    """

    sia = SentimentIntensityAnalyzer()

    for record in feature_data:
        tokens = record['tokens']
        entities = record['entities']
        

        # Analyze token and entity statistics
        token_count = len(tokens)
        entity_count = len(entities)

        # Analyze token statistics
        token_count = len(tokens)
        entity_count = len(entities)
        
        # Count negative adjectives (e.g., insults in bullying contexts)

        negative_adjectives = sum(
            1 for token, pos in tokens if pos == "ADJ" and token.lower() in ["stupid", "dumb", "annoying"]
        )
        

        # Analyze sentiment of tokens
        sentiment_scores = [sia.polarity_scores(token[0]) for token in tokens]
        sentiment_summary = {
            "positive": sum(score['pos'] for score in sentiment_scores),
            "negative": sum(score['neg'] for score in sentiment_scores),
            "neutral": sum(score['neu'] for score in sentiment_scores)
        }
        
        # Contextual analysis for named entities
        flagged_entities = [
            entity[0] for entity in entities if entity[1] == "PERSON" and 
            any(token[0].lower() in ["stupid", "dumb", "annoying", "loser"] for token in tokens)
        ]
        

        # Add validation statistics
        record['validation'] = {
            "token_count": token_count,
            "entity_count": entity_count,

            "negative_adjectives": negative_adjectives,
            "sentiment_summary": sentiment_summary,
            "flagged_entities": flagged_entities

            "negative_adjectives": negative_adjectives

        }
    return feature_data

def process_and_save_features(input_file, output_file):
    """
    Process cleaned text, extract features, validate them, and save to a structured dataset.

    Args:
        input_file (str): Path to the input JSON file containing cleaned text.
        output_file (str): Path to the output JSON/CSV file for saving features.
    """
    try:
        # Load cleaned text data
        with open(input_file, 'r') as file:
            data = json.load(file)
        
        # Ensure input data is a list
        if not isinstance(data, list):
            print("Error: Input data is not a list.")
            return
        
        feature_data = []
        
        # Extract features for each record
        for record in data:
            if 'original' in record and 'processed' in record:
                text = record['original']
                cleaned_text = " ".join(record['processed'])
                features = extract_features(text)
                
                # Combine original, cleaned, and features into one structure
                feature_entry = {
                    "original_text": text,
                    "cleaned_text": cleaned_text,
                    "tokens": features['tokens'],
                    "entities": features['entities']
                }
                feature_data.append(feature_entry)
        
        # Validate the feature set
        feature_data = validate_features(feature_data)
        
        # Save to structured file
        if output_file.endswith('.json'):
            with open(output_file, 'w') as outfile:
                json.dump(feature_data, outfile, indent=4)
        elif output_file.endswith('.csv'):
            df = pd.DataFrame(feature_data)
            df.to_csv(output_file, index=False)
        else:
            print("Error: Unsupported file format. Use .json or .csv.")
        
        print(f"Features saved to {output_file}")
    except Exception as e:
        print(f"Error processing and saving features: {e}")

def visualize_summary(summary):
    """
    Visualize dataset summary statistics.
    Args:
        summary (dict): Summary statistics from summarize_dataset.
    """
    # POS Distribution
    plt.bar(summary["POS Distribution"].keys(), summary["POS Distribution"].values())
    plt.title("POS Tag Distribution")
    plt.xlabel("POS Tags")
    plt.ylabel("Frequency")
    plt.show()

    # Entity Distribution
    plt.bar(summary["Entity Distribution"].keys(), summary["Entity Distribution"].values())
    plt.title("Entity Distribution")
    plt.xlabel("Entity Types")
    plt.ylabel("Frequency")
    plt.show()

    # Average Sentiments
    plt.bar(summary["Average Sentiments"].keys(), summary["Average Sentiments"].values())
    plt.title("Average Sentiment Scores")
    plt.xlabel("Sentiment Type")
    plt.ylabel("Score")
    plt.show()

if __name__ == "__main__":
    """

    Main execution for feature extraction and analysis.

    Main execution for feature extraction.
    - Load cleaned data.
    - Extract features (tokens, POS, NER).
    - Validate feature set.
    - Save structured features to a file.

    """
    input_file = "ai_algorithms/processed_data.json"  # Input cleaned text file
    output_file = "ai_algorithms/feature_dataset.json"  # Output file for features

    process_and_save_features(input_file, output_file)


    # Load the processed feature data
    with open(output_file, 'r') as file:
        feature_data = json.load(file)

    # Summarize and visualize dataset
    summary = summarize_dataset(feature_data)
    visualize_summary(summary)


