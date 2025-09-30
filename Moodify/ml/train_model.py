#!/usr/bin/env python3
"""
Train a simple mood classifier using scikit-learn.
This script creates a basic text classification model for 4 mood categories.
"""

import nltk
import joblib
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

# Training data: (text, mood_label)
# In a real scenario, this would come from a larger labeled dataset
training_data = [
    # Happy moods
    ("I'm so excited and thrilled about this!", "happy"),
    ("This is the best day ever! I feel amazing!", "happy"),
    ("I'm feeling joyful and content with everything", "happy"),
    ("Life is wonderful and I'm grateful for everything", "happy"),
    ("I'm so happy I could dance all day", "happy"),
    ("Everything is going great, I feel fantastic", "happy"),
    ("I'm beaming with joy and positivity", "happy"),
    ("Such a delightful morning, feeling blessed", "happy"),
    ("I'm cheerful and optimistic about the future", "happy"),
    ("My heart is full of happiness today", "happy"),
    
    # Sad moods
    ("I feel so lonely and down today", "sad"),
    ("Everything seems hopeless and I'm feeling blue", "sad"),
    ("I'm heartbroken and don't know what to do", "sad"),
    ("Feeling really low and sad right now", "sad"),
    ("I miss them so much, it hurts", "sad"),
    ("I'm disappointed and feeling melancholic", "sad"),
    ("Nothing seems to cheer me up today", "sad"),
    ("I feel empty and sorrowful inside", "sad"),
    ("The sadness is overwhelming me", "sad"),
    ("I'm grieving and feeling lost", "sad"),
    
    # Energetic moods
    ("I have so much energy, let's go do something!", "energetic"),
    ("Feeling pumped up and ready to conquer the world", "energetic"),
    ("I'm fired up and motivated to get things done", "energetic"),
    ("So much adrenaline, I need to move and be active", "energetic"),
    ("I'm hyped and full of enthusiasm", "energetic"),
    ("Let's rock this! I'm feeling super energized", "energetic"),
    ("I'm buzzing with energy and excitement", "energetic"),
    ("Feel like I could run a marathon right now", "energetic"),
    ("My energy levels are through the roof", "energetic"),
    ("I'm amped up and ready for action", "energetic"),
    
    # Calm moods
    ("I feel so peaceful and relaxed right now", "calm"),
    ("Everything is quiet and I'm feeling serene", "calm"),
    ("I'm in a state of tranquility and inner peace", "calm"),
    ("Feeling balanced, centered, and calm", "calm"),
    ("The stillness brings me so much comfort", "calm"),
    ("I'm at ease and feeling very zen", "calm"),
    ("A sense of calm washes over me", "calm"),
    ("I feel mellow and content in this moment", "calm"),
    ("My mind is clear and I'm feeling peaceful", "calm"),
    ("I'm relaxed and enjoying the quiet", "calm"),
    
    # Additional varied examples
    ("I'm thrilled and can't stop smiling", "happy"),
    ("Feeling really bummed out and gloomy", "sad"),
    ("I have so much drive and passion right now", "energetic"),
    ("Just want to meditate and be still", "calm"),
    ("Everything makes me smile today", "happy"),
    ("I'm tearful and feeling vulnerable", "sad"),
    ("Ready to take on any challenge!", "energetic"),
    ("Breathing deeply and feeling grounded", "calm"),
    ("Joy is bubbling up inside me", "happy"),
    ("I feel deflated and discouraged", "sad"),
    ("Let's do this! I'm unstoppable!", "energetic"),
    ("A gentle peace surrounds me", "calm"),
]

def train_mood_classifier():
    """Train and save the mood classification model."""
    
    # Prepare data
    texts = [item[0] for item in training_data]
    labels = [item[1] for item in training_data]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    # Create pipeline with TF-IDF vectorizer and Multinomial Naive Bayes
    model = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words='english',
            lowercase=True
        )),
        ('classifier', MultinomialNB(alpha=0.1))
    ])
    
    # Train model
    print("Training mood classifier...")
    model.fit(X_train, y_train)
    
    # Evaluate
    print("\nModel Performance:")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred, target_names=['calm', 'energetic', 'happy', 'sad']))
    
    # Save model
    model_path = Path(__file__).parent / 'mood_classifier.pkl'
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")
    
    return model

if __name__ == "__main__":
    train_mood_classifier()
