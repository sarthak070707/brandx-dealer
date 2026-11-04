import { Badge } from "@/components/ui/badge";
import { formatDuration, formatRunningTime, responseTimer, type TimerTone } from "@/lib/leads/timer";
import { cn } from "@/lib/utils";

type TimedLead = Parameters<typeof responseTimer>[0];

const TONE_VARIANT = { green: "success", amber: "warning", red: "danger" } as const satisfies Record<TimerTone, string>;

// The most visible thing in the inbox: a running timer is large and bold, a finished one is quiet.
export function ResponseTimerBadge({ lead, now }: { lead: TimedLead; now: Date }) {
  const timer = responseTimer(lead, now);
  if (timer.kind === "none") return <span className="text-muted-foreground">–</span>;

  const running = timer.kind === "running";
  return (
    <Badge variant={TONE_VARIANT[timer.tone]} className={cn("tabular-nums", running && "px-3 py-1 text-sm font-semibold")}>
      <span className="sr-only">{running ? "Waiting for first contact: " : "First contact took "}</span>
      {running ? formatRunningTime(timer.elapsedMs) : formatDuration(timer.elapsedMs)}
    </Badge>
  );
}
