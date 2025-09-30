import MoodDetectionDisplay from '../MoodDetectionDisplay';

export default function MoodDetectionDisplayExample() {
  const mockPredictions = [
    { mood: 'calm' as const, confidence: 78 },
    { mood: 'sad' as const, confidence: 15 },
    { mood: 'happy' as const, confidence: 7 },
  ];

  return (
    <div className="p-8">
      <MoodDetectionDisplay predictions={mockPredictions} />
    </div>
  );
}
