import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Music2 } from "lucide-react";
import type { MoodType } from "./MoodDetectionDisplay";

interface PlaylistCardProps {
  name: string;
  description: string;
  trackCount: number;
  imageUrl?: string;
  mood: MoodType;
  spotifyUrl?: string;
}

const moodColors = {
  happy: "from-mood-happy/60",
  sad: "from-mood-sad/60",
  energetic: "from-mood-energetic/60",
  calm: "from-mood-calm/60",
};

export default function PlaylistCard({
  name,
  description,
  trackCount,
  imageUrl,
  mood,
  spotifyUrl,
}: PlaylistCardProps) {
  const handlePlay = () => {
    if (spotifyUrl) {
      window.open(spotifyUrl, '_blank');
    } else {
      console.log('Play playlist:', name);
    }
  };

  return (
    <Card className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300" data-testid={`card-playlist-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="aspect-square relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card to-muted flex items-center justify-center">
            <Music2 className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${moodColors[mood]} to-transparent opacity-80`} />
        
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <span className="text-white font-medium text-sm drop-shadow-lg" data-testid="text-track-count">
            {trackCount} tracks
          </span>
          <Button
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={handlePlay}
            data-testid="button-play-playlist"
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <h3 className="font-display font-semibold text-lg line-clamp-1" data-testid="text-playlist-name">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-playlist-description">
          {description}
        </p>
      </div>
    </Card>
  );
}
