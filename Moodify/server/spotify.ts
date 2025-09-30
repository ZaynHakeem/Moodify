import { SpotifyApi } from "@spotify/web-api-ts-sdk";

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

export type MoodType = "happy" | "sad" | "energetic" | "calm";

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
    { id: null, name: "Pop Happiness", description: "Pop tracks that make you smile", trackCount: 48, imageUrl: null, spotifyUrl: null, owner: null, mood: "happy" },
    { id: null, name: "Sunny Day Mix", description: "Songs as bright as sunshine", trackCount: 35, imageUrl: null, spotifyUrl: null, owner: null, mood: "happy" },
  ],
  sad: [
    { id: null, name: "Sad Songs", description: "Music for when you're feeling blue", trackCount: 45, imageUrl: null, spotifyUrl: null, owner: null, mood: "sad" },
    { id: null, name: "Melancholy Acoustic", description: "Gentle acoustic tracks for reflection", trackCount: 38, imageUrl: null, spotifyUrl: null, owner: null, mood: "sad" },
    { id: null, name: "Rainy Day Blues", description: "Moody music for emotional moments", trackCount: 40, imageUrl: null, spotifyUrl: null, owner: null, mood: "sad" },
    { id: null, name: "Heartbreak Ballads", description: "Songs that understand your pain", trackCount: 32, imageUrl: null, spotifyUrl: null, owner: null, mood: "sad" },
  ],
  energetic: [
    { id: null, name: "Workout Motivation", description: "High-energy tracks to power your workout", trackCount: 60, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
    { id: null, name: "Pump Up Mix", description: "Get pumped with these energetic beats", trackCount: 55, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
    { id: null, name: "EDM Energy", description: "Electronic dance music to fuel your energy", trackCount: 52, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
    { id: null, name: "Rock Power", description: "Rock anthems for maximum energy", trackCount: 48, imageUrl: null, spotifyUrl: null, owner: null, mood: "energetic" },
  ],
  calm: [
    { id: null, name: "Calm Acoustic", description: "Gentle acoustic melodies to help you unwind", trackCount: 42, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Peaceful Piano", description: "Soothing piano compositions for relaxation", trackCount: 38, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Ambient Relaxation", description: "Atmospheric soundscapes for deep relaxation", trackCount: 50, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
    { id: null, name: "Meditation Sounds", description: "Calming music for meditation and mindfulness", trackCount: 45, imageUrl: null, spotifyUrl: null, owner: null, mood: "calm" },
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
    return fallbackPlaylists[mood];
  }
}
