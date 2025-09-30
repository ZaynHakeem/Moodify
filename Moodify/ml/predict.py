#!/usr/bin/env python3
"""
Mood prediction service.
Loads the trained model and provides predictions for input text.
"""

import sys
import json
import joblib
import os
from pathlib import Path

def load_model():
    """Load the trained mood classifier."""
    model_path = Path(__file__).parent / 'mood_classifier.pkl'
    
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found at {model_path}. "
            "Please run train_model.py first to create the model."
        )
    
    return joblib.load(model_path)

def predict_mood(text, model=None):
    """
    Predict mood from text input.
    
    Args:
        text: Input text to analyze
        model: Pre-loaded model (optional, will load if not provided)
    
    Returns:
        dict with 'mood' and 'confidence' and 'all_predictions'
    """
    if model is None:
        model = load_model()
    
    # Get prediction probabilities
    probabilities = model.predict_proba([text])[0]
    classes = model.classes_
    
    # Sort by confidence
    mood_confidences = sorted(
        zip(classes, probabilities),
        key=lambda x: x[1],
        reverse=True
    )
    
    # Format results
    primary_mood, primary_confidence = mood_confidences[0]
    
    return {
        'mood': primary_mood,
        'confidence': round(float(primary_confidence) * 100, 2),
        'all_predictions': [
            {
                'mood': mood,
                'confidence': round(float(conf) * 100, 2)
            }
            for mood, conf in mood_confidences
        ]
    }

def main():
    """CLI interface for mood prediction."""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No text provided'}))
        sys.exit(1)
    
    text = sys.argv[1]
    
    try:
        model = load_model()
        result = predict_mood(text, model)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
