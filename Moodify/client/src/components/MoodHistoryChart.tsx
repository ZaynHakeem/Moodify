import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { MoodType } from "./MoodDetectionDisplay";
import { Heart, CloudRain, Zap, Wind, Flame, AlertCircle } from "lucide-react";

interface MoodHistoryEntry {
  date: string;
  mood: MoodType;
  confidence: number;
}

interface MoodHistoryChartProps {
  history: MoodHistoryEntry[];
}

const moodConfig = {
  happy: { color: "#f59e0b", icon: Heart, label: "Happy" },
  sad: { color: "#60a5fa", icon: CloudRain, label: "Sad" },
  energetic: { color: "#f87171", icon: Zap, label: "Energetic" },
  calm: { color: "#34d399", icon: Wind, label: "Calm" },
  angry: { color: "#ef4444", icon: Flame, label: "Angry" },
  anxious: { color: "#eab308", icon: AlertCircle, label: "Anxious" },
};

export default function MoodHistoryChart({ history }: MoodHistoryChartProps) {
  const getMoodStats = () => {
    const moodCounts = history.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<MoodType, number>);

    const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const variety = Object.keys(moodCounts).length;

    return {
      mostCommon: mostCommon ? mostCommon[0] as MoodType : null,
      totalSessions: history.length,
      variety,
    };
  };

  const stats = getMoodStats();

  const chartData = history.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    [entry.mood]: entry.confidence,
  }));

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Most Common</p>
          {stats.mostCommon && (
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = moodConfig[stats.mostCommon].icon;
                return <Icon className="h-5 w-5" style={{ color: moodConfig[stats.mostCommon].color }} />;
              })()}
              <span className="text-2xl font-display font-bold" data-testid="text-most-common-mood">
                {moodConfig[stats.mostCommon].label}
              </span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
          <p className="text-2xl font-display font-bold" data-testid="text-total-sessions">
            {stats.totalSessions}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
          <p className="text-2xl font-display font-bold" data-testid="text-current-streak">
            7 days
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Mood Variety</p>
          <p className="text-2xl font-display font-bold" data-testid="text-mood-variety">
            {stats.variety}/6
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-display font-semibold">Mood Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="happy"
                stroke={moodConfig.happy.color}
                strokeWidth={2}
                dot={{ fill: moodConfig.happy.color }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="sad"
                stroke={moodConfig.sad.color}
                strokeWidth={2}
                dot={{ fill: moodConfig.sad.color }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="energetic"
                stroke={moodConfig.energetic.color}
                strokeWidth={2}
                dot={{ fill: moodConfig.energetic.color }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="calm"
                stroke={moodConfig.calm.color}
                strokeWidth={2}
                dot={{ fill: moodConfig.calm.color }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="angry"
                stroke={moodConfig.angry.color}
                strokeWidth={2}
                dot={{ fill: moodConfig.angry.color }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="anxious"
                stroke={moodConfig.anxious.color}
                strokeWidth={2}
                dot={{ fill: moodConfig.anxious.color }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}