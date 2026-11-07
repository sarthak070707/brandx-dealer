import type { PriceFact } from "@/lib/ai/types";
import type { VariantQuote } from "@/lib/pricing/quote";

// Every price the reply may quote for a car: the admin tables' own figures and nothing else. The
// guard strips any other rupee amount from a draft, so a mix of packs not listed here can't be
// quoted by the AI; the consultant gives that one by hand.
export function variantPriceFacts(quote: VariantQuote, cityName: string): PriceFact[] {
  const facts: PriceFact[] = [];
  if (quote.withoutAccessories.available) {
    facts.push({ label: `on-road price in ${cityName}, without accessories`, paise: quote.withoutAccessories.totalPaise });
  }
  for (const pack of quote.packs) {
    facts.push({ label: `price of the ${pack.name} accessories pack`, paise: pack.paise });
    if (pack.quote.available) facts.push({ label: `on-road price in ${cityName}, with the ${pack.name}`, paise: pack.quote.totalPaise });
  }
  if (quote.withAllPacks?.available) {
    facts.push({ label: `on-road price in ${cityName}, with all ${quote.packs.length} accessories packs`, paise: quote.withAllPacks.totalPaise });
  }
  return facts;
}
