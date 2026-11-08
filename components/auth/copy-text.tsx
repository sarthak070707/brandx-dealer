"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// A value with a button that copies it. The wording comes in as props, from the server's translations.
export function CopyText({ value, copyLabel, copiedLabel }: { value: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copying can be refused (an old browser, or a page not on https); the value is on screen to select by hand.
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <code className="min-w-0 truncate rounded-md bg-muted px-2 py-1 font-mono text-sm">{value}</code>
      <Button type="button" variant="outline" size="sm" onClick={copy} aria-live="polite">
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}
