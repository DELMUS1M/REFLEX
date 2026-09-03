import { useEffect, useRef } from 'react';

/**
 * The landing page's one signature visual: a faint city grid with three
 * markers — retailer (square), dispatcher (diamond), rider (circle) — and a
 * dashed line that draws itself from one to the next, pausing at each
 * marker, then flashes green on "delivery" before a new cycle starts
 * elsewhere on the grid. It's a literal render of the product's own status
 * flow, not decorative art, so the marker shapes match what a retailer or
 * dispatcher would recognize from the app itself.
 *
 * GSAP loads on demand, same pattern as the hero reveal in HomePage — this
 * is a nice-to-have animation, not core content.
 */

const GRID_LINES_X = [40, 110, 180, 250, 320, 390];
const GRID_LINES_Y = [30, 90, 150, 210, 270];

// Two alternating routes so the cycle doesn't look identical every time.
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
      // No animation, but still show one complete route so the diagram
      // reads correctly rather than leaving the line invisible.
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
          .to({}, { duration: 0.3 }) // dwell at dispatcher
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
      {/* City grid */}
      <g stroke="var(--ref-route-line-dim)" strokeWidth="1" opacity="0.7">
        {GRID_LINES_X.map((x) => (
          <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="300" />
        ))}
        {GRID_LINES_Y.map((y) => (
          <line key={`y-${y}`} x1="0" y1={y} x2="430" y2={y} />
        ))}
      </g>

      {/* Active route line */}
      <path
        data-route-path
        d="M70,60 L220,120 L360,210"
        fill="none"
        stroke="var(--ref-tracking-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
        opacity="0"
      />

      {/* Retailer marker: square */}
      <g data-marker="retailer" transform="translate(70,60)">
        <rect x="-6" y="-6" width="12" height="12" rx="2" fill="var(--ref-tracking-blue)" />
      </g>

      {/* Dispatcher marker: diamond */}
      <g data-marker="dispatcher" transform="translate(220,120)">
        <rect x="-6" y="-6" width="12" height="12" fill="var(--ref-delivery-orange)" transform="rotate(45)" />
      </g>

      {/* Rider marker: circle, with a completion ring that flashes green */}
      <g data-marker="rider" transform="translate(360,210)">
        <circle r="6" fill="var(--ref-cloud-white)" />
      </g>
      <circle
        data-rider-ring
        r="6"
        transform="translate(360,210)"
        fill="none"
        stroke="var(--ref-signal-green)"
        strokeWidth="2"
        opacity="0"
      />
    </svg>
  );
}