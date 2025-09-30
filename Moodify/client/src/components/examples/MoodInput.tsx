import MoodInput from '../MoodInput';

export default function MoodInputExample() {
  const handleSubmit = (text: string) => {
    console.log('Mood text submitted:', text);
  };

  return (
    <div className="p-8">
      <MoodInput onSubmit={handleSubmit} currentMood="calm" />
    </div>
  );
}
