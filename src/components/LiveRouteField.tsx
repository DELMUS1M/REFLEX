import { useEffect, useRef } from 'react';

/**
 * A literal diagram of the product's own status flow: retailer (square) to
 * dispatcher (diamond) to rider (circle), with a dashed line that draws
 * itself and flashes green on delivery. Used in the "how it works" section,
 * not the hero. The hero carries a real photo instead.
 */

const GRID_LINES_X = [40, 110, 180, 250, 320, 390];
const GRID_LINES_Y = [30, 90, 150, 210, 270];

const ROUTES = [
  { retailer: { x: 70, y: 60 }, dispatcher: { x: 220, y: 120 }, rider: { x: 360, y: 210 } },
  { retailer: { x: 320, y: 60 }, dispatcher: { x: 180, y: 150 }, rider: { x: 70, y: 240 } },
];

export function LiveRouteField() {
  const svgRef = useRef<SVGSVGElement>(null);
  const routeIndexRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!svgRef.current) return;

    if (mq.matches) {
      const path = svgRef.current.querySelector<SVGPathElement>('[data-route-path]');
      path?.setAttribute('opacity', '1');
      return;
    }

    let cancelled = false;
    let timeoutId: number;

    import('gsap').then(({ gsap }) => {
      if (cancelled || !svgRef.current) return;
      const svg = svgRef.current;
      const path = svg.querySelector<SVGPathElement>('[data-route-path]');
      const dispatcherMark = svg.querySelector<SVGElement>('[data-marker="dispatcher"]');
      const riderMark = svg.querySelector<SVGElement>('[data-marker="rider"]');
      const riderRing = svg.querySelector<SVGElement>('[data-rider-ring]');
      if (!path || !dispatcherMark || !riderMark || !riderRing) return;

      const setRoute = (i: number) => {
        const route = ROUTES[i];
        const d = `M${route.retailer.x},${route.retailer.y} L${route.dispatcher.x},${route.dispatcher.y} L${route.rider.x},${route.rider.y}`;
        path.setAttribute('d', d);
        dispatcherMark.setAttribute('transform', `translate(${route.dispatcher.x},${route.dispatcher.y})`);
        riderMark.setAttribute('transform', `translate(${route.rider.x},${route.rider.y})`);
        riderRing.setAttribute('transform', `translate(${route.rider.x},${route.rider.y})`);
        const retailerMark = svg.querySelector<SVGElement>('[data-marker="retailer"]');
        retailerMark?.setAttribute('transform', `translate(${route.retailer.x},${route.retailer.y})`);
      };

      const runCycle = () => {
        if (cancelled) return;
        setRoute(routeIndexRef.current);
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
        gsap.set(riderRing, { opacity: 0, scale: 1, transformOrigin: 'center' });

        const tl = gsap.timeline({
          onComplete: () => {
            routeIndexRef.current = (routeIndexRef.current + 1) % ROUTES.length;
            timeoutId = window.setTimeout(runCycle, 1400);
          },
        });

        tl.to(path, { strokeDashoffset: length * 0.55, duration: 1.6, ease: 'power1.inOut' })
          .to(dispatcherMark, { scale: 1.25, duration: 0.2, ease: 'power1.out', transformOrigin: 'center' }, '-=0.1')
          .to(dispatcherMark, { scale: 1, duration: 0.3, ease: 'power1.in' })
          .to({}, { duration: 0.3 })
          .to(path, { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut' })
          .to(riderRing, { opacity: 1, scale: 1.9, duration: 0.6, ease: 'power1.out' }, '-=0.1')
          .to(riderRing, { opacity: 0, duration: 0.5, ease: 'power1.in' }, '-=0.1')
          .to(path, { opacity: 0, duration: 0.4 }, '-=0.2');
      };

      runCycle();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 430 300"
      className="h-full w-full"
      role="img"
      aria-label="Animated diagram of a delivery moving from a retailer to a dispatcher to a rider"
    >
      <g stroke="var(--color-border)" strokeWidth="1">
        {GRID_LINES_X.map((x) => (
          <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="300" />
        ))}
        {GRID_LINES_Y.map((y) => (
          <line key={`y-${y}`} x1="0" y1={y} x2="430" y2={y} />
        ))}
      </g>

      <path
        data-route-path
        d="M70,60 L220,120 L360,210"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 7"
        opacity="0"
      />

      <g data-marker="retailer" transform="translate(70,60)">
        <rect x="-6" y="-6" width="12" height="12" rx="2" fill="var(--color-primary)" />
      </g>

      <g data-marker="dispatcher" transform="translate(220,120)">
        <rect x="-6" y="-6" width="12" height="12" fill="var(--color-accent)" transform="rotate(45)" />
      </g>

      <g data-marker="rider" transform="translate(360,210)">
        <circle r="6" fill="var(--color-ink)" />
      </g>
      <circle
        data-rider-ring
        r="6"
        transform="translate(360,210)"
        fill="none"
        stroke="var(--color-success)"
        strokeWidth="2.5"
        opacity="0"
      />
    </svg>
  );
}
