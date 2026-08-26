import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveRequests } from '../lib/useLiveRequests';
import { useConnection } from '../lib/useConnection';
import { connectionMonitor } from '../lib/connection';
import { offlineQueue } from '../lib/offlineQueue';
import { submitStatusEvent, syncStatusUpdates, uploadDeliveryProof } from '../lib/api';
import { useAuth } from '../lib/auth';
import { StatusBadge } from '../components/StatusBadge';
import type { Status } from '../lib/types';
import { WifiOff, QrCode, X, CheckCircle2, Loader2, RefreshCcw } from 'lucide-react';

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  Assigned: 'Picked Up',
  'Picked Up': 'Delivered',
};

export function RiderPage() {
  const { profile } = useAuth();
  const { requests, reload } = useLiveRequests();
  const online = useConnection();
  const riderId = profile?.id ?? '';

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [queueVersion, setQueueVersion] = useState(0); // bump to re-read offlineQueue
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingProofRequestId = useRef<string | null>(null);

  const myJobs = useMemo(
    () =>
      requests
        .filter((r) => r.rider_id === riderId && r.status !== 'Delivered')
        .sort((a, b) => a.status_since.localeCompare(b.status_since)),
    [requests, riderId]
  );

  const myQueueCount = useMemo(() => offlineQueue.forRider(riderId).length, [riderId, queueVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  }

  async function flushQueue() {
    const items = offlineQueue.forRider(riderId);
    if (items.length === 0 || !connectionMonitor.isOnline()) return;
    setSyncing(true);
    try {
      const results = await syncStatusUpdates(
        items.map((i) => ({
          clientEventId: i.clientEventId,
          requestId: i.requestId,
          status: i.status,
          occurredAt: i.occurredAt,
          riderId: i.riderId,
        }))
      );
      const succeeded = results.filter((r) => r.ok).map((r) => r.clientEventId);
      offlineQueue.removeMany(succeeded);
      setQueueVersion((v) => v + 1);
      if (succeeded.length > 0) showToast(`Synced ${succeeded.length} queued update${succeeded.length === 1 ? '' : 's'}.`);
      reload();
    } catch {
      // Edge function unreachable - fall back to submitting one at a time so a
      // flaky function deploy doesn't strand the whole queue.
      for (const item of items) {
        const result = await submitStatusEvent({
          clientEventId: item.clientEventId,
          requestId: item.requestId,
          status: item.status,
          occurredAt: item.occurredAt,
          riderId: item.riderId,
        });
        if (result.ok) offlineQueue.remove(item.clientEventId);
      }
      setQueueVersion((v) => v + 1);
      reload();
    } finally {
      setSyncing(false);
    }
  }

  // Flush automatically whenever we transition to online.
  useEffect(() => {
    if (online) flushQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function advance(requestId: string, current: Status, proof?: File | Blob) {
    const next = NEXT_STATUS[current];
    if (!next || !riderId) return;
    setPendingId(requestId);

    const clientEventId = crypto.randomUUID();
    const occurredAt = new Date().toISOString(); // captured now, before any network attempt

    if (!connectionMonitor.isOnline()) {
      offlineQueue.add({ clientEventId, requestId, status: next, occurredAt, riderId });
      setQueueVersion((v) => v + 1);
      setPendingId(null);
      showToast(`Queued offline — will sync as "${next}" when back online.`);
      return;
    }

    // ActivityIndicator-style delay so the tap always gets visible feedback,
    // never a blank frozen screen while the call resolves.
    await new Promise((res) => setTimeout(res, 350));
    const result = await submitStatusEvent({ clientEventId, requestId, status: next, occurredAt, riderId });
    setPendingId(null);

    if (!result.ok) {
      showToast(result.reason ?? 'Update rejected.');
      return;
    }

    if (proof) {
      try {
        await uploadDeliveryProof(requestId, clientEventId, proof);
      } catch {
        // Status is already recorded - a missing proof photo shouldn't block
        // the delivery confirmation itself.
        showToast(`Marked ${next}, but the photo didn\u2019t upload.`);
        reload();
        return;
      }
    }

    showToast(`Marked ${next}.`);
    reload();
  }

  function openScanner(requestId: string) {
    setScanTarget(requestId);
    setScannerOpen(true);
  }

  function confirmScan() {
    if (!scanTarget) return;
    pendingProofRequestId.current = scanTarget;
    setScannerOpen(false);
    // Offer to attach a proof photo before finalizing - skipped entirely if
    // the rider is offline, since a photo capture can't be queued reliably.
    if (connectionMonitor.isOnline()) {
      fileInputRef.current?.click();
    } else {
      const job = myJobs.find((j) => j.id === scanTarget);
      if (job) advance(scanTarget, job.status);
      setScanTarget(null);
    }
  }

  function handleProofSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const requestId = pendingProofRequestId.current;
    e.target.value = '';
    if (!requestId) return;
    const job = myJobs.find((j) => j.id === requestId);
    if (job) advance(requestId, job.status, file ?? undefined);
    setScanTarget(null);
    pendingProofRequestId.current = null;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
      {!online && (
        <div
          role="status"
          className="mb-4 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-[var(--color-accent)]"
        >
          <WifiOff size={20} aria-hidden="true" className="shrink-0" />
          <p className="text-sm font-medium">
            You\u2019re offline. {myQueueCount} update{myQueueCount === 1 ? '' : 's'} queued, will sync automatically.
          </p>
        </div>
      )}
      {online && myQueueCount > 0 && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[var(--color-primary)]">
          {syncing ? <Loader2 size={20} className="animate-spin shrink-0" aria-hidden="true" /> : <RefreshCcw size={20} className="shrink-0" aria-hidden="true" />}
          <p className="text-sm font-medium">Syncing {myQueueCount} queued update{myQueueCount === 1 ? '' : 's'}…</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your jobs</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{profile?.full_name}</p>
      </div>

      {myJobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-muted-foreground)]">
          No active jobs right now. New assignments will show up here immediately.
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {myJobs.map((req) => {
            const next = NEXT_STATUS[req.status];
            const isPending = pendingId === req.id;
            return (
              <li key={req.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{req.customer_name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{req.item}</p>
                  </div>
                  <StatusBadge status={req.status} since={req.status_since} />
                </div>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{req.address}</p>

                {next && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {next === 'Delivered' ? (
                      <button
                        onClick={() => openScanner(req.id)}
                        disabled={isPending}
                        className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-base font-semibold text-black transition-transform active:scale-[0.99] disabled:opacity-70"
                      >
                        {isPending ? <Loader2 className="animate-spin" size={20} aria-hidden="true" /> : <QrCode size={20} aria-hidden="true" />}
                        Scan to confirm delivery
                      </button>
                    ) : (
                      <button
                        onClick={() => advance(req.id, req.status)}
                        disabled={isPending}
                        className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-base font-semibold text-[var(--color-on-primary)] transition-transform active:scale-[0.99] disabled:opacity-70"
                      >
                        {isPending && <Loader2 className="animate-spin" size={20} aria-hidden="true" />}
                        Mark {next}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">
        <span>Demo control — force this device offline to see the sync queue.</span>
        <button
          onClick={() => connectionMonitor.setForcedOffline(online)}
          className="min-h-[36px] shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          {online ? 'Go offline' : 'Go online'}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleProofSelected} />

      {scannerOpen && (
        <div role="dialog" aria-modal="true" aria-label="QR scanner" className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4">
            <p className="font-medium text-white">Scan attendee badge</p>
            <button
              onClick={() => setScannerOpen(false)}
              aria-label="Close scanner"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-64 w-64 rounded-2xl border-2 border-white/70">
              <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--color-accent)]" aria-hidden="true" />
            </div>
          </div>
          <div className="p-6">
            <button
              onClick={confirmScan}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-base font-semibold text-black"
            >
              <CheckCircle2 size={20} aria-hidden="true" />
              Simulate successful scan
            </button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {toast}
      </p>
      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-40 rounded-xl bg-[var(--color-foreground)] px-4 py-3 text-center text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
