import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MoodInput from "@/components/MoodInput";
import MoodDetectionDisplay, { type MoodType } from "@/components/MoodDetectionDisplay";
import PlaylistCard from "@/components/PlaylistCard";
import TrackCard from "@/components/TrackCard";
import MoodHistoryChart from "@/components/MoodHistoryChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@assets/generated_images/Mood_visualization_hero_background_5824a9c6.png";

interface MoodPrediction {
  mood: MoodType;
  confidence: number;
}

interface Playlist {
  id: string | null;
  name: string;
  description: string;
  trackCount: number;
  mood: MoodType;
  imageUrl: string | null;
  spotifyUrl: string | null;
  owner: string | null;
}

interface MoodHistoryEntry {
  id: string;
  mood: MoodType;
  confidence: number;
  date: string;
}

export default function Home() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedMood, setDetectedMood] = useState<MoodPrediction[] | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [history, setHistory] = useState<MoodHistoryEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/mood/history?limit=30');
      const data = await response.json();
      if (data.sessions) {
        setHistory(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchPlaylists = async (mood: MoodType) => {
    setLoadingPlaylists(true);
    try {
      const response = await fetch(`/api/playlists/${mood}`);
      const data = await response.json();
      if (data.playlists) {
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      toast({
        title: "Error",
        description: "Failed to load playlists. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const fetchTracks = async (mood: MoodType) => {
    setLoadingTracks(true);
    try {
      const response = await fetch(`/api/tracks/${mood}?limit=30`);
      const data = await response.json();
      if (data.tracks) {
        setTracks(data.tracks);
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load track recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleMoodSubmit = async (text: string) => {
    setIsDetecting(true);
    setPlaylists([]);
    setTracks([]);

    try {
      const response = await fetch('/api/mood/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.predictions) {
        setDetectedMood(data.predictions);
        setCurrentMood(data.mood);
        await Promise.all([
          fetchPlaylists(data.mood),
          fetchTracks(data.mood)
        ]);
        await fetchHistory();
      }
    } catch (error) {
      console.error('Mood detection error:', error);
      toast({
        title: "Error",
        description: "Failed to detect mood. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section
          className="relative min-h-[75vh] flex items-center justify-center px-6 md:px-12"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          
          <div className="relative z-10 w-full max-w-6xl mx-auto py-16 space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-7xl font-display font-bold gradient-text-mood">
                How are you feeling?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Share your emotions and discover playlists that resonate with your current mood
              </p>
            </div>

            <MoodInput
              onSubmit={handleMoodSubmit}
              isLoading={isDetecting}
              currentMood={currentMood}
            />

            {detectedMood && (
              <div className="mt-12">
                <MoodDetectionDisplay predictions={detectedMood} />
              </div>
            )}
          </div>
        </section>

        {detectedMood && (
          <section className="py-16 px-6 md:px-12 bg-gradient-to-b from-background to-card/30">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl md:text-4xl font-display font-bold">
                  Your Personalized Playlists
                </h3>
                <p className="text-muted-foreground">
                  Curated just for your {currentMood} mood
                </p>
              </div>

              {loadingPlaylists ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Finding the perfect playlists...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {playlists.map((playlist, index) => (
                    <PlaylistCard
                      key={playlist.id || index}
                      name={playlist.name}
                      description={playlist.description}
                      trackCount={playlist.trackCount}
                      imageUrl={playlist.imageUrl || undefined}
                      spotifyUrl={playlist.spotifyUrl || undefined}
                      mood={playlist.mood}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {detectedMood && tracks.length > 0 && (
          <section className="py-16 px-6 md:px-12 bg-card/30">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl md:text-4xl font-display font-bold">
                  AI-Recommended Tracks
                </h3>
                <p className="text-muted-foreground">
                  Personalized using machine learning based on your {currentMood} mood
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Ranked using scikit-learn clustering algorithms
                </p>
              </div>

              {loadingTracks ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Analyzing tracks with ML...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {tracks.slice(0, 10).map((track, index) => (
                    <TrackCard
                      key={track.id || index}
                      name={track.name}
                      artist={track.artist}
                      album={track.album}
                      imageUrl={track.imageUrl}
                      spotifyUrl={track.spotifyUrl}
                      moodMatchPercentage={track.mood_match_percentage}
                      duration_ms={track.duration_ms}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="py-16 px-6 md:px-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-3xl md:text-4xl font-display font-bold">
                Your Mood Journey
              </h3>
              <p className="text-muted-foreground">
                Track your emotional patterns over time
              </p>
            </div>

            <Tabs defaultValue="7days" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList data-testid="tabs-time-range">
                  <TabsTrigger value="7days" data-testid="tab-7-days">7 Days</TabsTrigger>
                  <TabsTrigger value="30days" data-testid="tab-30-days">30 Days</TabsTrigger>
                  <TabsTrigger value="all" data-testid="tab-all-time">All Time</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="7days">
                <MoodHistoryChart history={history} />
              </TabsContent>
              <TabsContent value="30days">
                <MoodHistoryChart history={history} />
              </TabsContent>
              <TabsContent value="all">
                <MoodHistoryChart history={history} />
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <section className="py-12 px-6 md:px-12 border-t">
          <div className="max-w-6xl mx-auto text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Moodify is for recreational use only and is not intended for clinical or therapeutic purposes.
            </p>
            <p className="text-xs text-muted-foreground">
              Mood detection is powered by AI and may not always be 100% accurate.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}