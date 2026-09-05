const FAQS = [
  {
    q: 'Do our staff need to install anything?',
    a: 'No. Reflex runs in the browser on whatever phone or computer each person already has. Retailer staff, dispatchers, and riders all use the same web app, just different screens for their role.',
  },
  {
    q: 'What happens if a rider loses signal mid-delivery?',
    a: 'Their status update queues on the device and sends automatically the moment connectivity returns. Nothing is lost, and updates are resolved by when they actually happened, not the order they arrive in.',
  },
  {
    q: 'Can a delivery be marked done twice by mistake?',
    a: "No. A second scan on a request that's already Delivered is rejected, not silently accepted. That protection holds even if confirmations arrive out of order.",
  },
  {
    q: 'Does this replace our WhatsApp group entirely?',
    a: 'That\u2019s the point of it. Retailer staff log the request once, the dispatcher assigns it, and the rider updates status by scan. Everyone sees the same status on their own screen instead of scrolling a chat thread.',
  },
  {
    q: 'What do we need to get started?',
    a: 'A phone or computer per role and an internet connection at setup. Create an account, add your team, and the first request can be logged the same day.',
  },
];

export function FaqAccordion() {
  return (
    <dl className="divide-y divide-[var(--color-border)]">
      {FAQS.map(({ q, a }) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-normal text-[var(--color-foreground)] marker:content-['']">
            {q}
            <span
              className="shrink-0 text-2xl font-light text-[var(--color-muted-foreground)] transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <dd className="mt-3 max-w-2xl text-base font-light text-[var(--color-muted-foreground)]">{a}</dd>
        </details>
      ))}
    </dl>
  );
}
