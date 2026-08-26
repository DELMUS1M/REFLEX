import { useConnection } from '../lib/useConnection';

export function ConnectionIndicator() {
  const online = useConnection();
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-[var(--color-success)]' : 'bg-slate-400 animate-pulse'}`}
        aria-hidden="true"
      />
      <span>{online ? 'Live' : 'Reconnecting…'}</span>
      <span className="sr-only" role="status" aria-live="polite">
        {online ? 'Connection live' : 'Connection lost, reconnecting'}
      </span>
    </span>
  );
}
