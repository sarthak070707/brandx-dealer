"use client";

import { useEffect, useState } from "react";

// Starts from the server's clock reading, so timers are right on first paint, then ticks
// once a second while any timer is still running.
export function useNow(initial: number, active: boolean) {
  const [now, setNow] = useState(initial);

  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, [active]);

  return new Date(now);
}
