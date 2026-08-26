import { useEffect, useState } from 'react';

/** Re-renders on an interval so "4 min ago" style labels stay fresh without polling data. */
export function useTick(intervalMs = 15000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
