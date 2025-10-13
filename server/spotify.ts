import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { spawn } from "child_process";
import path from "path";

let spotifyClient: SpotifyApi | null = null;
let tokenExpiry = 0;

async function getClientCredentialsToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Check .env file');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in
  };
}

export async function getUncachableSpotifyClient() {
  const now = Date.now();
  
  if (!spotifyClient || now >= tokenExpiry) {
    const { access_token, expires_in } = await getClientCredentialsToken();
    
    spotifyClient = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token,
      token_type: "Bearer",
      expires_in,
      refresh_token: ""
    });
    
    tokenExpiry = now + (expires_in * 1000) - 60000;
  }

  return spotifyClient;
}

export type MoodType = "happy" | "sad" | "energetic" | "calm" | "angry" | "anxious";

const moodAudioFeatures = {
  happy: {
    valence: { min: 0.6, target: 0.8 },
    energy: { min: 0.5, target: 0.7 },
    danceability: { min: 0.5, target: 0.7 },
    genres: ["pop", "indie", "happy"],
  },
  sad: {
    valence: { min: 0.0, target: 0.3 },
    energy: { min: 0.0, target: 0.4 },
    acousticness: { min: 0.3, target: 0.7 },
    genres: ["sad", "acoustic", "blues"],
  },
  energetic: {
    valence: { min: 0.5, target: 0.8 },
    energy: { min: 0.7, target: 0.95 },
    danceability: { min: 0.6, target: 0.9 },
    tempo: { min: 120, target: 140 },
    genres: ["workout", "edm", "rock", "hip-hop"],
  },
  calm: {
    valence: { min: 0.3, target: 0.6 },
    energy: { min: 0.0, target: 0.4 },
    acousticness: { min: 0.4, target: 0.8 },
    instrumentalness: { min: 0.2, target: 0.6 },
    genres: ["ambient", "chill", "classical", "meditation"],
  },
  angry: {
    valence: { min: 0.0, target: 0.3 },
    energy: { min: 0.7, target: 0.95 },
    loudness: { min: -5, target: -2 },
    genres: ["metal", "hard rock", "punk"],
  },
  anxious: {
    valence: { min: 0.3, target: 0.5 },
    energy: { min: 0.5, target: 0.7 },
    tempo: { min: 100, target: 130 },
    genres: ["alternative", "indie", "electronic"],
  },
};

interface Playlist {
  id: string | null;
  name: string;
  description: string;
  trackCount: number;
  imageUrl: string | null;
  spotifyUrl: string | null;
  owner: string | null;
  mood: MoodType;
}

const fallbackPlaylists: Record<MoodType, Playlist[]> = {
  happy: [
    { id: null, name: "Happy Hits", description: "Upbeat songs to brighten your day", trackCount: 50, imageUrl: null, spotifyUrl: null, owner: null, mood: "happy" },
    { id: null, name: "Feel Good Indie", description: "Indie vibes for happy moments", trackCount: 42, imageUrl: null, spotifyUrl: null, owner: null, mood: "happy" },
  ],
  sad: [
    { id: null, name: "Sad Songs", description: "Music for when you're feeling blue", trackCount: 45, imageUrl: null, spotifyUrl: null, owner: null, mood: "sad" },
  ],
  energetic: [
    { id: null, name: "Workout Motivation", description: "High-energy tracks to power your workout", trackCount: 60, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
  ],
  calm: [
    { id: null, name: "Calm Acoustic", description: "Gentle acoustic melodies to help you unwind", trackCount: 42, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
  ],
  angry: [
    { id: null, name: "Rage Release", description: "Channel your anger through intense music", trackCount: 40, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
  ],
  anxious: [
    { id: null, name: "Anxiety Relief", description: "Music to ease anxious feelings", trackCount: 35, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
  ],
};

export async function getPlaylistsForMood(mood: MoodType): Promise<Playlist[]> {
  try {
    const spotify = await getUncachableSpotifyClient();
    const features = moodAudioFeatures[mood];
    
    const searchQueries = features.genres.map(genre => `${mood} ${genre}`);
    
    const playlists: Playlist[] = [];
    
    for (const query of searchQueries.slice(0, 2)) {
      try {
        const result = await spotify.search(query, ["playlist"], undefined, 5);
        
        if (result.playlists.items && result.playlists.items.length > 0) {
          for (const playlist of result.playlists.items) {
            // Add null checks to prevent crashes
            if (playlist && playlist.id) {
              playlists.push({
                id: playlist.id,
                name: playlist.name || "Unnamed Playlist",
                description: playlist.description || "",
                trackCount: (playlist as any).tracks?.total || 0,
                imageUrl: playlist.images?.[0]?.url || null,
                spotifyUrl: playlist.external_urls?.spotify || null,
                owner: playlist.owner?.display_name || null,
                mood,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
      
      if (playlists.length >= 8) break;
    }
    
    if (playlists.length > 0) {
      return playlists.slice(0, 8);
    }
    
    console.warn("Spotify search returned no results, using fallback playlists");
    return fallbackPlaylists[mood];
    
  } catch (error) {
    console.error("Error fetching Spotify playlists, using fallback:", error);
    return fallbackPlaylists[mood] || [];
  }
}

// NEW: Get personalized track recommendations
export async function getPersonalizedTracks(mood: MoodType, limit: number = 30) {
  try {
    const spotify = await getUncachableSpotifyClient();
    const features = moodAudioFeatures[mood];
    
    // Get seed tracks from search (Client Credentials flow only allows search)
    const tracks: any[] = [];
    
    // Search for tracks by mood + genre
    for (const genre of features.genres.slice(0, 3)) {
      try {
        const searchResult = await spotify.search(`${mood} ${genre}`, ["track"], undefined, 20);
        if (searchResult.tracks?.items && searchResult.tracks.items.length > 0) {
          tracks.push(...searchResult.tracks.items.filter(t => t && t.id));
        }
      } catch (error) {
        console.error(`Error searching tracks for ${genre}:`, error);
      }
    }
    
    // Remove duplicates
    const uniqueTracks = Array.from(
      new Map(tracks.map(t => [t.id, t])).values()
    );
    
    // Skip audio features and recommendations API (requires user auth)
    // Instead, use basic track info with estimated features based on mood
    const tracksWithFeatures = uniqueTracks.map((track) => {
      return {
        id: track.id,
        name: track.name || "Unknown Track",
        artist: track.artists?.[0]?.name || "Unknown Artist",
        album: track.album?.name || "Unknown Album",
        imageUrl: track.album?.images?.[0]?.url || null,
        spotifyUrl: track.external_urls?.spotify || null,
        previewUrl: track.preview_url || null,
        duration_ms: track.duration_ms || 0,
        // Estimated audio features based on mood (since we can't access the API)
        valence: (features as any).valence?.target || 0.5,
        energy: (features as any).energy?.target || 0.5,
        danceability: (features as any).danceability?.target || 0.5,
        acousticness: (features as any).acousticness?.target || 0.5,
        instrumentalness: (features as any).instrumentalness?.target || 0.0,
        tempo: (features as any).tempo?.target || 120,
        loudness: (features as any).loudness?.target || -10,
      };
    });
    
    // Use scikit-learn recommender to rank and filter tracks
    const recommendedTracks = await runSongRecommender(mood, tracksWithFeatures);
    
    return recommendedTracks.slice(0, limit);
    
  } catch (error) {
    console.error("Error getting personalized tracks:", error);
    return [];
  }
}

// Helper function to run Python scikit-learn recommender
async function runSongRecommender(mood: string, tracks: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/song_recommender.py');
    const tracksJson = JSON.stringify(tracks);
    
    const python = spawn('python3', [pythonScript, mood, tracksJson]);
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python recommender error:', error);
        // Fallback to original tracks if ML fails
        resolve(tracks);
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result.tracks || tracks);
        } catch (e) {
          console.error('Error parsing recommender output:', e);
          resolve(tracks);
        }
      }
    });
  });
}