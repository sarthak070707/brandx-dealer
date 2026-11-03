"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    // Storage can be blocked (e.g. private browsing); the switch still works for this visit.
  }
}

export function ThemeToggle() {
  // Icons switch with CSS, not state, so the server and first client render match.
  return (
    <Button variant="ghost" size="icon" aria-label="Switch between light and dark theme" onClick={toggleTheme}>
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}
