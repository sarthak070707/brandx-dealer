// A small reader for CSV files as spreadsheets and portals write them (RFC 4180): a field may be quoted,
// a quote inside it is doubled, and a quoted field may hold commas and line breaks.
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character !== '"') field += character;
      else if (source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = false;
    } else if (character === '"' && field === "") quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field !== "" || row.length > 0) rows.push([...row, field]);

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

// Names portals commonly use for each column, so a file can be imported as it came.
const COLUMN_NAMES = {
  name: ["name", "buyer", "buyer name", "customer", "customer name", "full name"],
  phone: ["phone", "mobile", "mobile number", "phone number", "contact", "contact number"],
  car: ["car", "model", "car model", "vehicle", "interested in"],
  city: ["city", "location"],
  message: ["message", "notes", "remarks", "comments", "enquiry"],
  received: ["received", "received on", "date", "lead date", "enquiry date", "created"],
  showroom: ["showroom", "branch", "dealer"],
} as const;

export type LeadColumn = keyof typeof COLUMN_NAMES;
export type LeadRecord = Record<LeadColumn, string> & { line: number };

const normalise = (header: string) => header.trim().toLowerCase().replace(/[_\s]+/g, " ");

export const LEAD_CSV_TEMPLATE = "name,phone,car,city,message,received\nAsha Verma,9876543210,Model H,Lucknow,Would like a test drive this weekend,07-11-2026\n";

// The first row names the columns; the rest are leads. The line number is where the lead is in the
// file, so a problem can be pointed at.
export function readLeadRecords(rows: string[][]): { ok: true; records: LeadRecord[] } | { ok: false; error: string } {
  const [header = [], ...body] = rows;
  const headers = header.map(normalise);
  const indexOf = (column: LeadColumn) => headers.findIndex((name) => (COLUMN_NAMES[column] as readonly string[]).includes(name));
  const positions = Object.fromEntries((Object.keys(COLUMN_NAMES) as LeadColumn[]).map((column) => [column, indexOf(column)])) as Record<LeadColumn, number>;

  if (positions.name < 0 || positions.phone < 0) {
    return { ok: false, error: 'The file needs a "name" column and a "phone" column. The first row should be the column names.' };
  }
  return {
    ok: true,
    records: body.map((cells, index) => ({
      line: index + 2,
      ...(Object.fromEntries((Object.keys(COLUMN_NAMES) as LeadColumn[]).map((column) => [column, (cells[positions[column]] ?? "").trim()])) as Record<LeadColumn, string>),
    })),
  };
}
