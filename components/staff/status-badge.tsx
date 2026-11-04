import type { LeadStatus } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/leads/labels";

const VARIANT = {
  NEW: "solid",
  CONTACTED: "outline",
  TEST_DRIVE_BOOKED: "outline",
  NEGOTIATION: "outline",
  WON: "success",
  LOST: "neutral",
} as const satisfies Record<LeadStatus, string>;

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
