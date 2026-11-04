"use client";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadSource, LeadStatus } from "@/generated/prisma/enums";
import { inboxFilterCount, NO_INBOX_FILTERS, UNASSIGNED, type CreatedWithin, type InboxFilters } from "@/lib/leads/inbox-filter";
import { SOURCE_LABEL, STATUS_LABEL } from "@/lib/leads/labels";
import { toggleItem } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };
type Props = {
  filters: InboxFilters;
  onChange: (filters: InboxFilters) => void;
  showrooms: { id: string; name: string }[];
  consultants: { id: string; name: string }[];
};

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value: value as LeadStatus, label }));
const SOURCE_OPTIONS = Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value: value as LeadSource, label }));
const CREATED_OPTIONS: Option<CreatedWithin | "any">[] = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

function MenuTrigger({ label, count }: { label: string; count: number }) {
  return (
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        {label}
        {count > 0 && <span className="rounded-full bg-foreground px-1.5 text-xs text-background">{count}</span>}
        <ChevronDownIcon />
      </Button>
    </DropdownMenuTrigger>
  );
}

function MultiSelect<T extends string>({ label, options, selected, onChange }: {
  label: string;
  options: Option<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}) {
  return (
    <DropdownMenu>
      <MenuTrigger label={label} count={selected.length} />
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => onChange(toggleItem(selected, option.value))}
            // Keeps the menu open so several options can be ticked in one go.
            onSelect={(event) => event.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InboxFilterBar({ filters, onChange, showrooms, consultants }: Props) {
  const consultantOptions: Option<string>[] = [
    { value: UNASSIGNED, label: "Needs assignment" },
    ...consultants.map((consultant) => ({ value: consultant.id, label: consultant.name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect label="Status" options={STATUS_OPTIONS} selected={filters.statuses} onChange={(statuses) => onChange({ ...filters, statuses })} />
      <MultiSelect label="Source" options={SOURCE_OPTIONS} selected={filters.sources} onChange={(sources) => onChange({ ...filters, sources })} />
      <MultiSelect
        label="Showroom"
        options={showrooms.map((showroom) => ({ value: showroom.id, label: showroom.name }))}
        selected={filters.showroomIds}
        onChange={(showroomIds) => onChange({ ...filters, showroomIds })}
      />
      {consultants.length > 0 && (
        <MultiSelect label="Consultant" options={consultantOptions} selected={filters.consultantIds} onChange={(consultantIds) => onChange({ ...filters, consultantIds })} />
      )}
      <DropdownMenu>
        <MenuTrigger label="Created" count={Number(filters.created !== null)} />
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={filters.created ?? "any"}
            onValueChange={(value) => onChange({ ...filters, created: value === "any" ? null : (value as CreatedWithin) })}
          >
            {CREATED_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {inboxFilterCount(filters) > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange(NO_INBOX_FILTERS)}>
          Clear all
        </Button>
      )}
    </div>
  );
}
