import type { CurrentStaff } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads/create-lead";
import { parseCsv, readLeadRecords } from "@/lib/leads/csv";
import { checkRows, markExistingDuplicates, MAX_IMPORT_ROWS, summarise, type RowOutcome } from "@/lib/leads/import-rows";

const MAX_FILE_CHARS = 1_000_000;
const MAX_PREVIEW_ROWS = 200;

type Failure = { ok: false; error: string };
export type ImportPreview = { ok: true; rows: RowOutcome[]; total: number; summary: ReturnType<typeof summarise> };
export type ImportResult = { ok: true; imported: number; summary: ReturnType<typeof summarise> };

// Reads and checks the file the same way for the preview and for the real import, and always from
// the file's text and the staff member's own role; nothing the browser says about rows is trusted.
async function loadOutcomes(staff: CurrentStaff, csvText: string, showroomId: string): Promise<{ ok: true; outcomes: RowOutcome[] } | Failure> {
  if (csvText.length > MAX_FILE_CHARS) return { ok: false, error: "The file is too large. Keep it under 1 MB." };
  const read = readLeadRecords(parseCsv(csvText));
  if (!read.ok) return read;
  if (read.records.length === 0) return { ok: false, error: "The file has no leads in it." };
  if (read.records.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `The file has ${read.records.length} leads. Import at most ${MAX_IMPORT_ROWS} at a time.` };
  }

  const isConsultant = staff.role === "CONSULTANT";
  const [models, cities, showrooms, own] = await Promise.all([
    db.model.findMany({ select: { id: true, name: true } }),
    db.city.findMany({ select: { id: true, name: true } }),
    db.showroom.findMany({ select: { id: true, name: true, cityId: true } }),
    isConsultant ? db.user.findUnique({ where: { id: staff.id }, select: { showroomId: true } }) : null,
  ]);
  // A consultant imports into their own showroom only; an admin chooses one for rows that name none.
  const defaultShowroomId = isConsultant ? (own?.showroomId ?? null) : showroomId || null;
  if (isConsultant && !defaultShowroomId) return { ok: false, error: "You aren't set up at a showroom yet, so you can't import leads." };

  const outcomes = checkRows(read.records, { models, cities, showrooms, defaultShowroomId, lockedToDefault: isConsultant, now: new Date() });
  const phones = outcomes.flatMap((outcome) => (outcome.lead ? [outcome.lead.buyerPhone] : []));
  const existing = await db.lead.findMany({ where: { buyerPhone: { in: phones } }, select: { buyerPhone: true, modelId: true, createdAt: true } });
  return { ok: true, outcomes: markExistingDuplicates(outcomes, existing) };
}

export async function previewLeadImport(staff: CurrentStaff, csvText: string, showroomId: string): Promise<ImportPreview | Failure> {
  const loaded = await loadOutcomes(staff, csvText, showroomId);
  if (!loaded.ok) return loaded;
  return { ok: true, rows: loaded.outcomes.slice(0, MAX_PREVIEW_ROWS), total: loaded.outcomes.length, summary: summarise(loaded.outcomes) };
}

// All the leads are added together or none is. A consultant's imports go to themselves; an admin's are
// handed out by the usual rules (their showroom and car). No automatic message is sent to anyone: they
// asked on a portal, and a person follows up.
export async function commitLeadImport(staff: CurrentStaff, csvText: string, showroomId: string, attested: boolean): Promise<ImportResult | Failure> {
  if (!attested) return { ok: false, error: "Please confirm that these buyers agreed to be contacted." };
  const loaded = await loadOutcomes(staff, csvText, showroomId);
  if (!loaded.ok) return loaded;

  const leads = loaded.outcomes.flatMap((outcome) => (outcome.lead ? [outcome.lead] : []));
  if (leads.length === 0) return { ok: false, error: "Nothing to import: every row has a problem or is a duplicate." };

  const note = `Imported from a CSV file by ${staff.name}. The buyer asked on a portal and agreed there to be contacted.`;
  await db.$transaction(
    async (tx) => {
      for (const lead of leads) {
        await createLead(tx, {
          source: "PORTAL",
          buyerName: lead.buyerName,
          buyerPhone: lead.buyerPhone,
          language: "EN",
          message: lead.message,
          modelId: lead.modelId,
          cityId: lead.cityId,
          showroomId: lead.showroomId,
          carLabel: "",
          assignToId: staff.role === "CONSULTANT" ? staff.id : undefined,
          sendAcknowledgement: false,
          createdAt: lead.createdAt,
          note,
        });
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
  return { ok: true, imported: leads.length, summary: summarise(loaded.outcomes) };
}
