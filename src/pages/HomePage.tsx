import { Link } from 'react-router-dom';
import { PackageSearch, Radio, Bike, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../lib/auth';

const ROLES = [
  {
    to: '/retailer',
    icon: PackageSearch,
    title: 'Retailer staff',
    body: 'Log a delivery in under a minute and watch it move without asking anyone for an update.',
  },
  {
    to: '/dispatcher',
    icon: Radio,
    title: 'Dispatcher',
    body: 'See every open request the moment it lands, and assign a rider in one click.',
  },
  {
    to: '/rider',
    icon: Bike,
    title: 'Rider',
    body: 'Big buttons, one-handed. Scan on handoff, and your update syncs even after a dead zone.',
  },
];

export function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { session, profile } = useAuth();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches || !heroRef.current) return;
    const cards = heroRef.current.querySelectorAll('[data-reveal]');
    gsap.from(cards, {
      opacity: 0,
      y: 12,
      duration: 0.35,
      ease: 'power1.out',
      stagger: 0.08,
    });
  }, []);

  const primaryCta = !session
    ? { to: '/signup', label: 'Create an account' }
    : profile?.role === 'dispatcher'
      ? { to: '/dispatcher', label: 'Open the dispatcher dashboard' }
      : profile?.role === 'rider'
        ? { to: '/rider', label: 'See your jobs' }
        : { to: '/retailer', label: 'Log a delivery request' };

  return (
    <div ref={heroRef}>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <p data-reveal className="font-data text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
          Built for shops that already know their business
        </p>
        <h1 data-reveal className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Delivery status your team can see, not one you have to ask for.
        </h1>
        <p data-reveal className="mt-5 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Reflex replaces the WhatsApp thread. A retailer logs a request, a dispatcher assigns a
          rider, and the rider updates status by scan — every screen shows the same truth the
          instant it changes.
        </p>
        <div data-reveal className="mt-8 flex flex-wrap gap-3">
          <Link
            to={primaryCta.to}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-[var(--color-on-primary)] transition-colors hover:brightness-95"
          >
            {primaryCta.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {!session && (
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ to, icon: Icon, title, body }) => (
            <Link
              key={to}
              to={to}
              data-reveal
              className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-colors hover:border-[var(--color-primary)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-muted)] text-[var(--color-primary)]">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">{body}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
                Open
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>

        <div data-reveal className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="text-base font-semibold">How the pieces stay in sync</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">
            Every status change is stored as its own event and broadcast to every open screen
            immediately — nobody is refreshing a page to find out what happened. If a rider loses
            signal mid-run, their update queues on the device and syncs the moment connectivity
            returns, resolved by when it actually happened rather than the order it arrived in.
            A second scan on a delivered request is rejected, not silently accepted.
          </p>
        </div>
      </section>
    </div>
  );
}
