import { describe, expect, it } from "vitest";
import { showroomNameFor } from "./server-content";

describe("showroomNameFor", () => {
  it("names the showroom in Devanagari for a Hindi buyer and leaves English as is", () => {
    expect(showroomNameFor("HI", "Gomti Nagar")).toBe("गोमती नगर");
    expect(showroomNameFor("EN", "Gomti Nagar")).toBe("Gomti Nagar");
  });

  it("keeps the name as entered when a showroom has no Hindi name", () => {
    expect(showroomNameFor("HI", "Aliganj")).toBe("Aliganj");
  });
});
