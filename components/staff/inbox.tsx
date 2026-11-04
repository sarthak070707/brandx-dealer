"use client";

import Link from "next/link";
import { useState } from "react";
import { AutoRefresh } from "@/components/staff/auto-refresh";
import { InboxFilterBar } from "@/components/staff/inbox-filter-bar";
import { ResponseTimerBadge } from "@/components/staff/response-timer";
import { StatusBadge } from "@/components/staff/status-badge";
import { useNow } from "@/components/staff/use-now";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { matchesInboxFilters, NO_INBOX_FILTERS, sortInbox, type InboxLead } from "@/lib/leads/inbox-filter";
import { SOURCE_LABEL } from "@/lib/leads/labels";
import { formatAgo } from "@/lib/leads/timer";

type Props = {
  leads: InboxLead[];
  showrooms: { id: string; name: string }[];
  consultants: { id: string; name: string }[];
  renderedAt: number;
};

export function Inbox({ leads, showrooms, consultants, renderedAt }: Props) {
  const [filters, setFilters] = useState(NO_INBOX_FILTERS);
  const now = useNow(renderedAt, leads.some((lead) => lead.status === "NEW" && lead.firstContactAt === null));
  const shown = sortInbox(leads.filter((lead) => matchesInboxFilters(lead, filters, now)));

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh />
      <InboxFilterBar filters={filters} onChange={setFilters} showrooms={showrooms} consultants={consultants} />

      {leads.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8">
          <p className="text-lg">No leads yet.</p>
          <p className="text-muted-foreground">New enquiries and test-drive bookings appear here within seconds.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-8">
          <p className="text-lg">No leads match these filters.</p>
          <Button variant="outline" onClick={() => setFilters(NO_INBOX_FILTERS)}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-13rem)] overflow-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Timer</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="max-lg:hidden">Car</TableHead>
                <TableHead className="max-lg:hidden">Source</TableHead>
                <TableHead className="max-lg:hidden">Showroom</TableHead>
                <TableHead className="max-md:hidden">Consultant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="max-md:hidden">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <ResponseTimerBadge lead={lead} now={now} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {/* The link stretches over the whole row, so any click opens the lead. */}
                    <Link href={`/consultant/leads/${lead.id}`} className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring">
                      {lead.buyerName}
                    </Link>
                    <span className="block text-sm font-normal text-muted-foreground lg:hidden">{lead.carLabel}</span>
                  </TableCell>
                  <TableCell className="max-lg:hidden">{lead.carLabel}</TableCell>
                  <TableCell className="max-lg:hidden">{SOURCE_LABEL[lead.source]}</TableCell>
                  <TableCell className="max-lg:hidden">{lead.showroomName}</TableCell>
                  <TableCell className="max-md:hidden">{lead.consultantName ?? <Badge variant="warning">Needs assignment</Badge>}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden" title={formatDate(lead.createdAt)}>
                    {formatAgo(now.getTime() - lead.createdAt.getTime())}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {shown.length} of {leads.length} {leads.length === 1 ? "lead" : "leads"}
      </p>
    </div>
  );
}
