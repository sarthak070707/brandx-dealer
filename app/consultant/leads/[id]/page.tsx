import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AiAssistPanel } from "@/components/staff/ai-assist-panel";
import { LeadActions } from "@/components/staff/lead-actions";
import { LeadTimeline } from "@/components/staff/lead-timeline";
import { LiveResponseTimer } from "@/components/staff/live-response-timer";
import { StatusBadge } from "@/components/staff/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth/staff";
import { formatSlot } from "@/lib/dates";
import { SOURCE_LABEL } from "@/lib/leads/labels";
import { getAssignableConsultants, getLeadDetail } from "@/lib/leads/queries";

export const metadata: Metadata = { title: "Lead" };

// The AI call can take a few seconds (its own limit is 8), so give the action room.
export const maxDuration = 30;

const LANGUAGE_LABEL = { EN: "English", HI: "हिन्दी" } as const;
const CHANNEL_LABEL = { WHATSAPP: "WhatsApp", SMS: "SMS" } as const;
const cardStyle = "flex flex-col gap-4 rounded-2xl border bg-card p-5";

function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function LoadedLead({ params }: { params: PageProps<"/consultant/leads/[id]">["params"] }) {
  const staff = await requireStaff();
  const [lead, consultants] = await Promise.all([getLeadDetail(staff, (await params).id), getAssignableConsultants()]);
  if (!lead) notFound();

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-light tracking-tight font-stretch-semi-condensed">{lead.buyerName}</h1>
          <StatusBadge status={lead.status} />
          <LiveResponseTimer status={lead.status} createdAt={lead.createdAt} firstContactAt={lead.firstContactAt} renderedAt={lead.renderedAt} />
          {!lead.assignedTo && <Badge variant="warning">Needs assignment</Badge>}
        </div>
        <p className="text-muted-foreground">
          {SOURCE_LABEL[lead.source]} about the {lead.carLabel}, received {formatSlot(lead.createdAt)}.{" "}
          {lead.assignedTo ? `Assigned to ${lead.assignedTo.name}.` : "Waiting at the lead desk."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="buyer-title" className={cardStyle}>
            <h2 id="buyer-title" className="text-lg">Buyer</h2>
            <Facts
              items={[
                { label: "Phone", value: <a href={`tel:${lead.buyerPhone}`} className="underline underline-offset-4">{lead.buyerPhone}</a> },
                { label: "Email", value: lead.buyerEmail ?? "Not given" },
                { label: "Language", value: LANGUAGE_LABEL[lead.language] },
                { label: "City", value: lead.city.name },
                { label: "Showroom", value: lead.showroom.name },
                { label: "Consent given", value: formatSlot(lead.consentAt) },
                { label: "Messages", value: lead.optedOutAt ? `Opted out, ${formatSlot(lead.optedOutAt)}` : "Allowed" },
              ]}
            />
          </section>

          <section aria-labelledby="interest-title" className={cardStyle}>
            <h2 id="interest-title" className="text-lg">What they want</h2>
            <Facts
              items={[
                { label: "Car", value: lead.carLabel },
                {
                  label: "Test drive",
                  value: lead.booking
                    ? `${formatSlot(lead.booking.slotStart)}${lead.booking.status === "CANCELLED" ? " (cancelled)" : ""}`
                    : "None booked",
                },
              ]}
            />
            <div>
              <p className="text-sm text-muted-foreground">Their message</p>
              <p>{lead.message ?? "No message."}</p>
            </div>
          </section>

          <AiAssistPanel key={lead.aiDraft?.id ?? "none"} leadId={lead.id} initial={lead.aiDraft} buyerOptedOut={lead.optedOutAt !== null} />

          {lead.acknowledgement && (
            <section aria-labelledby="ack-title" className={cardStyle}>
              <h2 id="ack-title" className="text-lg">Acknowledgement sent (simulated)</h2>
              <p className="rounded-xl bg-muted p-4">{lead.acknowledgement.body}</p>
              <p className="text-sm text-muted-foreground">
                {CHANNEL_LABEL[lead.acknowledgement.channel]}, {formatSlot(lead.acknowledgement.createdAt)}. No real message was sent.
              </p>
            </section>
          )}

          <section aria-labelledby="history-title" className={cardStyle}>
            <h2 id="history-title" className="text-lg">History</h2>
            <LeadTimeline items={lead.timeline} />
          </section>
        </div>

        <LeadActions
          leadId={lead.id}
          status={lead.status}
          assignedToId={lead.assignedTo?.id ?? null}
          isAdmin={staff.role === "ADMIN"}
          consultants={consultants}
        />
      </div>
    </>
  );
}

export default function LeadPage({ params }: PageProps<"/consultant/leads/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/consultant" className="underline-offset-4 hover:underline">
          Lead inbox
        </Link>
      </nav>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LoadedLead params={params} />
      </Suspense>
    </div>
  );
}
