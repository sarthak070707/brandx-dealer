"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deletePrice, savePrice } from "@/app/admin/prices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Option, PriceRowView } from "@/lib/admin/price-queries";
import { PRICE_TABLES, type ColumnKind, type PriceTableId } from "@/lib/admin/price-tables";
import type { Resolution } from "@/lib/admin/validity";
import { cn } from "@/lib/utils";

type KeyOptions = Record<string, Option[]>;
type Props = { table: PriceTableId; rows: PriceRowView[]; keyOptions: KeyOptions };

const STATUS_BADGE = {
  current: { variant: "success", label: "Current" },
  upcoming: { variant: "warning", label: "Upcoming" },
  expired: { variant: "neutral", label: "Expired" },
} as const;

const INPUT_WIDTH: Record<ColumnKind, string> = { money: "w-32", percent: "w-20", date: "w-40", text: "w-44" };
const INPUT_MODE: Partial<Record<ColumnKind, "numeric" | "decimal">> = { money: "numeric", percent: "decimal" };

const labelOf = (options: KeyOptions, name: string, value: string | undefined) =>
  options[name]?.find((option) => option.value === value)?.label ?? "";

type RowProps = { table: PriceTableId; keyOptions: KeyOptions; initial: { id: string | null; keys: Record<string, string>; values: Record<string, string>; status: PriceRowView["status"] | null }; onDone: () => void };

function EditableRow({ table, keyOptions, initial, onDone }: RowProps) {
  const config = PRICE_TABLES[table];
  const [keys, setKeys] = useState(initial.keys);
  const [values, setValues] = useState(initial.values);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{ kind: Resolution; label: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const isNew = initial.id === null;
  const dirty = isNew || config.columns.some((column) => values[column.name] !== initial.values[column.name]);
  const label = isNew ? "new row" : config.keys.map((key) => labelOf(keyOptions, key.name, keys[key.name])).join(", ");
  const status = initial.status && STATUS_BADGE[initial.status];

  const save = (settle?: Resolution) =>
    startTransition(async () => {
      const result = await savePrice(table, { id: initial.id, ...keys, ...values }, settle);
      if (result.ok) {
        toast.success(isNew ? "Row added. The car pages update within seconds." : "Saved. The car pages update within seconds.");
        onDone();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        setMessage(result.error);
        setResolution(result.resolution ?? null);
      }
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deletePrice(table, initial.id ?? "");
      setConfirming(false);
      if (result.ok) toast.success("Row deleted. The car pages update within seconds.");
      else toast.error(result.error);
    });

  return (
    <>
      <TableRow>
        {config.keys.map((key) => (
          <TableCell key={key.name} className="font-medium">
            {isNew ? (
              <NativeSelect
                className="h-9 min-w-44 text-sm"
                aria-label={key.header}
                aria-invalid={Boolean(fieldErrors[key.name])}
                value={keys[key.name] ?? ""}
                onChange={(event) => setKeys({ ...keys, [key.name]: event.target.value })}
              >
                <option value="">Choose…</option>
                {keyOptions[key.name]?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              labelOf(keyOptions, key.name, keys[key.name])
            )}
          </TableCell>
        ))}
        {config.columns.map((column) => (
          <TableCell key={column.name}>
            <Input
              className={cn("h-9 text-sm", INPUT_WIDTH[column.kind])}
              type={column.kind === "date" ? "date" : "text"}
              inputMode={INPUT_MODE[column.kind]}
              aria-label={`${column.header}, ${label}`}
              aria-invalid={Boolean(fieldErrors[column.name])}
              value={values[column.name] ?? ""}
              onChange={(event) => setValues({ ...values, [column.name]: event.target.value })}
            />
          </TableCell>
        ))}
        <TableCell>{status ? <Badge variant={status.variant}>{status.label}</Badge> : <Badge variant="outline">New</Badge>}</TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" disabled={!dirty || pending} onClick={() => save()}>
              {pending ? "Saving…" : "Save"}
            </Button>
            {isNew ? (
              <Button size="sm" variant="ghost" onClick={onDone}>
                Cancel
              </Button>
            ) : (
              <Button size="icon" variant="ghost" aria-label={`Delete ${label}`} onClick={() => setConfirming(true)}>
                <Trash2Icon />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {message && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={config.keys.length + config.columns.length + 2} className="pt-0 pb-3">
            <p role="alert" className="text-sm text-destructive">
              {message}
              {Object.entries(fieldErrors).map(([name, error]) => {
                const header = [...config.keys, ...config.columns].find((field) => field.name === name)?.header ?? name;
                return <span key={name} className="block">{header}: {error}</span>;
              })}
            </p>
            {resolution && (
              <Button size="sm" variant="outline" className="mt-2" disabled={pending} onClick={() => save(resolution.kind)}>
                {resolution.label}
              </Button>
            )}
          </TableCell>
        </TableRow>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this row?</DialogTitle>
            <DialogDescription>
              {label}. Car pages that rely on it will show no on-road price until another row covers the same days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Keep it</Button>
            </DialogClose>
            <Button variant="outline" className="border-destructive text-destructive" onClick={remove} disabled={pending}>
              {pending ? "Deleting…" : "Delete row"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PriceTable({ table, rows, keyOptions }: Props) {
  const config = PRICE_TABLES[table];
  const [drafts, setDrafts] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const rowLabel = (row: PriceRowView) => config.keys.map((key) => labelOf(keyOptions, key.name, row.keys[key.name])).join(" ");
  const shown = rows.filter((row) => rowLabel(row).toLowerCase().includes(query.trim().toLowerCase()));
  const dropDraft = (id: string) => setDrafts((current) => current.filter((draft) => draft !== id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input className="max-w-xs" type="search" aria-label="Search rows" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button variant="outline" onClick={() => setDrafts((current) => [crypto.randomUUID(), ...current])}>
          <PlusIcon />
          Add row
        </Button>
      </div>

      <div className="max-h-[calc(100vh-20rem)] overflow-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {config.keys.map((key) => (
                <TableHead key={key.name}>{key.header}</TableHead>
              ))}
              {config.columns.map((column) => (
                <TableHead key={column.name}>{column.header}</TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((id) => (
              <EditableRow
                key={id}
                table={table}
                keyOptions={keyOptions}
                initial={{ id: null, keys: {}, values: {}, status: null }}
                onDone={() => dropDraft(id)}
              />
            ))}
            {/* Keyed by its saved values, so a row resets to what the server now holds after a save. */}
            {shown.map((row) => (
              <EditableRow
                key={`${row.id}:${JSON.stringify(row.values)}`}
                table={table}
                keyOptions={keyOptions}
                initial={{ id: row.id, keys: row.keys, values: row.values, status: row.status }}
                onDone={() => undefined}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {shown.length === 0 ? "No rows match." : `${shown.length} of ${rows.length} rows`}
      </p>
    </div>
  );
}
