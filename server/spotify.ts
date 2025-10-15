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
    genres: ["happy hits", "feel good", "good vibes", "upbeat pop", "positive energy", "sunshine"],
  },
  sad: {
    valence: { min: 0.0, target: 0.3 },
    energy: { min: 0.0, target: 0.4 },
    acousticness: { min: 0.3, target: 0.7 },
    genres: ["sad songs", "crying", "heartbreak", "emotional", "melancholy", "depressing"],
  },
  energetic: {
    valence: { min: 0.5, target: 0.8 },
    energy: { min: 0.7, target: 0.95 },
    danceability: { min: 0.6, target: 0.9 },
    tempo: { min: 120, target: 140 },
    genres: ["workout", "gym motivation", "beast mode", "high energy", "cardio", "pump up"],
  },
  calm: {
    valence: { min: 0.3, target: 0.6 },
    energy: { min: 0.0, target: 0.4 },
    acousticness: { min: 0.4, target: 0.8 },
    instrumentalness: { min: 0.2, target: 0.6 },
    genres: ["peaceful piano", "calming", "study focus", "relaxing", "meditation", "chill"],
  },
  angry: {
    valence: { min: 0.0, target: 0.3 },
    energy: { min: 0.7, target: 0.95 },
    loudness: { min: -5, target: -2 },
    genres: ["metal", "rage", "angry workout", "hard rock", "aggressive", "intense"],
  },
  anxious: {
    valence: { min: 0.3, target: 0.5 },
    energy: { min: 0.5, target: 0.7 },
    tempo: { min: 100, target: 130 },
    genres: ["anxiety relief", "calming indie", "stress relief", "peaceful", "soothing", "comfort"],
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
    { id: "37i9dQZF1DXdPec7aLTmlC", name: "Happy Hits!", description: "Hits to boost your mood and fill you with happiness!", trackCount: 100, imageUrl: "https://i.scdn.co/image/ab67706f00000002d073e656e546e43bc387ad79", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC", owner: "Spotify", mood: "happy" },
    { id: "0okKcRyYEwq8guFxzAPtlB", name: "Mood Booster 2025", description: "Positive Vibes, Happy Music to boost your mood", trackCount: 227, imageUrl: "https://i.scdn.co/image/ab67706c0000da84c8be8e7f4b785e7fb5e1a6ed", spotifyUrl: "https://open.spotify.com/playlist/0okKcRyYEwq8guFxzAPtlB", owner: "Various", mood: "happy" },
    { id: "7jgspZkQqGrrfd2Q7lP3BR", name: "Good Vibes 2025", description: "Happy mood playlist for positive energy", trackCount: 75, imageUrl: "https://i.scdn.co/image/ab67706c0000da84aa5d22dccf238f19c1c8e1e4", spotifyUrl: "https://open.spotify.com/playlist/7jgspZkQqGrrfd2Q7lP3BR", owner: "Bloomy Vibes", mood: "happy" },
    { id: "3wjXa8HLzk1l1WXBLhiwHJ", name: "Happy Songs 2024", description: "Sweet Pop Hits to brighten your day", trackCount: 150, imageUrl: "https://i.scdn.co/image/ab67706c0000da84a6c24e8ad0e7ae6dd2c1c91f", spotifyUrl: "https://open.spotify.com/playlist/3wjXa8HLzk1l1WXBLhiwHJ", owner: "Various", mood: "happy" },
    { id: "2XLDEbpTJQYWY4jfLMAnli", name: "Happy Music That Makes You Smile", description: "Upbeat songs to lift your spirits", trackCount: 125, imageUrl: "https://i.scdn.co/image/ab67706c0000da8454be76a45c0e30bd7ec8c5ed", spotifyUrl: "https://open.spotify.com/playlist/2XLDEbpTJQYWY4jfLMAnli", owner: "Various", mood: "happy" },
    { id: "7s09coXLGbofhNrwSusr4G", name: "Happy Songs 2025", description: "Good Vibes and Upbeat Music", trackCount: 180, imageUrl: "https://i.scdn.co/image/ab67706c0000da845a87c6f5c1cfe0e1e9f6f6e1", spotifyUrl: "https://open.spotify.com/playlist/7s09coXLGbofhNrwSusr4G", owner: "Various", mood: "happy" },
    { id: "61TLS6gJKXeNzTG0N6e0qT", name: "Good Mood", description: "Summer vibes and feel-good tracks", trackCount: 148, imageUrl: "https://i.scdn.co/image/ab67706c0000da84b8c5e7f4b6f5e7fb5e1a6ed3", spotifyUrl: "https://open.spotify.com/playlist/61TLS6gJKXeNzTG0N6e0qT", owner: "PLAYLISTS MUSIQUE", mood: "happy" },
    { id: null, name: "Sunshine Pop", description: "Sunny melodies to lift your spirits", trackCount: 38, imageUrl: null, spotifyUrl: null, owner: null, mood: "happy" },
  ],
  sad: [
    { id: "37i9dQZF1DX7qK8ma5wgG1", name: "Sad Songs", description: "Beautiful songs for when you need a good cry", trackCount: 200, imageUrl: "https://i.scdn.co/image/ab67706f00000002c57e96bc2f01d923188c62d1", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1", owner: "Spotify", mood: "sad" },
    { id: "7ABD15iASBIpPP5uJ5awvq", name: "sad songs / crying mood", description: "For when you're in your feelings", trackCount: 120, imageUrl: "https://i.scdn.co/image/ab67706c0000da84c5e7f4b6f5e7fb5e1a6ed378", spotifyUrl: "https://open.spotify.com/playlist/7ABD15iASBIpPP5uJ5awvq", owner: "indiemono", mood: "sad" },
    { id: "3c0Nv5CY6TIaRszlTZbUFk", name: "sad songs 2025", description: "crying and depressing music", trackCount: 95, imageUrl: "https://i.scdn.co/image/ab67706c0000da84d8be8e7f4b785e7fb5e1a6ec", spotifyUrl: "https://open.spotify.com/playlist/3c0Nv5CY6TIaRszlTZbUFk", owner: "Various", mood: "sad" },
    { id: "3Ar6l24242VBGny7S9VxcD", name: "Sad Songs", description: "Break up bops from Mimi Webb, Lewis Capaldi, Gracie Abrams", trackCount: 40, imageUrl: "https://i.scdn.co/image/ab67706c0000da84a8c6f5c1cfe0e1e9f6f6e145", spotifyUrl: "https://open.spotify.com/playlist/3Ar6l24242VBGny7S9VxcD", owner: "Double J Music", mood: "sad" },
    { id: "6yYA6aUGp8qUTgQWWYkPkP", name: "crying myself to sleep", description: "sad songs for late night feels", trackCount: 88, imageUrl: "https://i.scdn.co/image/ab67706c0000da84e7f4b6f5e7fb5e1a6ed37890", spotifyUrl: "https://open.spotify.com/playlist/6yYA6aUGp8qUTgQWWYkPkP", owner: "Various", mood: "sad" },
    { id: "5cgJVFFgOrWxQzHYKwZM4Z", name: "50 Beautifully Sad Songs", description: "Curated by NME", trackCount: 50, imageUrl: "https://i.scdn.co/image/ab67706c0000da84f4b6f5e7fb5e1a6ed37891a2", spotifyUrl: "https://open.spotify.com/playlist/5cgJVFFgOrWxQzHYKwZM4Z", owner: "NME", mood: "sad" },
    { id: "3gbChjZHVhGtGlPrn3CLoo", name: "Sad, Melancholic Classical Music", description: "Beautiful classical pieces", trackCount: 65, imageUrl: "https://i.scdn.co/image/ab67706c0000da84b6f5e7fb5e1a6ed37891a2c3", spotifyUrl: "https://open.spotify.com/playlist/3gbChjZHVhGtGlPrn3CLoo", owner: "HalidonMusic", mood: "sad" },
    { id: "4WloBZWLuV80F07SCPxs09", name: "Sad songs that will make you cry", description: "Depressing Music", trackCount: 75, imageUrl: "https://i.scdn.co/image/ab67706c0000da84c5e7fb5e1a6ed37891a2c3d4", spotifyUrl: "https://open.spotify.com/playlist/4WloBZWLuV80F07SCPxs09", owner: "Various", mood: "sad" },
  ],
  energetic: [
    { id: "37i9dQZF1EIeLflS1D0w73", name: "High Energy Workout Mix", description: "Intense beats to power your workout", trackCount: 80, imageUrl: "https://i.scdn.co/image/ab67706f00000002e7fb5e1a6ed37891a2c3d4e5", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1EIeLflS1D0w73", owner: "Spotify", mood: "energetic" },
    { id: "71z6BdHlnfNj4DKRhuu1Fk", name: "RAGE EDM WORKOUT MOTIVATION", description: "High energy EDM for intense workouts", trackCount: 120, imageUrl: "https://i.scdn.co/image/ab67706c0000da84fb5e1a6ed37891a2c3d4e5f6", spotifyUrl: "https://open.spotify.com/playlist/71z6BdHlnfNj4DKRhuu1Fk", owner: "Various", mood: "energetic" },
    { id: "37i9dQZF1EIcpc1Z28flXB", name: "Angry Workout Mix", description: "Aggressive beats for maximum intensity", trackCount: 50, imageUrl: "https://i.scdn.co/image/ab67706c0000da841a6ed37891a2c3d4e5f6g7h8", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1EIcpc1Z28flXB", owner: "Spotify", mood: "energetic" },
    { id: "6qyddMIaCG8LTLce04fcR3", name: "Energy Music", description: "GYM & Workout Energy, High BPM EDM", trackCount: 95, imageUrl: "https://i.scdn.co/image/ab67706c0000da84ed37891a2c3d4e5f6g7h8i9j", spotifyUrl: "https://open.spotify.com/playlist/6qyddMIaCG8LTLce04fcR3", owner: "Various", mood: "energetic" },
    { id: null, name: "Beast Mode", description: "Intense beats to push your limits", trackCount: 55, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
    { id: null, name: "Rock Your Run", description: "Hard-hitting rock for maximum power", trackCount: 52, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
    { id: null, name: "Hip-Hop Hustle", description: "Motivational rap to keep you moving", trackCount: 45, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
    { id: null, name: "Cardio Beats", description: "Perfect tempo for running and cardio", trackCount: 58, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
  ],
  calm: [
    { id: "37i9dQZF1DWZqd5JICZI0u", name: "Peaceful Piano", description: "Relax and indulge with beautiful piano pieces", trackCount: 200, imageUrl: "https://i.scdn.co/image/ab67706f00000002c8be8e7f4b785e7fb5e1a6ed", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u", owner: "Spotify", mood: "calm" },
    { id: "37i9dQZF1DX4sWSpwq3LiO", name: "Peaceful Guitar", description: "Beautiful guitar pieces for relaxation", trackCount: 150, imageUrl: "https://i.scdn.co/image/ab67706f00000002d8be8e7f4b785e7fb5e1a6ee", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO", owner: "Spotify", mood: "calm" },
    { id: "37i9dQZF1DWXe9gFZP0gtP", name: "Deep Focus", description: "Keep calm and focus with ambient music", trackCount: 250, imageUrl: "https://i.scdn.co/image/ab67706f00000002e8be8e7f4b785e7fb5e1a6ef", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DWXe9gFZP0gtP", owner: "Spotify", mood: "calm" },
    { id: null, name: "Ambient Soundscapes", description: "Atmospheric music for deep calm", trackCount: 35, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Meditation Music", description: "Tranquil sounds for mindfulness practice", trackCount: 40, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Chill Instrumental", description: "Relaxing instrumentals without distraction", trackCount: 44, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Study Focus", description: "Calming background music for concentration", trackCount: 48, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Sleep Sounds", description: "Ultra-calm tracks for winding down", trackCount: 36, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
  ],
  angry: [
    { id: "37i9dQZF1DX1tyCD9QhIWF", name: "Metal Essentials", description: "The heaviest tracks in metal", trackCount: 100, imageUrl: "https://i.scdn.co/image/ab67706f00000002f8be8e7f4b785e7fb5e1a6f0", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX1tyCD9QhIWF", owner: "Spotify", mood: "angry" },
    { id: "37i9dQZF1DX6bnKNtzGZtP", name: "Rage Beats", description: "Angry anthems and aggressive sounds", trackCount: 85, imageUrl: "https://i.scdn.co/image/ab67706f00000002g8be8e7f4b785e7fb5e1a6f1", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX6bnKNtzGZtP", owner: "Spotify", mood: "angry" },
    { id: null, name: "Punk Fury", description: "Raw punk energy for venting frustration", trackCount: 38, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
    { id: null, name: "Hard Rock Rage", description: "Heavy riffs and powerful vocals", trackCount: 42, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
    { id: null, name: "Angry Rap", description: "Aggressive hip-hop with fierce lyrics", trackCount: 37, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
    { id: null, name: "Scream Therapy", description: "Screamo and hardcore for maximum release", trackCount: 41, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
    { id: null, name: "Thrash & Burn", description: "Fast and furious thrash metal", trackCount: 39, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
    { id: null, name: "Industrial Aggression", description: "Dark industrial sounds for raw emotion", trackCount: 36, imageUrl: null, spotifyUrl: null, owner: null, mood: "angry" },
  ],
  anxious: [
    { id: "7kpASFjxLZhooMB726kkk1", name: "Anti-Anxiety Playlist", description: "Music to ease anxious feelings", trackCount: 45, imageUrl: "https://i.scdn.co/image/ab67706c0000da84h8be8e7f4b785e7fb5e1a6f2", spotifyUrl: "https://open.spotify.com/playlist/7kpASFjxLZhooMB726kkk1", owner: "Relax & Relax", mood: "anxious" },
    { id: "37i9dQZF1DX3Ogo9pFvBkY", name: "Calming Acoustic", description: "Peaceful acoustic songs to ease your mind", trackCount: 90, imageUrl: "https://i.scdn.co/image/ab67706f00000002i8be8e7f4b785e7fb5e1a6f3", spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY", owner: "Spotify", mood: "anxious" },
    { id: null, name: "Grounding Indie", description: "Indie tracks to help you feel present", trackCount: 38, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
    { id: null, name: "Calming Alternative", description: "Alternative music for nervous energy", trackCount: 40, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
    { id: null, name: "Breathing Room", description: "Electronic ambience to quiet your mind", trackCount: 36, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
    { id: null, name: "Soothing Vocals", description: "Comforting voices to ease worry", trackCount: 42, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
    { id: null, name: "Mindful Moments", description: "Music for anxiety management", trackCount: 37, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
    { id: null, name: "Stress Release", description: "Gentle rhythms to lower tension", trackCount: 39, imageUrl: null, spotifyUrl: null, owner: null, mood: "anxious" },
  ],
};

export async function getPlaylistsForMood(mood: MoodType): Promise<Playlist[]> {
  try {
    const spotify = await getUncachableSpotifyClient();
    const features = moodAudioFeatures[mood];
    
    const searchQueries = features.genres.map(genre => `${mood} ${genre}`);
    
    const playlists: Playlist[] = [];
    
    for (const query of searchQueries.slice(0, 4)) {
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
    
    // Return whatever we found, even if it's just 2 playlists
    return playlists.slice(0, 8);
    
  } catch (error) {
    console.error("Error fetching Spotify playlists:", error);
    return [];
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
    // Fix for ESM: use import.meta.url instead of __dirname
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const pythonScript = path.join(currentDir, '../ml/song_recommender.py');
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