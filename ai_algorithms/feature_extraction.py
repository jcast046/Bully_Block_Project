import spacy
import json
import pandas as pd

# Load spaCy language model
nlp = spacy.load("en_core_web_sm")

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

def process_and_save_features(input_file, output_file):
    """
    Process cleaned text, extract features, and save to a structured dataset.

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
        
        # Ensure the feature_data list is not empty before saving
        if not feature_data:
            print("Error: No features extracted. Check input data.")
            return
        
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

if __name__ == "__main__":
    """
    Main execution for feature extraction.
    - Load cleaned data.
    - Extract features (tokens, POS, NER).
    - Save structured features to a file.
    """
    input_file = "ai_algorithms/processed_data.json"  # Input cleaned text file
    output_file = "ai_algorithms/feature_dataset.json"  # Output file for features

    process_and_save_features(input_file, output_file)
