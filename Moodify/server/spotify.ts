import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { spawn } from "child_process";
import path from "path";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
    const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
    const expiresIn = connectionSettings.settings?.oauth?.credentials?.expires_in;
    
    return { accessToken, clientId, refreshToken, expiresIn };
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=spotify',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);
  
  const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
  const expiresIn = connectionSettings.settings?.oauth?.credentials?.expires_in;
  
  if (!connectionSettings || (!accessToken || !clientId || !refreshToken)) {
    throw new Error('Spotify not connected');
  }
  
  return {accessToken, clientId, refreshToken, expiresIn};
}

export async function getUncachableSpotifyClient() {
  const {accessToken, clientId, refreshToken, expiresIn} = await getAccessToken();

  const spotify = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn || 3600,
    refresh_token: refreshToken,
  });

  return spotify;
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
        
        if (result.playlists.items) {
          for (const playlist of result.playlists.items) {
            playlists.push({
              id: playlist.id,
              name: playlist.name,
              description: playlist.description || "",
              trackCount: (playlist as any).tracks?.total || 0,
              imageUrl: playlist.images[0]?.url || null,
              spotifyUrl: playlist.external_urls.spotify,
              owner: playlist.owner.display_name || null,
              mood,
            });
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

// NEW: Get personalized track recommendations using scikit-learn
export async function getPersonalizedTracks(mood: MoodType, limit: number = 30) {
  try {
    const spotify = await getUncachableSpotifyClient();
    const features = moodAudioFeatures[mood];
    
    // Get seed tracks from multiple sources
    const tracks: any[] = [];
    
    // 1. Search for tracks by mood + genre
    for (const genre of features.genres.slice(0, 3)) {
      try {
        const searchResult = await spotify.search(`${mood} ${genre}`, ["track"], undefined, 20);
        if (searchResult.tracks.items) {
          tracks.push(...searchResult.tracks.items);
        }
      } catch (error) {
        console.error(`Error searching tracks for ${genre}:`, error);
      }
    }
    
    // 2. Get recommendations using Spotify's recommendation API
    try {
      const seedTracks = tracks.slice(0, 5).map(t => t.id).filter(Boolean);
      if (seedTracks.length > 0) {
        const recommendations = await spotify.recommendations.get({
          seed_tracks: seedTracks,
          limit: 50,
          ...features,
        });
        tracks.push(...recommendations.tracks);
      }
    } catch (error) {
      console.error("Error getting Spotify recommendations:", error);
    }
    
    // Remove duplicates
    const uniqueTracks = Array.from(
      new Map(tracks.map(t => [t.id, t])).values()
    );
    
    // Get audio features for all tracks
    const trackIds = uniqueTracks.map(t => t.id).filter(Boolean);
    const audioFeatures = await spotify.tracks.audioFeatures(trackIds);
    
    // Combine track info with audio features
    const tracksWithFeatures = uniqueTracks.map((track, i) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name,
      album: track.album?.name,
      imageUrl: track.album?.images[0]?.url,
      spotifyUrl: track.external_urls?.spotify,
      previewUrl: track.preview_url,
      duration_ms: track.duration_ms,
      // Audio features
      valence: audioFeatures[i]?.valence || 0.5,
      energy: audioFeatures[i]?.energy || 0.5,
      danceability: audioFeatures[i]?.danceability || 0.5,
      acousticness: audioFeatures[i]?.acousticness || 0.5,
      instrumentalness: audioFeatures[i]?.instrumentalness || 0.0,
      tempo: audioFeatures[i]?.tempo || 120,
      loudness: audioFeatures[i]?.loudness || -10,
    }));
    
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