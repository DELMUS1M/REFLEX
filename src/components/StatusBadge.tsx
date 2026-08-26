import { useTick } from '../lib/useTick';
import { relativeTime } from '../lib/time';
import type { Status } from '../lib/types';

const STYLES: Record<Status, { bg: string; fg: string; dot: string }> = {
  Open: { bg: 'bg-[var(--color-muted)]', fg: 'text-[var(--color-muted-foreground)]', dot: 'bg-slate-400' },
  Assigned: { bg: 'bg-blue-100', fg: 'text-[var(--color-primary)]', dot: 'bg-[var(--color-primary)]' },
  'Picked Up': { bg: 'bg-orange-100', fg: 'text-[var(--color-accent)]', dot: 'bg-[var(--color-accent)]' },
  Delivered: { bg: 'bg-green-100', fg: 'text-[var(--color-success)]', dot: 'bg-[var(--color-success)]' },
};

interface StatusBadgeProps {
  status: Status;
  since: string | number;
  stale?: boolean;
}

/**
 * The one status badge used everywhere in the product (dispatcher queue,
 * retailer tracking, rider job card). One atomic, human-readable message -
 * never a bare number - with a reserved layout footprint so a status change
 * never shifts surrounding buttons or table columns.
 */
export function StatusBadge({ status, since, stale }: StatusBadgeProps) {
  useTick(15000); // keep "N min ago" fresh
  const style = STYLES[status];
  const sinceMs = typeof since === 'string' ? new Date(since).getTime() : since;
  const label = `${status}${stale ? ' · stale' : ` · ${relativeTime(sinceMs)}`}`;

  return (
    <span
      role="status"
      aria-atomic="true"
      className={`inline-flex min-w-[152px] items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${style.bg} ${style.fg} ${
        stale ? 'opacity-60' : ''
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <span className="font-data whitespace-nowrap">{label}</span>
    </span>
  );
}
