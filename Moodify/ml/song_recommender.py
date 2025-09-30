#!/usr/bin/env python3
"""
Song recommendation engine using scikit-learn.
Analyzes audio features and creates personalized playlists.
"""

import sys
import json
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity

class SongRecommender:
    """
    Uses scikit-learn to cluster and rank songs based on audio features.
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = [
            'valence', 'energy', 'danceability', 'acousticness',
            'instrumentalness', 'tempo', 'loudness'
        ]
    
    def normalize_tempo(self, tempo):
        """Normalize tempo to 0-1 scale (typical range: 40-200 BPM)"""
        return (tempo - 40) / 160
    
    def normalize_loudness(self, loudness):
        """Normalize loudness to 0-1 scale (typical range: -60 to 0 dB)"""
        return (loudness + 60) / 60
    
    def extract_features(self, tracks):
        """
        Extract audio features from track objects.
        
        Args:
            tracks: List of track dictionaries with audio features
        
        Returns:
            numpy array of normalized features
        """
        features = []
        
        for track in tracks:
            feature_vector = [
                track.get('valence', 0.5),
                track.get('energy', 0.5),
                track.get('danceability', 0.5),
                track.get('acousticness', 0.5),
                track.get('instrumentalness', 0.0),
                self.normalize_tempo(track.get('tempo', 120)),
                self.normalize_loudness(track.get('loudness', -10))
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def create_mood_profile(self, mood):
        """
        Create target feature profile for a given mood.
        
        Args:
            mood: String ('happy', 'sad', 'energetic', 'calm', 'angry', 'anxious')
        
        Returns:
            numpy array representing ideal features for this mood
        """
        mood_profiles = {
            'happy': [0.8, 0.7, 0.7, 0.3, 0.1, 0.65, 0.5],      # High valence, energy, danceability
            'sad': [0.2, 0.3, 0.3, 0.7, 0.2, 0.4, 0.3],         # Low valence, high acousticness
            'energetic': [0.7, 0.9, 0.8, 0.2, 0.1, 0.8, 0.7],   # Very high energy and tempo
            'calm': [0.5, 0.3, 0.4, 0.7, 0.5, 0.4, 0.3],        # Low energy, high acousticness
            'angry': [0.3, 0.9, 0.6, 0.2, 0.1, 0.7, 0.8],       # High energy, low valence
            'anxious': [0.4, 0.6, 0.5, 0.4, 0.3, 0.6, 0.5]      # Medium-high energy, mid valence
        }
        
        return np.array(mood_profiles.get(mood, mood_profiles['calm']))
    
    def rank_tracks(self, tracks, mood, top_n=30):
        """
        Rank tracks based on how well they match the mood profile.
        
        Args:
            tracks: List of track dictionaries with audio features
            mood: Target mood string
            top_n: Number of top tracks to return
        
        Returns:
            List of tracks sorted by relevance with similarity scores
        """
        if not tracks:
            return []
        
        # Extract and normalize features
        features = self.extract_features(tracks)
        features_normalized = self.scaler.fit_transform(features)
        
        # Create mood profile
        mood_profile = self.create_mood_profile(mood).reshape(1, -1)
        mood_profile_normalized = self.scaler.transform(mood_profile)
        
        # Calculate similarity scores (cosine similarity)
        similarities = cosine_similarity(features_normalized, mood_profile_normalized).flatten()
        
        # Add similarity scores to tracks
        ranked_tracks = []
        for i, track in enumerate(tracks):
            track_copy = track.copy()
            track_copy['similarity_score'] = float(similarities[i])
            track_copy['mood_match_percentage'] = float(min(100, max(0, similarities[i] * 100)))
            ranked_tracks.append(track_copy)
        
        # Sort by similarity (descending)
        ranked_tracks.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return ranked_tracks[:top_n]
    
    def cluster_tracks(self, tracks, n_clusters=5):
        """
        Cluster tracks into groups with similar audio features.
        Useful for creating diverse playlists.
        
        Args:
            tracks: List of track dictionaries
            n_clusters: Number of clusters to create
        
        Returns:
            Dictionary mapping cluster IDs to track lists
        """
        if len(tracks) < n_clusters:
            n_clusters = max(2, len(tracks) // 2)
        
        # Extract and normalize features
        features = self.extract_features(tracks)
        features_normalized = self.scaler.fit_transform(features)
        
        # Perform K-Means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(features_normalized)
        
        # Group tracks by cluster
        clusters = {}
        for i, label in enumerate(cluster_labels):
            label = int(label)
            if label not in clusters:
                clusters[label] = []
            
            track_copy = tracks[i].copy()
            track_copy['cluster'] = label
            clusters[label].append(track_copy)
        
        return clusters
    
    def create_balanced_playlist(self, tracks, mood, size=30):
        """
        Create a balanced playlist using clustering to ensure diversity.
        
        Args:
            tracks: List of track dictionaries
            mood: Target mood
            size: Desired playlist size
        
        Returns:
            List of tracks that are both mood-appropriate and diverse
        """
        # First rank by mood match
        ranked = self.rank_tracks(tracks, mood, top_n=len(tracks))
        
        # Take top 60% by mood match
        candidates = ranked[:int(len(ranked) * 0.6)]
        
        if len(candidates) <= size:
            return candidates
        
        # Cluster the candidates
        clusters = self.cluster_tracks(candidates, n_clusters=min(5, len(candidates) // 3))
        
        # Select tracks from each cluster proportionally
        playlist = []
        tracks_per_cluster = size // len(clusters)
        remainder = size % len(clusters)
        
        for cluster_id, cluster_tracks in clusters.items():
            # Sort cluster by mood match
            cluster_tracks.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            # Take top tracks from this cluster
            take = tracks_per_cluster + (1 if remainder > 0 else 0)
            playlist.extend(cluster_tracks[:take])
            if remainder > 0:
                remainder -= 1
        
        # Final sort by mood match
        playlist.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return playlist[:size]


def main():
    """CLI interface for song recommendations."""
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python song_recommender.py <mood> <tracks_json>'}))
        sys.exit(1)
    
    mood = sys.argv[1]
    tracks_json = sys.argv[2]
    
    try:
        tracks = json.loads(tracks_json)
        
        recommender = SongRecommender()
        
        # Create balanced playlist
        recommended = recommender.create_balanced_playlist(tracks, mood, size=30)
        
        print(json.dumps({
            'success': True,
            'tracks': recommended,
            'total_analyzed': len(tracks),
            'mood': mood
        }))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()