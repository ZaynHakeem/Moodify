import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface MoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  currentMood?: "happy" | "sad" | "energetic" | "calm" | "angry" | "anxious" | null;
}

export default function MoodInput({ onSubmit, isLoading, currentMood }: MoodInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
    }
  };

  const getMoodGradient = () => {
    if (!currentMood) return "";
    const moodColors = {
      happy: "from-mood-happy/20",
      sad: "from-mood-sad/20",
      energetic: "from-mood-energetic/20",
      calm: "from-mood-calm/20",
      angry: "from-red-500/20",
      anxious: "from-yellow-500/20",
    };
    return `bg-gradient-to-br ${moodColors[currentMood]} to-background`;
  };

  return (
    <div className={`w-full max-w-3xl mx-auto transition-all duration-500 ${getMoodGradient()}`}>
      <div className="space-y-6 p-8 rounded-lg">
        <div className="space-y-2">
          <label htmlFor="mood-input" className="text-sm font-medium text-muted-foreground">
            How are you feeling?
          </label>
          <Textarea
            id="mood-input"
            placeholder="I feel stressed and overwhelmed with work today..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-32 resize-none text-base border-2 focus-visible:ring-2 transition-all"
            disabled={isLoading}
            data-testid="input-mood-text"
          />
          <p className="text-xs text-muted-foreground" data-testid="text-character-count">
            {text.length} characters
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="w-full gap-2"
          size="lg"
          data-testid="button-detect-mood"
        >
          <Sparkles className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Detecting Mood..." : "Detect My Mood"}
        </Button>
      </div>
    </div>
  );
}