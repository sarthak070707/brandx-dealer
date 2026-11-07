export type EmiInput = { loanPaise: number; annualRatePercent: number; months: number };
export type EmiResult = { emiPaise: number; totalPayablePaise: number; totalInterestPaise: number };

const toRupee = (paise: number) => Math.round(paise / 100) * 100;

// The standard monthly instalment for a loan: EMI = P x r x (1+r)^n / ((1+r)^n - 1), with r the monthly
// rate. The totals come from the exact instalment and are rounded once, so they don't drift from the
// real figure. An estimate only: the lender's own rate, fees and rounding decide the real one.
export function emiBreakdown({ loanPaise, annualRatePercent, months }: EmiInput): EmiResult {
  if (loanPaise <= 0 || months <= 0) return { emiPaise: 0, totalPayablePaise: 0, totalInterestPaise: 0 };

  const monthlyRate = annualRatePercent / 1200;
  const exactEmi =
    monthlyRate === 0 ? loanPaise / months : (loanPaise * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  const totalPayablePaise = toRupee(exactEmi * months);

  return { emiPaise: toRupee(exactEmi), totalPayablePaise, totalInterestPaise: totalPayablePaise - loanPaise };
}

// What is left to borrow after a down payment, in whole rupees.
export const loanAfterDownPayment = (pricePaise: number, downPaymentPercent: number) =>
  toRupee((pricePaise * (100 - downPaymentPercent)) / 100);
