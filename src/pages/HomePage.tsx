import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { ClipboardList, Route as RouteIcon, PackageCheck, WifiOff, Zap, Smartphone } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { LiveRouteField } from '../components/LiveRouteField';
import { DeliveryTimeline } from '../components/DeliveryTimeline';
import { FaqAccordion } from '../components/FaqAccordion';

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Reflex',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Real-time delivery coordination for small Kenyan retailers. Retailer staff log requests, dispatchers assign riders, and riders confirm delivery, replacing WhatsApp-based tracking.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KES' },
  areaServed: { '@type': 'Country', name: 'Kenya' },
};

const STATS = [
  { value: '3', label: 'Roles working from one shared status' },
  { value: '4', label: 'Delivery states, always current on every screen' },
  { value: '0', label: 'Phone calls needed to check where an order is' },
];

const SERVICES = [
  {
    to: '/retailer',
    icon: ClipboardList,
    title: 'Log a request',
    body: 'Retailer staff enter customer name, phone, address, and item in under a minute, no phone call needed to start a delivery.',
  },
  {
    to: '/dispatcher',
    icon: RouteIcon,
    title: 'Assign & dispatch',
    body: 'Dispatchers see every open request the moment it lands and hand it to a rider in one tap.',
  },
  {
    to: '/rider',
    icon: PackageCheck,
    title: 'Track to delivery',
    body: 'Riders update status by scan on handoff and on delivery. Big buttons, one hand, works after a dead zone.',
  },
];

const WHY_REFLEX = [
  {
    icon: WifiOff,
    title: 'Works offline',
    body: 'A rider losing signal mid-run queues the update on the device and syncs the moment connectivity returns.',
  },
  {
    icon: Zap,
    title: 'Real-time for everyone',
    body: 'Every status change broadcasts to every open screen immediately, so nobody refreshes a page to find out what happened.',
  },
  {
    icon: Smartphone,
    title: 'Simple for every role',
    body: 'Retailer staff, dispatchers, and riders each get a screen built for exactly what they need to do, nothing more.',
  },
  {
    icon: PackageCheck,
    title: 'Proof of delivery',
    body: 'A photo at handoff closes the loop, and a second scan on an already-delivered request is rejected, not accepted.',
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
    const items = heroRef.current.querySelectorAll('[data-reveal]');
    // Deferred: gsap shouldn't sit in the bundle every visitor downloads
    // before first paint for what is a nice-to-have reveal animation.
    import('gsap').then(({ gsap }) => {
      gsap.from(items, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', stagger: 0.08 });
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
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <h1
            data-reveal
            className="max-w-xl text-[40px] font-normal leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)] sm:text-[52px] lg:text-[58px]"
          >
            Every delivery, tracked from the counter to the door.
          </h1>
          <p data-reveal className="mt-6 max-w-md text-lg font-light text-[var(--color-muted-foreground)]">
            Reflex replaces the WhatsApp thread small Kenyan retailers use to coordinate
            deliveries. One shared status shows a retailer, dispatcher, and rider the same thing,
            in real time.
          </p>
          <div data-reveal className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              to={primaryCta.to}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              {primaryCta.label}
            </Link>
            <a
              href="#how-it-works"
              className="min-h-[44px] py-3 font-medium text-[var(--color-foreground)] underline decoration-[var(--color-border)] decoration-1 underline-offset-4 transition-colors hover:decoration-[var(--color-primary)]"
            >
              See how it works
            </a>
          </div>
        </div>

        <div data-reveal className="overflow-hidden rounded-2xl">
          <img  src="/hero-handoff.jpg"  alt="A rider handing a package to a retailer at a shop counter"  className="aspect-[4/3] w-full rounded-2xl object-cover" fetchpriority="high" />
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {STATS.map((stat) => (
            <div key={stat.label} data-reveal>
              <div className="font-data text-[40px] font-medium leading-none text-[var(--color-primary)]">
                {stat.value}
              </div>
              <p className="mt-2 max-w-[220px] text-sm text-[var(--color-muted-foreground)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services / how it flows between roles */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-lg text-[32px] font-normal text-[var(--color-foreground)]">
          One delivery, three roles, no phone tag.
        </h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {SERVICES.map(({ to, icon: Icon, title, body }) => (
            <Link key={to} to={to} data-reveal className="group block">
              <Icon className="text-[var(--color-primary)]" size={28} aria-hidden="true" />
              <h3 className="mt-4 text-xl font-normal text-[var(--color-foreground)]">{title}</h3>
              <p className="mt-2 text-base font-light text-[var(--color-muted-foreground)]">{body}</p>
              <span className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] transition-transform group-hover:translate-x-0.5">
                Open
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works diagram */}
      <section id="how-it-works" className="bg-[var(--color-background)] py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div data-reveal>
            <h2 className="text-[28px] font-normal text-[var(--color-foreground)]">
              A request moves the same way, every time.
            </h2>
            <p className="mt-4 max-w-md text-base font-light text-[var(--color-muted-foreground)]">
              Logged by retailer staff, assigned by a dispatcher, delivered by a rider. Each
              handoff updates one shared status instead of starting a new WhatsApp message.
            </p>
          </div>
          <div data-reveal className="aspect-[430/300] w-full">
            <LiveRouteField />
          </div>
        </div>
      </section>

      {/* Why Reflex */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-lg text-[28px] font-normal text-[var(--color-foreground)]">Why retailers switch</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {WHY_REFLEX.map(({ icon: Icon, title, body }) => (
            <div key={title} data-reveal>
              <Icon className="text-[var(--color-accent)]" size={24} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-normal text-[var(--color-foreground)]">{title}</h3>
              <p className="mt-2 text-sm font-light text-[var(--color-muted-foreground)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline proof */}
      <section className="bg-[var(--color-card)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[26px] font-normal text-[var(--color-foreground)]">
            One delivery, four screens agreeing on it.
          </h2>
          <div className="mt-10 max-w-3xl">
            <DeliveryTimeline />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h2 className="text-[28px] font-normal text-[var(--color-foreground)]">Questions retailers ask first</h2>
        <div className="mt-8">
          <FaqAccordion />
        </div>
      </section>

      {/* Final CTA banner */}
      <section className="bg-[var(--color-ink)] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-[32px] font-normal leading-tight text-[var(--color-ink-foreground)] sm:text-[40px]">
            Ready to stop asking where it is?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-light text-[var(--color-ink-muted)]">
            Create an account and log your first delivery request today.
          </p>
          <div className="mt-8">
            <Link
              to={primaryCta.to}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              {primaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
