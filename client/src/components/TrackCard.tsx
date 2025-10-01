import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrackCardProps {
  name: string;
  artist: string;
  album: string;
  imageUrl?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  moodMatchPercentage?: number;
  duration_ms?: number;
}

export default function TrackCard({
  name,
  artist,
  album,
  imageUrl,
  spotifyUrl,
  moodMatchPercentage,
  duration_ms,
}: TrackCardProps) {
  const handlePlay = () => {
    if (spotifyUrl) {
      window.open(spotifyUrl, '_blank');
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="group overflow-hidden hover-elevate cursor-pointer transition-all duration-300 flex items-center gap-4 p-4">
      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card to-muted flex items-center justify-center">
            <Music2 className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm line-clamp-1">{name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{artist}</p>
        {album && (
          <p className="text-xs text-muted-foreground/60 line-clamp-1">{album}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {moodMatchPercentage && moodMatchPercentage > 0 && (
          <Badge variant="outline" className="text-xs">
            {Math.round(moodMatchPercentage)}% match
          </Badge>
        )}
        {duration_ms && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(duration_ms)}
          </span>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity"
          onClick={handlePlay}
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}