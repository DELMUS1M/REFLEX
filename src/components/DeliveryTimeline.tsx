import type { Status } from '../lib/types';

/**
 * Same real status vocabulary and order the product uses (see
 * lib/types.ts STATUS_ORDER). A proof point, not marketing copy.
 */

const STEPS: { status: Status; label: string; time: string }[] = [
  { status: 'Open', label: 'Logged', time: '10:02' },
  { status: 'Assigned', label: 'Assigned', time: '10:06' },
  { status: 'Picked Up', label: 'Picked up', time: '10:19' },
  { status: 'Delivered', label: 'Delivered', time: '10:41' },
];

const CURRENT_INDEX = 3;

export function DeliveryTimeline() {
  return (
    <ol className="flex flex-wrap items-start gap-x-2 gap-y-6 sm:flex-nowrap" aria-label="Sample delivery status timeline">
      {STEPS.map((step, i) => {
        const reached = i <= CURRENT_INDEX;
        const isDelivered = step.status === 'Delivered';
        const pillColor = !reached
          ? 'border border-[var(--color-border)] text-[var(--color-muted-foreground)]'
          : isDelivered
            ? 'bg-[var(--color-success)] text-white'
            : 'bg-[var(--color-primary)] text-white';

        return (
          <li key={step.status} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-[92px] flex-col items-start gap-2">
              <span className={`rounded-full px-3 py-1 text-[13px] font-medium tracking-[0.04em] ${pillColor}`}>
                {step.label}
              </span>
              <span className="font-data text-[13px] text-[var(--color-muted-foreground)]">{step.time}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="hidden h-px flex-1 bg-[var(--color-border)] sm:block" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
