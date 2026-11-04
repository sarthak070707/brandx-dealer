"use client";

import { ResponseTimerBadge } from "@/components/staff/response-timer";
import { useNow } from "@/components/staff/use-now";

type Props = { status: Parameters<typeof ResponseTimerBadge>[0]["lead"]["status"]; createdAt: Date; firstContactAt: Date | null; renderedAt: number };

export function LiveResponseTimer({ status, createdAt, firstContactAt, renderedAt }: Props) {
  const now = useNow(renderedAt, status === "NEW" && firstContactAt === null);
  return <ResponseTimerBadge lead={{ status, createdAt, firstContactAt }} now={now} />;
}
