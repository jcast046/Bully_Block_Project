"""
Feature extraction and analysis for cyberbullying detection.

This script implements NLP-based feature extraction and analysis for cyberbullying
detection. It includes sentiment analysis, entity recognition, and severity
classification.

Features:
- Sentiment analysis using NLTK's VADER
- Named entity recognition using spaCy
- TF-IDF feature extraction
- Severity level classification
- Visualization of analysis results

Modules Used:
- spacy: For NLP tasks and entity recognition
- nltk: For sentiment analysis
- sklearn: For TF-IDF feature extraction
- matplotlib: For visualization
- json: For reading and writing JSON files
- os: For file path operations
- pandas: For data manipulation
- uuid: For generating unique identifiers

Workflow:
1. Run text cleaning to create processed data
2. Extract features from processed text
3. Validate and analyze features
4. Generate incident reports
5. Create visualizations of the analysis
"""

import spacy
import json
import uuid
import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.util import ngrams
from sklearn.feature_extraction.text import TfidfVectorizer
import os

# Get the base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Run text_cleaning.py to create the processed_data.json file
import text_cleaning

# Load spaCy language model for NLP tasks
nlp = spacy.load("en_core_web_sm")

# Download VADER lexicon for sentiment analysis
nltk.download('vader_lexicon')

low_severity = 0
high_severity = 0

severity_levels = ["low", "high"]
severity_level_totals = [low_severity, high_severity]

def analyze_sentiment(tokens):
    """Compute sentiment scores for individual tokens and normalize them.

    Args:
        tokens (list): List of (word, POS) tuples containing tokenized words and their parts of speech

    Returns:
        dict: Dictionary containing normalized sentiment scores with keys:
            - positive (float): Normalized positive sentiment score
            - negative (float): Normalized negative sentiment score
            - neutral (float): Normalized neutral sentiment score
    """
    sia = SentimentIntensityAnalyzer()
    
    # Get sentiment scores for each token
    scores = [sia.polarity_scores(token[0]) for token in tokens]
    
    if not scores:  # Avoid division by zero
        return {"positive": 0.0, "negative": 0.0, "neutral": 1.0}

    # Calculate raw scores
    total_pos = sum(score['pos'] for score in scores)
    total_neg = sum(score['neg'] for score in scores)
    total_neu = sum(score['neu'] for score in scores)
    
    # Calculate compound score for overall sentiment
    compound = sum(score['compound'] for score in scores)
    
    # Normalize based on compound score
    if compound > 0.05:  # Positive sentiment
        return {
            "positive": min(1.0, total_pos * 2.0),
            "negative": max(0.0, total_neg * 0.3),
            "neutral": max(0.0, total_neu * 0.2)
        }
    elif compound < -0.05:  # Negative sentiment
        return {
            "positive": max(0.0, total_pos * 0.3),
            "negative": min(1.0, total_neg * 2.0),
            "neutral": max(0.0, total_neu * 0.2)
        }
    else:  # Neutral sentiment
        return {
            "positive": total_pos * 0.8,
            "negative": total_neg * 0.8,
            "neutral": total_neu * 0.5
        }

def analyze_overall_sentiment(text):
    """Analyze the overall sentiment of a given text.

    Args:
        text (str): The input text to analyze

    Returns:
        dict: Dictionary containing sentiment scores with keys:
            - pos (float): Positive sentiment score
            - neg (float): Negative sentiment score
            - neu (float): Neutral sentiment score
            - compound (float): Overall compound sentiment score
    """
    sia = SentimentIntensityAnalyzer()
    return sia.polarity_scores(text)

def analyze_entity_context(entities, tokens):
    """Identify flagged entities associated with negative words.

    Args:
        entities (list): List of (text, label) tuples from named entity recognition
        tokens (list): List of (word, POS) tuples containing tokenized words

    Returns:
        list: List of entity texts that are flagged as potential indicators of harmful context
    """
    negative_words = {"stupid", "dumb", "annoying", "loser"}
    return [
        entity[0] for entity in entities if entity[1] == "PERSON" and
        any(word[0].lower() in negative_words for word in tokens)
    ]

def extract_features(text):
    """Extract linguistic features from text using NLP techniques.

    Args:
        text (str): Input text to analyze

    Returns:
        dict: Dictionary containing extracted features with keys:
            - tokens (list): List of (word, POS) tuples
            - entities (list): List of (text, label) tuples from named entity recognition
    """
    doc = nlp(text)
    
    # Tokenize text and assign POS tags
    tokens = [(token.text, token.pos_) for token in doc]
    
    # Identify named entities
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    
    return {"tokens": tokens, "entities": entities}

def summarize_features(feature_data):
    """Generate distribution statistics for POS tags and named entities.

    Args:
        feature_data (list): List of dictionaries containing extracted features

    Returns:
        dict: Dictionary containing summary statistics with keys:
            - POS Distribution (dict): Distribution of parts of speech tags
            - Entity Distribution (dict): Distribution of named entity types
    """
    pos_counts = Counter(pos for record in feature_data for _, pos in record['tokens'])
    entity_counts = Counter(ent[1] for record in feature_data for ent in record['entities'])
    
    return {
        "POS Distribution": dict(pos_counts),
        "Entity Distribution": dict(entity_counts)
    }

def summarize_dataset(feature_data):
    """Compute dataset-wide summary statistics.

    Args:
        feature_data (list): List of dictionaries containing extracted and validated features

    Returns:
        dict: Dictionary containing dataset summary with keys:
            - POS Distribution (dict): Distribution of parts of speech tags
            - Entity Distribution (dict): Distribution of named entity types
            - Average Sentiments (dict): Average sentiment scores across the dataset
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
    """Validate extracted features by analyzing their relevance and sentiment.

    Args:
        feature_data (list): List of dictionaries containing extracted features

    Returns:
        list: List of feature dictionaries with additional validation statistics including:
            - token_count (int): Number of tokens
            - entity_count (int): Number of entities
            - negative_adjectives (int): Count of negative adjectives
            - positive_adjectives (int): Count of positive adjectives
            - custom_negative_score (float): Custom severity score
            - total_negative (float): Combined negative sentiment score
            - sentiment_summary (dict): Overall sentiment analysis
            - flagged_entities (list): List of potentially harmful entities
    """
    sia = SentimentIntensityAnalyzer()
    
    # Assign custom severity lexicon for negative words
    severity_lexicon = {
        "stupid": -0.3, "dumb": -0.3, "annoying": -0.3, "idiot": -0.3, "loser": -0.3, "ugly": -0.8, "hate": -0.6, "worthless": -0.8,
        "lame": -0.3, "embarrassing": -0.3, "failure": -0.3, "talentless":-0.3, "weak": -0.3, "hideous": -0.3, "gross": -0.3, "fat": -0.3,
        "clueless": -0.3, "brainless": -0.3, "pathetic": -0.3, "useless": -0.3, "lonely": -0.3, "unpopular": -0.3, "unwanted": -0.3,
        "disappear": -0.3, "disgusting": -0.3, "fake": -0.3, "terrible": -0.3, "cheat": -0.3, "fuck": -1, "gay": -1, "ass": -1, "shit": -1,
        "whore": -1.5, "slut": -1.5, "bitch": -1.5, "pussy": -0.3, "die": -1.5, "kill": -1.5, "trash": -0.3, "garbage": -0.3, "cringe": -0.3,
        "dumbass": -0.3, "scum": -0.3, "fail":-0.3, "awful": -0.3, "toxic": -0.3, "clown": -0.3, "stinks": -0.3, "waste": -0.3, "losers": -0.3,
        "bozo": -0.3, "coward": -0.3, "weirdo": -0.3, "dipshit": -0.3, "fatass": -0.3, "nobody": -0.3, "moron": -0.3, "idiotic": -0.3,
        "spineless": -0.3, "incompetent": -0.3, "ridiculous": -0.3, "foolish": -0.3, "dunce": -0.3, "imbecile": -0.3, "dimwit": -0.3,
        "simpleton": -0.3, "asshole": -0.3, "bitchass": -0.3, "dick": -0.3, "fucking": -0.3, "motherfucker": -0.3,
        "nasty": -0.3, "pig": -0.3, "uninstall": -0.3, "creepy": -0.3, "scumbag": -0.3, "cheater": -0.3, "unloved": -0.3, "unwanted": -0.3,
        "broke": -0.3, "smelly": -0.3, "creature": -0.3, "joke": -0.3, "lowlife": -0.3, "rat": -0.3, "kill yourself": -0.3, "loser": -0.3, 
        "nobody": -0.3, "ugly": -0.3, "worthless": -0.3, "disgusting": -0.3, "freak": -0.3, "sick": -0.3, "pathetic": -0.3,
        "disgrace": -0.3, "wretched": -0.3, "sickening": -0.3, "repulsive": -0.3, "detestable": -0.3, "abominable": -0.3, "vile": -0.3,
        "no one likes you": -0.3, "nobody cares": -0.3, "go die": -0.3, "shut up": -0.3, "get lost": -0.3, "go away": -0.3,
        "waste of space": -0.3, "walking L": -0.3, "drop out": -0.3, "go cry": -0.3, "stop talking": -0.3, "just quit": -0.3,
        "your mom": -0.3, "poor": -0.3, "failure at life": -0.3, "so annoying": -0.3, "hate you": -0.3, "why are you here": -0.3,
        "disease": -0.3, "social suicide": -0.3, "cringe af": -0.3, "walking disaster": -0.3, "born on a highway": -0.3,
        "should be illegal": -0.3, "mental case": -0.3, "go choke": -0.3, "too dumb to live": -0.3, "choke on": -0.3,
        "dumbest person": -0.3, "disappointment": -0.3, "busted": -0.3, "rotten": -0.3, "clapped": -0.3, "bald": -0.3,
        "gremlin": -0.3, "lard": -0.3, "toothpick": -0.3, "snitch": -0.3, "wannabe": -0.3, "poser": -0.3, "zero purpose": -0.3,
        "waste of air": -0.3, "reject": -0.3, "bot": -0.3, "get wrecked": -0.3, "you suck": -0.3, "shithead": -0.3, "dickhead": -0.3, 
        "jackass": -0.3, "bastard": -0.3, "motherfucker": -0.3, "cocksucker": -0.3, "cock": -0.3,"douche": -0.3, "douchebag": -0.3, 
        "prick": -0.3, "twat": -0.3, "ballsack": -0.3, "nutsack": -0.3, "tit": -0.3, "tits": -0.3, "nipple": -0.3, "hella": -0.3, "bullshit": -0.3,
        "horse shit": -0.3, "piss": -0.3, "pissed": -0.3, "pissed off": -0.3,"son of a bitch": -0.3, "bitching": -0.3, "screw you": -0.3,
        "suck my": -0.3, "sucking": -0.3, "lick me": -0.3, "dickwad": -0.3, "dickface": -0.3, "asswipe": -0.3, "shitshow": -0.3, 
        "fuckwit": -0.3, "twatwaffle": -0.3, "cunt": -1.5, "pussyass": -0.3, "assclown": -0.3, "shitbag": -0.3, "fuckface": -0.3,
        "retard": -0.8       
    }
    
    for record in feature_data:
        tokens = record['tokens']
        entities = record['entities']
        
        # Compute token and entity statistics
        token_count = len(tokens)
        entity_count = len(entities)
        
        # Initialize severity score
        custom_negative_score = 0
        
        # Iterate through tokens and collect custom negative score
        for token, _ in tokens:
            token_lower = token.lower()
            if token_lower in severity_lexicon:
                # Add severity score if word is in lexicon
                custom_negative_score += abs(severity_lexicon[token_lower])
        
        # Create bigrams from tokens
        # token_list = [token.lower() for token, pos in tokens]
        # bigrams = [" ".join(bigram) for bigram in ngrams(token_list, 2)]
        
        # Identify negative adjectives within the text
        negative_adjectives = sum(
            1 for token, pos in tokens if pos == "ADJ" and token.lower() in ["stupid", "dumb", "annoying", "idiot", "loser", "ugly", "hate", "worthless",
                                                                             "lame", "embarrassing", "failure", "talentless", "weak", "hideous", "gross", "fat",
                                                                             "clueless", "brainless", "pathetic", "useless", "lonely", "unpopular", "unwanted",
                                                                             "disappear", "disgusting", "fake", "terrible", "cheat", "fuck", "gay", "ass", "shit",
                                                                             "whore", "slut", "bitch", "pussy", "die", "kill", "trash", "garbage", "cringe",
                                                                             "dumbass", "scum", "fail", "awful", "toxic", "clown", "stinks", "waste", "losers",
                                                                             "bozo", "coward", "weirdo", "dipshit", "fatass", "nobody", "moron", "idiotic",
                                                                             "spineless", "incompetent", "ridiculous", "foolish", "dunce", "imbecile", "dimwit",
                                                                             "simpleton", "asshole", "bitchass", "dick", "fucking", "motherfucker",
                                                                             "nasty", "pig", "uninstall", "creepy", "scumbag", "cheater", "unloved", "unwanted",
                                                                             "broke", "smelly", "creature", "joke", "lowlife", "rat", "kill yourself", "loser", 
                                                                             "nobody", "ugly", "worthless", "disgusting", "freak", "sick", "pathetic",
                                                                             "disgrace", "wretched", "sickening", "repulsive", "detestable", "abominable", "vile",
                                                                             "no one likes you", "nobody cares", "go die", "shut up", "get lost", "go away",
                                                                             "waste of space", "walking L", "drop out", "go cry", "stop talking", "just quit",
                                                                             "your mom", "poor", "failure at life", "so annoying", "hate you", "why are you here",
                                                                             "disease", "social suicide", "cringe af", "walking disaster", "born on a highway",
                                                                             "should be illegal", "mental case", "go choke", "too dumb to live", "choke on",
                                                                             "dumbest person", "disappointment", "busted", "rotten", "clapped", "bald",
                                                                             "gremlin", "lard", "toothpick", "snitch", "wannabe", "poser", "zero purpose",
                                                                             "waste of air", "reject", "bot", "get wrecked", "you suck",  "shithead", "dickhead", 
                                                                             "jackass", "bastard", "motherfucker", "cocksucker", "cock","douche", "douchebag", 
                                                                             "prick", "twat", "ballsack", "nutsack", "tit", "tits", "nipple", "hella", "bullshit",
                                                                             "horse shit", "piss", "pissed", "pissed off","son of a bitch", "bitching", "screw you",
                                                                             "suck my", "sucking", "lick me", "dickwad", "dickface", "asswipe", "shitshow", 
                                                                             "fuckwit", "twatwaffle", "cunt", "pussyass", "assclown", "shitbag", "fuckface",
                                                                             "retard"]
        )

        # Identify positive adjectives within the text
        positive_adjectives = sum(
            1 for token, pos in tokens if pos == "ADJ" and token.lower() in ["amazing", "awesome", "brilliant", "excellent", "fantastic", "great", "incredible", 
                                                                             "outstanding", "perfect", "phenomenal", "remarkable", "spectacular", "superb", 
                                                                             "terrific", "wonderful", "beautiful", "brave", "bright", "calm", "cheerful", 
                                                                             "clever", "confident", "creative", "determined", "energetic", "friendly", 
                                                                             "generous", "gentle", "happy", "helpful", "honest", "intelligent", "kind", 
                                                                             "loving", "loyal", "patient", "peaceful", "polite", "powerful", "proud", 
                                                                             "reliable", "respectful", "responsible", "sincere", "smart", "strong", 
                                                                             "successful", "talented", "thoughtful", "trustworthy", "wise", "witty", 
                                                                             "worthy", "admirable", "adorable", "agreeable", "charming", "courageous", 
                                                                             "dedicated", "diligent", "elegant", "enthusiastic", "excited", "faithful", 
                                                                             "fearless", "graceful", "grateful", "heroic", "hopeful", "humble", "inspiring", 
                                                                             "joyful", "magnificent", "marvelous", "noble", "optimistic", "passionate", 
                                                                             "radiant", "splendid", "stellar", "supportive", "tender", "thoughtful", 
                                                                             "triumphant", "valiant", "valuable", "vibrant", "victorious", "virtuous", 
                                                                             "warm", "welcome", "worthy", "zealous"]
        )
        
        # Get overall text sentiment
        text = " ".join(token[0] for token in tokens)
        overall_sentiment = sia.polarity_scores(text)
        
        # Calculate token-level sentiment
        token_sentiment_scores = [sia.polarity_scores(token[0]) for token in tokens]
        
        
        # Sum up individual token sentiment scores
        token_positive = sum(score['pos'] for score in token_sentiment_scores)
        token_negative = sum(score['neg'] for score in token_sentiment_scores)
        token_neutral = sum(score['neu'] for score in token_sentiment_scores)
        
        # Combine custom severity score with VADER negative sentiment
        total_negative = token_negative + custom_negative_score
        
        # Combine token-level and overall sentiment
        sentiment_summary = {
            "positive": max(overall_sentiment['pos'], token_positive),
            "negative": max(overall_sentiment['neg'], token_negative),
            "neutral": min(overall_sentiment['neu'], token_neutral)
        }
        
        # Identify flagged entities based on context
        flagged_entities = analyze_entity_context(entities, tokens)
        
        # Store validation results
        record['validation'] = {
            "token_count": token_count,
            "entity_count": entity_count,
            "negative_adjectives": negative_adjectives,
            "positive_adjectives": positive_adjectives,
            "custom_negative_score:": custom_negative_score,
            "total_negative": total_negative,
            "sentiment_summary": sentiment_summary,
            "flagged_entities": flagged_entities
        }
    
    return feature_data

def determine_severity(validation):
    """Determine the severity level of detected content based on extracted features.

    Args:
        validation (dict): Dictionary containing feature validation data including:
            - total_negative (float): Combined negative sentiment score
            - sentiment_summary (dict): Overall sentiment analysis
            - negative_adjectives (int): Count of negative adjectives
            - positive_adjectives (int): Count of positive adjectives
            - flagged_entities (list): List of potentially harmful entities

    Returns:
        str: Severity level classification ("zero", "low", or "high")
    """
    # Get combined total negative score
    total_negative = validation.get("total_negative", 0)
    
    # Get sentiment scores
    positive_score = validation["sentiment_summary"]["positive"]
    neutral_score = validation["sentiment_summary"]["neutral"]
    
    # Get adjective counts
    negative_adj_count = validation["negative_adjectives"]
    positive_adj_count = validation["positive_adjectives"]
    
    # Get flagged entities
    flagged_entities = len(validation["flagged_entities"])
    
    # Calculate overall sentiment balance
    sentiment_balance = positive_score - total_negative
    
    # High severity conditions:
    # 1. High negative sentiment with multiple negative adjectives
    # 2. Multiple flagged entities
    # 3. Strong negative sentiment imbalance
    # 4. Single negative adjective with high negative sentiment
    if ( total_negative > 1.5 and negative_adj_count >= 1) or \
        ( total_negative >= 2.5 and negative_adj_count == 0) or \
        flagged_entities >= 2 or \
        sentiment_balance <= -2 or \
        (negative_adj_count >= 1 and total_negative >= 1.5):
            global high_severity
            high_severity += 1 
            return "high" 
    
    # Low severity conditions:
    # 1. Moderate negative sentiment with some negative adjectives
    # 2. High negative sentiment with no negative adjectives
    # 3. Single flagged entity
    # 4. Slight negative sentiment imbalance
    # 5. High neutral sentiment with negative adjectives
    elif (0.3 <= total_negative < 1.5 and negative_adj_count >= 1) or \
         (total_negative >= 1.5 and negative_adj_count == 0) or \
         flagged_entities == 1 or \
         -0.5 <= sentiment_balance < 0 or \
         (neutral_score > 0.7 and negative_adj_count >= 0):
            global low_severity
            low_severity += 1
            return "low"
    
    # Zero severity conditions:
    # 1. Positive sentiment outweighs negative
    # 2. No negative adjectives and no flagged entities
    # 3. Strong positive sentiment or positive adjectives
    # 4. High neutral sentiment with positive adjectives
    elif sentiment_balance > 0 or \
         (negative_adj_count == 0 and flagged_entities == 0) or \
         positive_score >= 0.8 or \
         positive_adj_count >= 1 or \
         (neutral_score > 0.7 and positive_adj_count >= 1):
        return "zero"
    
    # Default to low severity if no clear indicators
    return "zero"

def compute_tfidf(processed_texts):
    """Compute TF-IDF features for processed texts.

    Args:
        processed_texts (list): List of cleaned and tokenized text strings

    Returns:
        tuple: Contains:
            - numpy.ndarray: TF-IDF feature matrix
            - numpy.ndarray: Array of feature names
    """
    vectorizer = TfidfVectorizer(max_features=500)
    tfidf_matrix = vectorizer.fit_transform(processed_texts)
    return tfidf_matrix.toarray(), vectorizer.get_feature_names_out()

def generate_incident_reports(feature_data):
    """Generate structured incident reports based on extracted features.

    Args:
        feature_data (list): List of dictionaries containing processed feature data

    Returns:
        list: List of incident report dictionaries containing:
            - content_id (str): Unique content identifier
            - incident_id (str): Unique incident identifier
            - author_id (str): Author identifier
            - content_type (str): Type of content
            - severity_level (str): Determined severity level
            - status (str): Current status of the incident
    """
    incident_reports = []
    
    for i, record in enumerate(feature_data):
        severity = determine_severity(record["validation"])
        incident = {
            "content_id" : text_cleaning.get_content_id(i),  # Generate unique MongoDB-like ObjectID
            "incident_id": f"i{i+10000}",  # Unique incident ID
            "author_id": text_cleaning.get_author_id(i),
            "content_type": text_cleaning.get_content_type(i),  # List type of content
            "severity_level": severity,
            "status": "pending review"
        }
        incident_reports.append(incident)

    return incident_reports

def save_incident_reports(incident_reports, output_file=os.path.join("ai_algorithms", "incident_reports.json")):
    """Save the generated incident reports to a JSON file.

    Args:
        incident_reports (list): List of structured incident report dictionaries
        output_file (str, optional): Path to the output JSON file. Defaults to "ai_algorithms/incident_reports.json"
    """
    with open(os.path.join(BASE_DIR, output_file), "w") as f:
        json.dump(incident_reports, f, indent=4)
    
    print(f"Incident reports saved to {output_file}")

def process_and_save_features(input_file, output_file):
    """Process text data, extract features, validate them, and save results.

    Args:
        input_file (str): Path to the input JSON file containing text data
        output_file (str): Path to save the processed features and analysis results

    Raises:
        Exception: If there's an error processing the data or saving the results
    """
    try:
        with open(os.path.join(BASE_DIR, input_file), 'r') as file:
            data = json.load(file)
        
        if not isinstance(data, list):
            print("Error: Input data is not in the expected list format.")
            return
        
        feature_data = []
        processed_texts = []

        for record in data:
            if 'original' in record and 'processed' in record:
                text = record['original']
                cleaned_text = " ".join(record['processed'])
                processed_texts.append(cleaned_text)

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

        # Compute TF-IDF and update feature dataset
        tfidf_matrix, tfidf_features = compute_tfidf(processed_texts)

        for i, entry in enumerate(feature_data):
            entry["tfidf_features"] = dict(zip(tfidf_features, tfidf_matrix[i]))

        # Save updated dataset with severity levels
        with open(os.path.join(BASE_DIR, output_file), "w") as outfile:
            json.dump(feature_data, outfile, indent=4)

        print(f"Features with severity levels and TF-IDF saved to {output_file}")

    except Exception as e:
        print(f"Error processing and saving features: {e}")

def visualize_summary(summary):
    """Generate visualizations for dataset summary statistics and severity levels.

    Args:
        summary (dict): Dictionary containing summary statistics including:
            - POS Distribution (dict): Distribution of parts of speech tags
            - Entity Distribution (dict): Distribution of named entity types
            - Average Sentiments (dict): Average sentiment scores
    """
    # Plot proportions
    screen_width_px = 1920
    screen_height_px = 1080
    dpi = 100
    screen_width_in = screen_width_px / dpi
    screen_height_in = screen_height_px / dpi
    
    # Plot POS tag distribution
    plt.figure(figsize=(1280/100, 720/100))
    plt.bar(summary["POS Distribution"].keys(), summary["POS Distribution"].values())
    plt.title("Part-of-Speech (POS) Tag Distribution")
    plt.xlabel("POS Tags")
    plt.ylabel("Frequency")
    plt.savefig(os.path.join(BASE_DIR, "ai_algorithms", "POS_tag_distribution.png"), dpi=dpi, bbox_inches='tight')
    #plt.show()
    
    # Plot entity distribution
    plt.figure(figsize=(screen_width_in, screen_height_in))
    plt.bar(summary["Entity Distribution"].keys(), summary["Entity Distribution"].values())
    plt.title("Entity Distribution")
    plt.xlabel("Entity Types")
    plt.ylabel("Frequency")
    plt.savefig(os.path.join(BASE_DIR, "ai_algorithms", "entity_distribution.png"), dpi=dpi, bbox_inches='tight')
    #plt.show()
    
    # Plot sentiment scores
    plt.figure(figsize=(screen_width_in, screen_height_in))
    plt.bar(summary["Average Sentiments"].keys(), summary["Average Sentiments"].values())
    plt.title("Average Sentiment Scores")
    plt.xlabel("Sentiment Type")
    plt.ylabel("Score")
    plt.savefig(os.path.join(BASE_DIR, "ai_algorithms", "sentiment_scores.png"), dpi=dpi, bbox_inches='tight')
    #plt.show()
    
    # Plot severity levels
    plt.figure(figsize=(screen_width_in, screen_height_in))
    plt.bar(severity_levels, [low_severity / 2, high_severity / 2])
    plt.title("Severity Level Incidents")
    plt.xlabel("Severity Level")
    plt.ylabel("Total Incidents")
    plt.savefig(os.path.join(BASE_DIR, "ai_algorithms", "severity_levels.png"), dpi=dpi, bbox_inches='tight')
    
    print(f"Low Severity: {low_severity / 2}")
    print(f"High Severity: {high_severity / 2}")

if __name__ == "__main__":
    """Execute the feature extraction and analysis pipeline.
    
    This block orchestrates the following steps:
    1. Run text cleaning
    2. Process and save features
    3. Generate incident reports
    4. Create visualizations of the analysis
    """
    text_cleaning.main()  # Run text cleaning first

    input_file = os.path.join("ai_algorithms", "processed_data.json")
    output_file = os.path.join("ai_algorithms", "feature_dataset.json")

    process_and_save_features(input_file, output_file)

    # Load extracted feature data
    with open(os.path.join(BASE_DIR, output_file), "r") as file:
        feature_data = json.load(file)

    # Generate and save incident reports
    incident_reports = generate_incident_reports(feature_data)
    save_incident_reports(incident_reports, os.path.join("ai_algorithms", "incident_reports.json"))

    # Summarize dataset
    summary = summarize_dataset(feature_data)
    visualize_summary(summary)

