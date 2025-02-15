import spacy
import json
import uuid
import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Run text_cleaning.py to create the processed_data.json file
import text_cleaning

# Load spaCy language model for NLP tasks
nlp = spacy.load("en_core_web_sm")

# Download VADER lexicon for sentiment analysis
nltk.download('vader_lexicon')

def analyze_sentiment(tokens):
    """
    Compute sentiment scores for individual tokens and normalize them.

    Args:
        tokens (list of tuples): List of (word, POS) tuples.

    Returns:
        dict: Aggregated sentiment scores (positive, negative, neutral).
    """
    sia = SentimentIntensityAnalyzer()
    scores = [sia.polarity_scores(token[0]) for token in tokens]

    if not scores:  # Avoid division by zero
        return {"positive": 0.0, "negative": 0.0, "neutral": 1.0}

    # Normalize sentiment values to ensure balanced distribution
    total_tokens = len(scores)
    return {
        "positive": sum(score['pos'] for score in scores) / total_tokens,
        "negative": sum(score['neg'] for score in scores) / total_tokens,
        "neutral": sum(score['neu'] for score in scores) / total_tokens
    }

def analyze_overall_sentiment(text):
    """
    Analyze the overall sentiment of a given text.

    Args:
        text (str): The input sentence.

    Returns:
        dict: Overall sentiment scores (positive, negative, neutral, compound).
    """
    sia = SentimentIntensityAnalyzer()
    return sia.polarity_scores(text)

def analyze_entity_context(entities, tokens):
    """
    Identify flagged entities associated with negative words.

    Args:
        entities (list of tuples): Named entity recognition (NER) results.
        tokens (list of tuples): Tokenized words with POS tags.

    Returns:
        list: Entities flagged as potential indicators of harmful context.
    """
    negative_words = {"stupid", "dumb", "annoying", "loser"}
    return [
        entity[0] for entity in entities if entity[1] == "PERSON" and
        any(word[0].lower() in negative_words for word in tokens)
    ]

def extract_features(text):
    """
    Extract linguistic features from text using NLP techniques.

    Features:
    - Tokenization with POS tagging
    - Named Entity Recognition (NER)

    Args:
        text (str): Input text.

    Returns:
        dict: Extracted features including tokens and named entities.
    """
    doc = nlp(text)
    
    # Tokenize text and assign POS tags
    tokens = [(token.text, token.pos_) for token in doc]
    
    # Identify named entities
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    
    return {"tokens": tokens, "entities": entities}

def summarize_features(feature_data):
    """
    Generate distribution statistics for POS tags and named entities.

    Args:
        feature_data (list): List of extracted feature dictionaries.

    Returns:
        dict: Summary of POS tag and entity type distribution.
    """
    pos_counts = Counter(pos for record in feature_data for _, pos in record['tokens'])
    entity_counts = Counter(ent[1] for record in feature_data for ent in record['entities'])
    
    return {
        "POS Distribution": dict(pos_counts),
        "Entity Distribution": dict(entity_counts)
    }

def summarize_dataset(feature_data):
    """
    Compute dataset-wide summary statistics.

    Args:
        feature_data (list): Extracted and validated features.

    Returns:
        dict: Summary of POS tags, entity types, and average sentiment scores.
    """
    pos_counts = Counter(pos for record in feature_data for _, pos in record['tokens'])
    entity_counts = Counter(ent[1] for record in feature_data for ent in record['entities'])
    
    # Calculate average sentiment scores
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
    Validate extracted features by analyzing their relevance and sentiment.

    Args:
        feature_data (list): List of dictionaries containing extracted features.

    Returns:
        list: Feature data with additional validation statistics.
    """
    sia = SentimentIntensityAnalyzer()
    
    for record in feature_data:
        tokens = record['tokens']
        entities = record['entities']
        
        # Compute token and entity statistics
        token_count = len(tokens)
        entity_count = len(entities)
        
        # Identify negative adjectives within the text
        negative_adjectives = sum(
            1 for token, pos in tokens if pos == "ADJ" and token.lower() in ["stupid", "dumb", "annoying", "idiot", 
                                                                             "loser", "ugly", "hate", "worthless", 
                                                                             "lame", "embarrassing", "failure", "talentless", 
                                                                             "weak", "hideous", "gross", "fat", 
                                                                             "clueless", "brainless", "pathetic", "useless", 
                                                                             "lonely", "unpopular", "unwanted", "disappear",
                                                                             "disgusting", "fake", "terrible"]
        )
        
        # Compute sentiment scores at the token level
        sentiment_scores = [sia.polarity_scores(token[0]) for token in tokens]
        sentiment_summary = {
            "positive": sum(score['pos'] for score in sentiment_scores),
            "negative": sum(score['neg'] for score in sentiment_scores),
            "neutral": sum(score['neu'] for score in sentiment_scores)
        }
        
        # Identify flagged entities based on context
        flagged_entities = analyze_entity_context(entities, tokens)
        
        # Store validation results
        record['validation'] = {
            "token_count": token_count,
            "entity_count": entity_count,
            "negative_adjectives": negative_adjectives,
            "sentiment_summary": sentiment_summary,
            "flagged_entities": flagged_entities
        }
    
    return feature_data

def determine_severity(validation):
    """
    Determines the severity level of detected content based on extracted features.

    Args:
        validation (dict): Feature validation data including sentiment and flagged entities.

    Returns:
        str: Severity level ("low", "medium", or "high").
    """
    negative_score = validation["sentiment_summary"]["negative"]
    flagged_entities = len(validation["flagged_entities"])

    #  Adjusting thresholds
    if negative_score >= 1.5 or flagged_entities >= 2:
        return "high"
    elif 0.3 <= negative_score < 1.5 or flagged_entities == 1:  
        return "medium"
    return "low"


def generate_incident_reports(feature_data):
    """
    Generates structured incident reports based on extracted features.

    Args:
        feature_data (list): Processed feature dataset.

    Returns:
        list: List of incident reports.
    """
    incident_reports = []
    
    for i, record in enumerate(feature_data):
        severity = determine_severity(record["validation"])
        content_id = content_label(i)
        incident = {
            "content_id" : text_cleaning.get_content_id(i),  # Generate unique MongoDB-like ObjectID
            "incident_id": f"i{i+10000}",  # Unique incident ID
            "author_id": text_cleaning.get_author_id(i),
            #"detected_content_id": f"p{i+5000}",  # Unique detected content ID
            "content_type": text_cleaning.get_content_type(i),  # List type of content
            "severity_level": severity,
            "status": "pending review"
        }
        incident_reports.append(incident)

    return incident_reports

def content_label(i):
    type = text_cleaning.get_content_type(i)
    if type == "message":
        return "message_id"
    elif type == "comment":
        return "comment_id"
    elif type == "post":
        return "post_id"
    else:
        return "content_id"

def save_incident_reports(incident_reports, output_file="ai_algorithms/incident_reports.json"):
    """
    Saves the generated incident reports to a JSON file.

    Args:
        incident_reports (list): List of structured incident reports.
        output_file (str): Path to the output JSON file.
    """
    with open(output_file, "w") as f:
        json.dump(incident_reports, f, indent=4)
    
    print(f"Incident reports saved to {output_file}")

def process_and_save_features(input_file, output_file):
    """
    Load text data, extract features, validate them, assign severity levels, and save results.

    Args:
        input_file (str): Path to the input JSON file.
        output_file (str): Path to the output JSON/CSV file.
    """
    try:
        with open(input_file, 'r') as file:
            data = json.load(file)
        
        if not isinstance(data, list):
            print("Error: Input data is not in the expected list format.")
            return
        
        feature_data = []
        
        for record in data:
            if 'original' in record and 'processed' in record:
                text = record['original']
                cleaned_text = " ".join(record['processed'])
                features = extract_features(text)
                
                # Generate feature entry
                feature_entry = {
                    "original_text": text,
                    "cleaned_text": cleaned_text,
                    "tokens": features['tokens'],
                    "entities": features['entities']
                }
                
                # Validate extracted features
                validated_entry = validate_features([feature_entry])[0]

                # Assign severity level
                validated_entry["severity_level"] = determine_severity(validated_entry["validation"])

                feature_data.append(validated_entry)
        
        # Save updated dataset with severity levels
        with open(output_file, "w") as outfile:
            json.dump(feature_data, outfile, indent=4)

        print(f"Features with severity levels saved to {output_file}")

    except Exception as e:
        print(f"Error processing and saving features: {e}")

def visualize_summary(summary):
    """
    Generate visualizations for dataset summary statistics.

    Args:
        summary (dict): Summary statistics including POS and entity distributions.
    """
    # Plot POS tag distribution
    plt.bar(summary["POS Distribution"].keys(), summary["POS Distribution"].values())
    plt.title("POS Tag Distribution")
    plt.xlabel("POS Tags")
    plt.ylabel("Frequency")
    plt.savefig("ai_algorithms/POS_tag_distribution.png")
    plt.show()
    
    # Plot entity distribution
    plt.bar(summary["Entity Distribution"].keys(), summary["Entity Distribution"].values())
    plt.title("Entity Distribution")
    plt.xlabel("Entity Types")
    plt.ylabel("Frequency")
    plt.savefig("ai_algorithms/entity_distribution.png")
    plt.show()
    
    # Plot sentiment scores
    plt.bar(summary["Average Sentiments"].keys(), summary["Average Sentiments"].values())
    plt.title("Average Sentiment Scores")
    plt.xlabel("Sentiment Type")
    plt.ylabel("Score")
    plt.savefig("ai_algorithms/sentiment_scores.png")
    plt.show()
    

if __name__ == "__main__":
    """
    Main execution for feature extraction and analysis.
    """
    text_cleaning.main()  # Run text cleaning first

    input_file = "ai_algorithms/processed_data.json"
    output_file = "ai_algorithms/feature_dataset.json"

    process_and_save_features(input_file, output_file)

    # Load extracted feature data
    with open(output_file, "r") as file:
        feature_data = json.load(file)

    # Generate and save incident reports
    incident_reports = generate_incident_reports(feature_data)
    save_incident_reports(incident_reports, "ai_algorithms/incident_reports.json")

    # Summarize dataset
    summary = summarize_dataset(feature_data)
    visualize_summary(summary)

