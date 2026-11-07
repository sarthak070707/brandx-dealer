import { describe, expect, it } from "vitest";
import { emiBreakdown, loanAfterDownPayment } from "./emi";

const rupees = (amount: number) => amount * 100;

describe("emiBreakdown", () => {
  it("matches the standard instalment for known loans", () => {
    expect(emiBreakdown({ loanPaise: rupees(10_00_000), annualRatePercent: 10, months: 60 })).toEqual({
      emiPaise: rupees(21_247),
      totalPayablePaise: rupees(12_74_823),
      totalInterestPaise: rupees(2_74_823),
    });
    expect(emiBreakdown({ loanPaise: rupees(5_00_000), annualRatePercent: 9, months: 36 }).emiPaise).toBe(rupees(15_900));
    expect(emiBreakdown({ loanPaise: rupees(12_00_000), annualRatePercent: 9.5, months: 60 }).emiPaise).toBe(rupees(25_202));
    expect(emiBreakdown({ loanPaise: rupees(1_00_00_000), annualRatePercent: 12, months: 84 }).emiPaise).toBe(rupees(1_76_527));
  });

  it("charges no interest at a 0% rate, and splits the loan evenly", () => {
    const result = emiBreakdown({ loanPaise: rupees(8_00_000), annualRatePercent: 0, months: 48 });
    expect(result.emiPaise).toBe(rupees(16_667));
    expect(result.totalPayablePaise).toBe(rupees(8_00_000));
    expect(result.totalInterestPaise).toBe(0);
  });

  it("rises with the rate and falls with a longer loan period", () => {
    const loanPaise = rupees(10_00_000);
    const at = (annualRatePercent: number, months: number) => emiBreakdown({ loanPaise, annualRatePercent, months }).emiPaise;
    expect(at(12, 60)).toBeGreaterThan(at(9, 60));
    expect(at(10, 36)).toBeGreaterThan(at(10, 60));
    expect(at(10, 84)).toBeLessThan(at(10, 60));
  });

  it("always repays at least the loan, and more interest for a longer loan", () => {
    for (const months of [36, 48, 60, 72, 84]) {
      const result = emiBreakdown({ loanPaise: rupees(9_00_000), annualRatePercent: 9.5, months });
      expect(result.totalPayablePaise).toBeGreaterThan(rupees(9_00_000));
      expect(result.totalInterestPaise).toBe(result.totalPayablePaise - rupees(9_00_000));
    }
    const interest = (months: number) => emiBreakdown({ loanPaise: rupees(9_00_000), annualRatePercent: 9.5, months }).totalInterestPaise;
    expect(interest(84)).toBeGreaterThan(interest(36));
  });

  it("gives nothing for no loan or no period, rather than dividing by zero", () => {
    expect(emiBreakdown({ loanPaise: 0, annualRatePercent: 9, months: 60 })).toEqual({ emiPaise: 0, totalPayablePaise: 0, totalInterestPaise: 0 });
    expect(emiBreakdown({ loanPaise: rupees(5_00_000), annualRatePercent: 9, months: 0 }).emiPaise).toBe(0);
  });
});

describe("loanAfterDownPayment", () => {
  it("leaves the price less the down payment, in whole rupees", () => {
    expect(loanAfterDownPayment(rupees(14_21_500), 20)).toBe(rupees(11_37_200));
    expect(loanAfterDownPayment(rupees(10_00_000), 0)).toBe(rupees(10_00_000));
    expect(loanAfterDownPayment(rupees(10_00_001), 33)).toBe(rupees(6_70_001));
  });
});
