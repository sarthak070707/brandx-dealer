"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeLeadStatus, reassignLead, type ActionResult } from "@/app/consultant/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { LeadStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/leads/labels";
import { nextStatuses } from "@/lib/leads/status";

type Props = {
  leadId: string;
  status: LeadStatus;
  assignedToId: string | null;
  isAdmin: boolean;
  consultants: { id: string; label: string }[];
};

const sectionStyle = "flex flex-col gap-4 rounded-2xl border bg-card p-5";

export function LeadActions({ leadId, status, assignedToId, isAdmin, consultants }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState<LeadStatus | "">("");
  const [lostReason, setLostReason] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [reason, setReason] = useState("");

  const choices = nextStatuses(status);
  const others = consultants.filter((consultant) => consultant.id !== assignedToId);

  const run = (action: () => Promise<ActionResult>, onDone: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) onDone();
      else toast.error(result.error);
    });

  const updateStatus = (to: LeadStatus) =>
    run(
      () => changeLeadStatus({ leadId, to, lostReason }),
      () => {
        toast.success(`Status changed to ${STATUS_LABEL[to]}`);
        setNextStatus("");
        setLostReason("");
      },
    );

  const reassign = () =>
    run(
      () => reassignLead({ leadId, toUserId, reason }),
      () => {
        toast.success("Lead re-assigned");
        setToUserId("");
        setReason("");
        // A consultant can't open the lead once it's someone else's, so they go back to the inbox.
        if (!isAdmin) router.push("/consultant");
      },
    );

  return (
    <div className="flex flex-col gap-4">
      {choices.length > 0 && (
        <form
          className={sectionStyle}
          onSubmit={(event) => {
            event.preventDefault();
            if (nextStatus) updateStatus(nextStatus);
          }}
        >
          <h2 className="text-lg">Change status</h2>
          <Field label="Move to">
            <NativeSelect value={nextStatus} onChange={(event) => setNextStatus(event.target.value as LeadStatus | "")} required>
              <option value="">Choose a status</option>
              {choices.map((choice) => (
                <option key={choice} value={choice}>
                  {STATUS_LABEL[choice]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {nextStatus === "LOST" && (
            <Field label="Why was it lost?">
              <Textarea value={lostReason} onChange={(event) => setLostReason(event.target.value)} maxLength={300} required />
            </Field>
          )}
          <Button type="submit" disabled={pending || !nextStatus}>
            Update status
          </Button>
        </form>
      )}

      <form
        className={sectionStyle}
        onSubmit={(event) => {
          event.preventDefault();
          reassign();
        }}
      >
        <h2 className="text-lg">{assignedToId ? "Re-assign" : "Assign"}</h2>
        <Field label="Consultant">
          <NativeSelect value={toUserId} onChange={(event) => setToUserId(event.target.value)} required>
            <option value="">Choose a consultant</option>
            {others.map((consultant) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Reason">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required />
        </Field>
        <Button type="submit" variant="outline" disabled={pending || !toUserId}>
          {assignedToId ? "Re-assign lead" : "Assign lead"}
        </Button>
      </form>
    </div>
  );
}
