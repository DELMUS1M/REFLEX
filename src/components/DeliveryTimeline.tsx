import type { Status } from '../lib/types';

/**
 * A proof point, not an illustration: the same four states and order the
 * product actually uses (see lib/types.ts STATUS_ORDER), shown with example
 * timestamps for a single sample delivery. Colors follow the Status Pill
 * spec in design.md — pending stays neutral, the current step is tracking
 * blue, and delivered is the only place signal green appears.
 */

const STEPS: { status: Status; label: string; time: string }[] = [
  { status: 'Open', label: 'Logged', time: '10:02' },
  { status: 'Assigned', label: 'Assigned', time: '10:06' },
  { status: 'Picked Up', label: 'Picked up', time: '10:19' },
  { status: 'Delivered', label: 'Delivered', time: '10:41' },
];

const CURRENT_INDEX = 3; // this sample has completed — every step is "reached"

export function DeliveryTimeline() {
  return (
    <ol className="flex flex-wrap items-start gap-x-2 gap-y-6 sm:flex-nowrap" aria-label="Sample delivery status timeline">
      {STEPS.map((step, i) => {
        const reached = i <= CURRENT_INDEX;
        const isDelivered = step.status === 'Delivered';
        const pillColor = !reached
          ? 'border border-[var(--ref-ash-gray)] text-[var(--ref-ash-gray)]'
          : isDelivered
            ? 'bg-[var(--ref-signal-green)] text-[var(--ref-night-asphalt)]'
            : 'bg-[var(--ref-tracking-blue)] text-[var(--ref-cloud-white)]';

        return (
          <li key={step.status} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-[92px] flex-col items-start gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-medium tracking-[0.04em] ${pillColor}`}
              >
                {step.label}
              </span>
              <span className="font-data text-[13px] text-[var(--ref-steel-mist)]">{step.time}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className="hidden h-px flex-1 sm:block"
                style={{ backgroundColor: 'var(--ref-route-line-dim)' }}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}