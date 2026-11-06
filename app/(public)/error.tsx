"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <main className="flex flex-col items-start gap-6 px-4 py-16 sm:px-8 lg:px-12 lg:pb-section">
      <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">Something went wrong</h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        This page didn&apos;t load. Nothing you entered has been sent, and trying again usually fixes it.
      </p>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
