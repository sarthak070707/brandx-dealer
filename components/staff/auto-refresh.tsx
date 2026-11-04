"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_EVERY_MS = 30_000;

// New enquiries show up on their own, so the inbox never needs a manual reload.
export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_EVERY_MS);
    return () => clearInterval(refresh);
  }, [router]);

  return null;
}
