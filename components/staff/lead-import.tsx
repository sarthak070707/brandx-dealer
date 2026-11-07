"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { checkLeadFile, importLeadFile } from "@/app/consultant/import/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Option } from "@/lib/admin/price-queries";
import { LEAD_CSV_TEMPLATE } from "@/lib/leads/csv";
import type { ImportPreview, ImportResult } from "@/lib/leads/import-service";

type Props = { isAdmin: boolean; showrooms: Option[] };

const sectionStyle = "flex flex-col gap-4 rounded-2xl border bg-card p-6";
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(LEAD_CSV_TEMPLATE)}`;

export function LeadImport({ isAdmin, showrooms }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [showroomId, setShowroomId] = useState(showrooms[0]?.value ?? "");
  const [attested, setAttested] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setCsvText(await file.text());
    setPreview(null);
    setDone(null);
    setProblem(null);
  };

  const check = () =>
    startTransition(async () => {
      const result = await checkLeadFile(csvText, showroomId);
      setProblem(result.ok ? null : result.error);
      setPreview(result.ok ? result : null);
    });

  const run = () =>
    startTransition(async () => {
      const result = await importLeadFile(csvText, showroomId, attested);
      if (result.ok) {
        setDone(result);
        setPreview(null);
        setCsvText("");
        setFileName(null);
      } else setProblem(result.error);
    });

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <section className={sectionStyle} aria-labelledby="import-file">
        <h2 id="import-file" className="text-xl">
          1. Choose the file
        </h2>
        <p className="text-muted-foreground">
          A CSV file with a first row of column names. It needs <strong className="text-foreground">name</strong> and{" "}
          <strong className="text-foreground">phone</strong>. It can also have car, city, message, received (a date like 07-11-2026) and showroom. Portal
          exports are usually fine as they are.{" "}
          <a href={TEMPLATE_HREF} download="brandx-lead-template.csv" className="text-foreground underline underline-offset-4">
            Download a template
          </a>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <label className="cursor-pointer">
              {fileName ? "Choose a different file" : "Choose a CSV file"}
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </label>
          </Button>
          {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
        </div>
        {isAdmin ? (
          <label className="flex max-w-xs flex-col gap-2">
            <span className="text-sm text-muted-foreground">Showroom for rows that don&apos;t name one</span>
            <NativeSelect value={showroomId} onChange={(event) => setShowroomId(event.target.value)}>
              {showrooms.map((showroom) => (
                <option key={showroom.value} value={showroom.value}>
                  {showroom.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">The leads are added to your own inbox, at your showroom.</p>
        )}
        <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
          <input type="checkbox" className="mt-1 size-4 shrink-0 accent-foreground" checked={attested} onChange={(event) => setAttested(event.target.checked)} />
          <span className="text-sm">I confirm that these buyers asked on a portal and agreed there to be contacted. No automatic message is sent to them.</span>
        </label>
        <Button type="button" className="self-start" disabled={!csvText || pending} onClick={check}>
          {pending && !preview ? "Checking…" : "Check the file"}
        </Button>
      </section>

      {problem && (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      )}

      {preview && (
        <section className={sectionStyle} aria-labelledby="import-check">
          <h2 id="import-check" className="text-xl">
            2. Check, then import
          </h2>
          <p>
            <strong>{preview.summary.ready}</strong> ready to import, <strong>{preview.summary.duplicate}</strong> already there or repeated,{" "}
            <strong>{preview.summary.invalid}</strong> with a problem.
            {preview.total > preview.rows.length && ` Showing the first ${preview.rows.length} of ${preview.total} rows.`}
          </p>
          <div className="max-h-96 overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Line</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="max-md:hidden">Car</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="tabular-nums">{row.line}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="tabular-nums">{row.phone}</TableCell>
                    <TableCell className="max-md:hidden">{row.car}</TableCell>
                    <TableCell>
                      {row.status === "ready" ? (
                        <Badge variant="success">Ready</Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant={row.status === "duplicate" ? "neutral" : "warning"} className="self-start">
                            {row.status === "duplicate" ? "Skipped" : "Problem"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{row.problem}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" className="self-start" disabled={preview.summary.ready === 0 || !attested || pending} onClick={run}>
            {pending ? "Importing…" : `Import ${preview.summary.ready} ${preview.summary.ready === 1 ? "lead" : "leads"}`}
          </Button>
          {!attested && preview.summary.ready > 0 && <p className="text-sm text-muted-foreground">Tick the confirmation above to import.</p>}
        </section>
      )}

      {done && (
        <section role="status" className={sectionStyle}>
          <h2 className="text-xl">
            Imported {done.imported} {done.imported === 1 ? "lead" : "leads"}
          </h2>
          <p className="text-muted-foreground">
            {done.summary.duplicate + done.summary.invalid > 0 ? `${done.summary.duplicate + done.summary.invalid} rows were skipped. ` : ""}
            Each lead is in the inbox, marked as a portal import, with the date the buyer asked.
          </p>
          <Button asChild className="self-start">
            <Link href="/consultant">Go to the lead inbox</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
