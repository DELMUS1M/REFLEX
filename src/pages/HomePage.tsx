import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { LiveRouteField } from '../components/LiveRouteField';
import { DeliveryTimeline } from '../components/DeliveryTimeline';

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Reflex',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Real-time delivery coordination for small Kenyan retailers — retailer staff log requests, dispatchers assign riders, and riders confirm delivery, replacing WhatsApp-based tracking.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KES',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Kenya',
  },
};

const PERSONAS = [
  {
    to: '/retailer',
    markerColor: 'var(--ref-tracking-blue)',
    title: 'Retailer staff',
    body: 'Logs a delivery request with customer name, phone, address, and item — under a minute, no phone call needed.',
  },
  {
    to: '/dispatcher',
    markerColor: 'var(--ref-delivery-orange)',
    title: 'Dispatcher',
    body: 'Sees every open request the moment it lands and assigns it to a rider in one tap.',
  },
  {
    to: '/rider',
    markerColor: 'linear-gradient(135deg, var(--ref-tracking-blue), var(--ref-signal-green))',
    title: 'Rider',
    body: 'Updates status by scan on handoff. Big buttons, one hand — and it still syncs after a dead zone.',
  },
];

export function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { session, profile } = useAuth();

  useDocumentMeta({
    title: 'Reflex',
    description:
      'Reflex replaces WhatsApp delivery coordination for small Kenyan retailers. Log a request, assign a rider, and get real-time status through to proof of delivery.',
    path: '/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(STRUCTURED_DATA);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches || !heroRef.current) return;
    const cards = heroRef.current.querySelectorAll('[data-reveal]');
    // Loaded on demand: gsap is a ~30kB dependency for a nice-to-have reveal
    // animation, not core content, so it shouldn't sit in the main bundle
    // that every visitor downloads before first paint.
    import('gsap').then(({ gsap }) => {
      gsap.from(cards, {
        opacity: 0,
        y: 12,
        duration: 0.35,
        ease: 'power1.out',
        stagger: 0.08,
      });
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
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-8">
        <div>
          <h1
            data-reveal
            className="max-w-xl text-[42px] font-light leading-[1.1] tracking-[-0.02em] text-[var(--ref-cloud-white)] sm:text-[56px] lg:text-[64px]"
          >
            Track it, don&rsquo;t ask about it.
          </h1>
          <p data-reveal className="mt-6 max-w-md text-lg font-light text-[var(--ref-cloud-white)]">
            Reflex replaces the WhatsApp thread. A retailer logs a request, a dispatcher assigns a
            rider, and the rider updates status by scan — every screen shows the same truth the
            instant it changes.
          </p>
          <div data-reveal className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              to={primaryCta.to}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--ref-tracking-blue)] px-6 py-3 font-medium text-[var(--ref-cloud-white)] transition-colors hover:bg-[#1D4ED8]"
            >
              {primaryCta.label}
            </Link>
            {!session && (
              <Link
                to="/login"
                className="min-h-[44px] py-3 font-medium text-[var(--ref-cloud-white)] underline decoration-[var(--ref-ash-gray)] decoration-1 underline-offset-4 transition-colors hover:decoration-[var(--ref-tracking-blue)]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        <div data-reveal className="lg:pl-4">
          <div className="aspect-[430/300] w-full">
            <LiveRouteField />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-2xl font-light leading-snug text-[var(--ref-cloud-white)] sm:text-[28px]">
            Right now, it's a WhatsApp thread — a customer asking where their order is, a retailer
            forwarding that question to a rider, and nobody with a clear answer until someone
            replies.
          </p>
          <p data-reveal className="mt-4 text-lg font-light text-[var(--ref-steel-mist)]">
            Reflex replaces that thread with one shared status every screen agrees on.
          </p>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:gap-12">
          {PERSONAS.map(({ to, markerColor, title, body }) => (
            <Link
              key={to}
              to={to}
              data-reveal
              className="group flex-1 border-l-2 py-1 pl-5 transition-opacity hover:opacity-80"
              style={{ borderLeftColor: markerColor.startsWith('linear') ? 'var(--ref-tracking-blue)' : markerColor }}
            >
              <h2 className="text-[28px] font-light text-[var(--ref-cloud-white)] sm:text-[32px]">{title}</h2>
              <p className="mt-3 text-base font-light text-[var(--ref-steel-mist)]">{body}</p>
              <span className="mt-3 inline-block text-sm font-medium text-[var(--ref-tracking-blue)]">
                Open
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline proof */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-[28px] font-light text-[var(--ref-cloud-white)]">
          One delivery, one status, four screens agreeing on it.
        </h2>
        <div className="mt-8 max-w-3xl">
          <DeliveryTimeline />
        </div>
      </section>

      {/* Architecture honesty */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div data-reveal className="max-w-3xl">
          <h2 className="text-[22px] font-light text-[var(--ref-cloud-white)]">
            How the pieces stay in sync
          </h2>
          <p className="mt-3 text-base font-light text-[var(--ref-steel-mist)]">
            Every status change is stored as its own event and broadcast to every open screen
            immediately — nobody is refreshing a page to find out what happened. If a rider loses
            signal mid-run, their update queues on the device and syncs the moment connectivity
            returns, resolved by when it actually happened rather than the order it arrived in.
            A second scan on a delivered request is rejected, not silently accepted.
          </p>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="border-t border-[var(--ref-route-line-dim)] pt-12">
          <h2 className="max-w-lg text-[36px] font-light leading-tight text-[var(--ref-cloud-white)] sm:text-[42px]">
            Ready to stop asking where it is?
          </h2>
          <div className="mt-6">
            <Link
              to={primaryCta.to}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--ref-tracking-blue)] px-6 py-3 font-medium text-[var(--ref-cloud-white)] transition-colors hover:bg-[#1D4ED8]"
            >
              {primaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}