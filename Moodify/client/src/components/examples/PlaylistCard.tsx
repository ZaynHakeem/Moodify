import PlaylistCard from '../PlaylistCard';

export default function PlaylistCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <PlaylistCard
        name="Calm Acoustic Vibes"
        description="Gentle acoustic melodies to help you unwind and find peace"
        trackCount={42}
        mood="calm"
      />
    </div>
  );
}
