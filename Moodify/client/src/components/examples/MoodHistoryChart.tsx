import MoodHistoryChart from '../MoodHistoryChart';

export default function MoodHistoryChartExample() {
  // todo: remove mock functionality
  const mockHistory = [
    { date: '2025-09-23', mood: 'happy' as const, confidence: 85 },
    { date: '2025-09-24', mood: 'calm' as const, confidence: 72 },
    { date: '2025-09-25', mood: 'energetic' as const, confidence: 90 },
    { date: '2025-09-26', mood: 'calm' as const, confidence: 78 },
    { date: '2025-09-27', mood: 'sad' as const, confidence: 65 },
    { date: '2025-09-28', mood: 'happy' as const, confidence: 88 },
    { date: '2025-09-29', mood: 'calm' as const, confidence: 82 },
  ];

  return (
    <div className="p-8">
      <MoodHistoryChart history={mockHistory} />
    </div>
  );
}
