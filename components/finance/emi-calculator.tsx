"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { emiBreakdown, loanAfterDownPayment } from "@/lib/finance/emi";
import { formatRupees } from "@/lib/money";

const TENURES = [36, 48, 60, 72, 84];
const rangeStyle = "w-full cursor-pointer accent-foreground";

// An estimate of the monthly instalment for a price, with the down payment, rate and period the buyer
// chooses. The starting values are typical, not an offer from any lender.
export function EmiCalculator({ pricePaise }: { pricePaise: number }) {
  const t = useTranslations("Emi");
  const ids = { down: useId(), rate: useId(), tenure: useId() };
  const [downPercent, setDownPercent] = useState(20);
  const [rate, setRate] = useState(9.5);
  const [months, setMonths] = useState(60);

  const loanPaise = loanAfterDownPayment(pricePaise, downPercent);
  const result = emiBreakdown({ loanPaise, annualRatePercent: rate, months });

  return (
    <section aria-labelledby="emi-title" className="rounded-2xl border bg-card p-5">
      <h2 id="emi-title" className="text-xl">
        {t("title")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("lead")}</p>

      <div className="mt-5 grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.down} className="flex justify-between gap-3 text-sm text-muted-foreground">
              {t("downPayment")}
              <span className="text-foreground tabular-nums">
                {downPercent}% · {formatRupees(pricePaise - loanPaise)}
              </span>
            </label>
            <input id={ids.down} type="range" min={0} max={80} step={5} value={downPercent} onChange={(event) => setDownPercent(Number(event.target.value))} className={rangeStyle} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.rate} className="flex justify-between gap-3 text-sm text-muted-foreground">
              {t("rate")}
              <span className="text-foreground tabular-nums">{rate.toFixed(1)}%</span>
            </label>
            <input id={ids.rate} type="range" min={6} max={18} step={0.5} value={rate} onChange={(event) => setRate(Number(event.target.value))} className={rangeStyle} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.tenure} className="text-sm text-muted-foreground">
              {t("tenure")}
            </label>
            <NativeSelect id={ids.tenure} value={months} onChange={(event) => setMonths(Number(event.target.value))}>
              {TENURES.map((option) => (
                <option key={option} value={option}>
                  {t("months", { count: option })}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <dl className="flex flex-col gap-3" aria-live="polite">
          <div>
            <dt className="text-sm text-muted-foreground">{t("monthly")}</dt>
            <dd className="text-4xl font-light tracking-tight tabular-nums">
              {formatRupees(result.emiPaise)} <span className="text-base text-muted-foreground">{t("perMonth")}</span>
            </dd>
          </div>
          <div className="divide-y border-y">
            {[
              [t("loanAmount"), loanPaise],
              [t("interest"), result.totalInterestPaise],
              [t("payable"), result.totalPayablePaise],
            ].map(([label, paise]) => (
              <div key={label} className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{formatRupees(Number(paise))}</dd>
              </div>
            ))}
          </div>
        </dl>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}
