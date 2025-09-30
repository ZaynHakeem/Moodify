#!/usr/bin/env python3
"""
Improved mood prediction using pre-trained transformers.
Much more accurate than the basic scikit-learn model.
"""

import sys
import json
from transformers import pipeline

# Initialize emotion classifier (downloads model on first run)
emotion_classifier = None

def get_classifier():
    """Lazy load the classifier to avoid loading on import."""
    global emotion_classifier
    if emotion_classifier is None:
        emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None
        )
    return emotion_classifier

def predict_mood(text):
    """
    Predict mood from text using state-of-the-art transformer model.
    
    Args:
        text: Input text to analyze
    
    Returns:
        dict with 'mood', 'confidence', and 'all_predictions'
    """
    classifier = get_classifier()
    
    # Preprocess to handle common phrases the model might miss
    text_lower = text.lower()
    
    # Strong anger indicators
    anger_phrases = [
        'fed up', 'pissed off', 'sick of', 'furious', 'livid', 'enraged',
        'sick and tired', 'had enough', 'done with', 'so mad', 'ticked off',
        'irritated', 'frustrated', 'annoyed', 'aggravated'
    ]
    
    # Anxiety indicators
    anxiety_phrases = [
        'stressed out', 'overwhelmed', 'worried sick', 'panicking',
        'on edge', 'freaking out', 'nervous wreck', 'can\'t stop worrying',
        'anxious about', 'scared about', 'terrified'
    ]
    
    # Happiness indicators
    happy_phrases = [
        'over the moon', 'on cloud nine', 'thrilled', 'ecstatic', 'pumped',
        'so happy', 'super excited', 'feeling great', 'amazing day',
        'best day ever', 'grateful', 'blessed'
    ]
    
    # Sadness indicators
    sad_phrases = [
        'heartbroken', 'devastated', 'miserable', 'depressed', 'hopeless',
        'feel empty', 'feel numb', 'crying', 'can\'t stop crying', 'lonely',
        'feel alone', 'missing', 'grief'
    ]
    
    # Energy indicators
    energy_phrases = [
        'pumped up', 'fired up', 'ready to go', 'full of energy', 'hyped',
        'let\'s go', 'bring it on', 'unstoppable', 'motivated', 'charged up'
    ]
    
    # Calm indicators
    calm_phrases = [
        'peaceful', 'relaxed', 'serene', 'tranquil', 'at ease', 'content',
        'zen', 'mellow', 'chilled out', 'laid back'
    ]
    
    # Physical state indicators (not emotional)
    tired_phrases = ['tired', 'sleepy', 'drowsy', 'exhausted', 'need sleep', 'need rest']
    
    # Get predictions from model
    results = classifier(text[:512])[0]  # Limit text length
    
    # Sort by confidence
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    
    # Map emotion labels to mood categories for Spotify
    label_mapping = {
        'joy': 'happy',
        'sadness': 'sad',
        'anger': 'angry',
        'fear': 'anxious',
        'surprise': 'energetic',
        'disgust': 'angry',
        'neutral': 'calm'
    }
    
    # Get primary emotion
    primary = results[0]
    mapped_mood = label_mapping.get(primary['label'], 'calm')
    
    # Post-processing: Handle common phrases the model might misclassify
    detected_phrases = {
        'angry': any(phrase in text_lower for phrase in anger_phrases),
        'anxious': any(phrase in text_lower for phrase in anxiety_phrases),
        'happy': any(phrase in text_lower for phrase in happy_phrases),
        'sad': any(phrase in text_lower for phrase in sad_phrases),
        'energetic': any(phrase in text_lower for phrase in energy_phrases),
        'calm': any(phrase in text_lower for phrase in calm_phrases),
    }
    
    # Strong override for clear anger/anxiety phrases (common misclassifications)
    if detected_phrases['angry'] and mapped_mood != 'angry':
        for result in results:
            if label_mapping.get(result['label']) == 'angry':
                primary = result
                mapped_mood = 'angry'
                break
    elif detected_phrases['anxious'] and mapped_mood not in ['anxious', 'angry']:
        for result in results:
            if label_mapping.get(result['label']) == 'anxious':
                primary = result
                mapped_mood = 'anxious'
                break
    # For other moods, only override if model confidence is low
    elif primary['score'] < 0.6:
        for mood, detected in detected_phrases.items():
            if detected and mood not in ['angry', 'anxious']:  # Already handled above
                for result in results:
                    if label_mapping.get(result['label']) == mood:
                        primary = result
                        mapped_mood = mood
                        break
                break
    
    # Handle physical tiredness (not emotional sadness)
    if any(phrase in text_lower for phrase in tired_phrases) and mapped_mood == 'sad':
        # Check if there are actual sad indicators
        sad_indicators = ['depressed', 'hopeless', 'miserable', 'heartbroken', 'lonely', 'empty']
        if not any(word in text_lower for word in sad_indicators):
            mapped_mood = 'calm'
    
    # Format all predictions
    all_predictions = []
    for result in results:
        mood = label_mapping.get(result['label'], result['label'])
        # Combine duplicate moods (e.g., anger + disgust both map to angry)
        existing = next((p for p in all_predictions if p['mood'] == mood), None)
        if existing:
            existing['confidence'] = max(existing['confidence'], round(result['score'] * 100, 2))
        else:
            all_predictions.append({
                'mood': mood,
                'confidence': round(result['score'] * 100, 2)
            })
    
    # Re-sort after combining
    all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
    
    return {
        'mood': mapped_mood,
        'confidence': round(primary['score'] * 100, 2),
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