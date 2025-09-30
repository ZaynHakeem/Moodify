import { Badge } from "@/components/ui/badge";
import { Heart, CloudRain, Zap, Wind, Flame, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type MoodType = "happy" | "sad" | "energetic" | "calm" | "angry" | "anxious";

interface MoodPrediction {
  mood: MoodType;
  confidence: number;
}

interface MoodDetectionDisplayProps {
  predictions: MoodPrediction[];
}

const moodConfig = {
  happy: {
    icon: Heart,
    label: "Happy",
    color: "text-mood-happy",
    bgColor: "bg-mood-happy/10",
    borderColor: "border-mood-happy/30",
  },
  sad: {
    icon: CloudRain,
    label: "Sad",
    color: "text-mood-sad",
    bgColor: "bg-mood-sad/10",
    borderColor: "border-mood-sad/30",
  },
  energetic: {
    icon: Zap,
    label: "Energetic",
    color: "text-mood-energetic",
    bgColor: "bg-mood-energetic/10",
    borderColor: "border-mood-energetic/30",
  },
  calm: {
    icon: Wind,
    label: "Calm",
    color: "text-mood-calm",
    bgColor: "bg-mood-calm/10",
    borderColor: "border-mood-calm/30",
  },
  angry: {
    icon: Flame,
    label: "Angry",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  anxious: {
    icon: AlertCircle,
    label: "Anxious",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
};

export default function MoodDetectionDisplay({ predictions }: MoodDetectionDisplayProps) {
  const primary = predictions[0];
  const alternatives = predictions.slice(1);
  const config = moodConfig[primary.mood];
  const Icon = config.icon;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-8 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className={`p-3 rounded-full ${config.bgColor} mood-glow`}>
              <Icon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Detected Mood</p>
              <h3 className={`text-3xl font-display font-bold ${config.color}`} data-testid="text-primary-mood">
                {config.label}
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium" data-testid="text-confidence-value">
                {Math.round(primary.confidence)}%
              </span>
            </div>
            <Progress value={primary.confidence} className="h-2" data-testid="progress-confidence" />
          </div>
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Other possibilities</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((pred) => {
              const altConfig = moodConfig[pred.mood];
              const AltIcon = altConfig.icon;
              return (
                <Badge
                  key={pred.mood}
                  variant="outline"
                  className={`gap-2 ${altConfig.color} ${altConfig.borderColor}`}
                  data-testid={`badge-alt-mood-${pred.mood}`}
                >
                  <AltIcon className="h-3 w-3" />
                  {altConfig.label} ({Math.round(pred.confidence)}%)
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}