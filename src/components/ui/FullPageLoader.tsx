import SyncSphereLogo from './SyncSphereLogo';

export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-[var(--bg)] flex flex-col items-center justify-center gap-6 z-[100]">
      <SyncSphereLogo size="lg" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
