"use client";

import { Button } from "@/components/ui/button";

export default function StaffError({ reset }: { reset: () => void }) {
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-2xl border bg-card p-8">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="text-muted-foreground">This page did not load. Nothing has been lost, and trying again usually fixes it.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
