#!/usr/bin/env python3
"""
Improved mood prediction using GoEmotions model trained on Reddit.
Better at handling colloquial and informal language.
"""

import sys
import json
from transformers import pipeline

emotion_classifier = None

def get_classifier():
    """Lazy load the classifier to avoid loading on import."""
    global emotion_classifier
    if emotion_classifier is None:
        emotion_classifier = pipeline(
            "text-classification",
            model="SamLowe/roberta-base-go_emotions",
            top_k=None
        )
    return emotion_classifier

def predict_mood(text):
    """
    Predict mood from text using GoEmotions model.
    
    Args:
        text: Input text to analyze
    
    Returns:
        dict with 'mood', 'confidence', and 'all_predictions'
    """
    classifier = get_classifier()
    
    # Get predictions from model
    results = classifier(text[:512])[0]
    
    # Sort by confidence
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    
    # Map GoEmotions labels (28 emotions) to your 6 mood categories
    label_mapping = {
        # Happy
        'joy': 'happy',
        'amusement': 'happy',
        'excitement': 'happy',
        'love': 'happy',
        'gratitude': 'happy',
        'approval': 'happy',
        'admiration': 'happy',
        'pride': 'happy',
        'relief': 'happy',
        'optimism': 'happy',
        
        # Sad
        'sadness': 'sad',
        'grief': 'sad',
        'remorse': 'sad',
        'disappointment': 'sad',
        'embarrassment': 'sad',
        
        # Angry
        'anger': 'angry',
        'annoyance': 'angry',
        'disapproval': 'angry',
        'disgust': 'angry',
        
        # Anxious
        'fear': 'anxious',
        'nervousness': 'anxious',
        'confusion': 'anxious',
        
        # Energetic
        'desire': 'energetic',
        'caring': 'energetic',
        'curiosity': 'energetic',
        
        # Calm
        'neutral': 'calm',
        'realization': 'calm',
        'surprise': 'calm',
    }
    
    # Get primary emotion
    primary = results[0]
    mapped_mood = label_mapping.get(primary['label'], 'calm')
    
    # Aggregate predictions by mood
    # Aggregate predictions by mood (take MAX instead of SUM to avoid exceeding 100%)
    mood_scores = {}
    for result in results:
        mood = label_mapping.get(result['label'], 'calm')
        if mood not in mood_scores:
            mood_scores[mood] = 0
        # Use max score instead of summing to keep percentages realistic
        mood_scores[mood] = max(mood_scores[mood], result['score'])
    
    # Create all_predictions with aggregated scores
    all_predictions = [
        {
            'mood': mood,
            'confidence': round(score * 100, 2)
        }
        for mood, score in mood_scores.items()
    ]
    
    # Sort by aggregated confidence
    all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Use the highest aggregated score as primary
    primary_from_aggregated = all_predictions[0]
    
    return {
        'mood': primary_from_aggregated['mood'],
        'confidence': primary_from_aggregated['confidence'],
        'all_predictions': all_predictions
    }

def main():
    """CLI interface for mood prediction."""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No text provided'}))
        sys.exit(1)
    
    text = sys.argv[1]
    
    try:
        result = predict_mood(text)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()