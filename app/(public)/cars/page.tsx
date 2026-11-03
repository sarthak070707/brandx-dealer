import type { Metadata } from "next";
import { ModelCard } from "@/components/model-card";
import { getCityNames, getModelLineup } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "New Brand X cars with on-road prices | Brand X Lucknow",
  description: "Every Brand X model, with the exact on-road price for your city before you visit.",
};

export default async function NewCarsPage() {
  const [lineup, cities] = await Promise.all([getModelLineup(), getCityNames()]);
  const byPrice = lineup.toSorted((a, b) => (a.fromPaise ?? Infinity) - (b.fromPaise ?? Infinity));

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">New cars</h1>
        <p className="text-lg text-muted-foreground">
          {lineup.length} models, lowest price first. On-road prices for {new Intl.ListFormat("en-IN").format(cities)}.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {byPrice.map((model) => (
          <li key={model.slug}>
            <ModelCard model={model} />
          </li>
        ))}
      </ul>
    </main>
  );
}
