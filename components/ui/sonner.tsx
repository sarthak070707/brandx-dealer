"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";

// Colours come from the design tokens, so toasts follow the light and dark themes.
const TOAST_COLOURS = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
} as CSSProperties;

export function Toaster() {
  return <Sonner position="bottom-right" style={TOAST_COLOURS} />;
}
