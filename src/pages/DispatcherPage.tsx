import { useMemo, useState } from 'react';
import { useLiveRequests } from '../lib/useLiveRequests';
import { useConnection } from '../lib/useConnection';
import { assignRider } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { clockTime } from '../lib/time';
import { ArrowUpDown, Loader2 } from 'lucide-react';

type SortKey = 'status' | 'time';

export function DispatcherPage() {
  const { requests, riders, loading, error: loadError } = useLiveRequests();
  const online = useConnection();
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const sorted = [...requests].sort((a, b) => {
      if (sortKey === 'time')
        return sortDir === 'desc'
          ? b.created_at.localeCompare(a.created_at)
          : a.created_at.localeCompare(b.created_at);
      const cmp = a.status.localeCompare(b.status);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [requests, sortKey, sortDir]);

  const metrics = useMemo(() => {
    const open = requests.filter((r) => r.status === 'Open').length;
    const inTransit = requests.filter((r) => r.status === 'Assigned' || r.status === 'Picked Up').length;
    const today = new Date().toDateString();
    const deliveredToday = requests.filter(
      (r) => r.status === 'Delivered' && new Date(r.status_since).toDateString() === today
    ).length;
    return { open, inTransit, deliveredToday };
  }, [requests]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function riderLoad(riderId: string) {
    return requests.filter((r) => r.rider_id === riderId && (r.status === 'Assigned' || r.status === 'Picked Up')).length;
  }

  async function handleAssign(requestId: string, riderId: string) {
    setAssigning(requestId);
    setAssignError(null);
    const result = await assignRider(requestId, riderId);
    setAssigning(null);
    if (!result.ok) setAssignError(result.reason ?? 'Could not assign rider.');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* 1. Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dispatcher queue</h1>
          <p className="mt-1 text-[var(--color-muted-foreground)]">
            {requests.length} request{requests.length === 1 ? '' : 's'} total
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-[var(--color-success)]' : 'bg-slate-400 animate-pulse'}`} aria-hidden="true" />
          {online ? 'Live' : 'Reconnecting…'}
        </span>
      </div>

      {/* 2. Key metrics strip */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Metric label="Open" value={metrics.open} />
        <Metric label="In transit" value={metrics.inTransit} />
        <Metric label="Delivered today" value={metrics.deliveredToday} />
      </div>

      {assignError && (
        <p role="alert" className="mt-4 rounded-lg border border-[var(--color-destructive)] bg-red-50 px-3 py-2 text-sm text-[var(--color-destructive)]">
          {assignError}
        </p>
      )}
      {loadError && (
        <p role="alert" className="mt-4 rounded-lg border border-[var(--color-destructive)] bg-red-50 px-3 py-2 text-sm text-[var(--color-destructive)]">
          {loadError}
        </p>
      )}

      {/* 3. Live queue table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {loading ? (
          <div className="flex items-center gap-2 p-10 text-[var(--color-muted-foreground)]">
            <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Loading…
          </div>
        ) : requests.length === 0 ? (
          <p className="p-10 text-center text-[var(--color-muted-foreground)]">
            No requests yet. They\u2019ll appear here the moment a retailer logs one.
          </p>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Item</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('time')}
                    className="flex min-h-[32px] items-center gap-1 font-medium hover:text-[var(--color-foreground)]"
                  >
                    Logged <ArrowUpDown size={14} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('status')}
                    className="flex min-h-[32px] items-center gap-1 font-medium hover:text-[var(--color-foreground)]"
                  >
                    Status <ArrowUpDown size={14} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-medium">Assign</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((req) => (
                <tr key={req.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{req.customer_name}</p>
                    <p className="text-[var(--color-muted-foreground)]">{req.address}</p>
                  </td>
                  <td className="px-4 py-3">{req.item}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-muted-foreground)]">{clockTime(new Date(req.created_at).getTime())}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} since={req.status_since} />
                  </td>
                  <td className="px-4 py-3">
                    {req.rider_id ? (
                      <span className="text-[var(--color-muted-foreground)]">{req.rider_name ?? 'Assigned'}</span>
                    ) : assigning === req.id ? (
                      <span className="inline-flex items-center gap-2 text-[var(--color-muted-foreground)]">
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" /> Assigning…
                      </span>
                    ) : (
                      <select
                        defaultValue=""
                        aria-label={`Assign a rider to ${req.customer_name}'s request`}
                        onChange={(e) => {
                          if (e.target.value) handleAssign(req.id, e.target.value);
                        }}
                        className="min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-sm outline-none focus-visible:border-[var(--color-primary)]"
                      >
                        <option value="" disabled>
                          Choose rider…
                        </option>
                        {riders.map((rider) => (
                          <option key={rider.id} value={rider.id}>
                            {rider.full_name} ({riderLoad(rider.id)} active)
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
      <p className="font-data mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
