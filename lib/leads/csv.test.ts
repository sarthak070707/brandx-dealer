import { describe, expect, it } from "vitest";
import { LEAD_CSV_TEMPLATE, parseCsv, readLeadRecords } from "./csv";

describe("parseCsv", () => {
  it("reads plain rows, with either kind of line ending", () => {
    expect(parseCsv("a,b\n1,2\r\n3,4\r5,6")).toEqual([["a", "b"], ["1", "2"], ["3", "4"], ["5", "6"]]);
  });

  it("keeps commas, doubled quotes and line breaks inside a quoted field", () => {
    expect(parseCsv('name,note\n"Rao, Asha","said ""hello""\nthen left"')).toEqual([["name", "note"], ["Rao, Asha", 'said "hello"\nthen left']]);
  });

  it("ignores a byte-order mark and blank lines, and keeps empty fields", () => {
    expect(parseCsv("\uFEFFa,b,c\n\n1,,3\n,,\n")).toEqual([["a", "b", "c"], ["1", "", "3"]]);
  });

  it("handles a last line with no line break", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("")).toEqual([]);
  });
});

describe("readLeadRecords", () => {
  it("finds columns by the names portals use, in any order and case", () => {
    const result = readLeadRecords(parseCsv("Mobile Number,CUSTOMER NAME,Model,Remarks\n9876543210,Asha,Model H,Call after 5"));
    expect(result).toEqual({
      ok: true,
      records: [{ line: 2, name: "Asha", phone: "9876543210", car: "Model H", city: "", message: "Call after 5", received: "", showroom: "" }],
    });
  });

  it("numbers each lead by its line in the file, so a problem can be pointed at", () => {
    const result = readLeadRecords(parseCsv("name,phone\nA,1\nB,2\nC,3"));
    expect(result.ok && result.records.map((record) => record.line)).toEqual([2, 3, 4]);
  });

  it("refuses a file without a name and a phone column, and says what it needs", () => {
    expect(readLeadRecords(parseCsv("car,city\nModel H,Lucknow"))).toMatchObject({ ok: false, error: expect.stringContaining('"name" column and a "phone" column') });
    expect(readLeadRecords([])).toMatchObject({ ok: false });
  });

  it("reads the template we hand out", () => {
    const result = readLeadRecords(parseCsv(LEAD_CSV_TEMPLATE));
    expect(result.ok && result.records).toHaveLength(1);
  });
});
