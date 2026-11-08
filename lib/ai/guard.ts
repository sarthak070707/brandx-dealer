// The deterministic check after the AI (spec): no discounts or offers, no rupee amount that isn't
// exactly one of the admin prices, and no seat count the car's own data doesn't confirm. Offending
// sentences are removed, not edited.

export type Removal = { kind: "discount" | "amount" | "claim"; text: string; reason: string };
export type GuardResult = { text: string; removed: Removal[] };

const DISCOUNT_WORDS = [
  /discount/i,
  /\boffer/i,
  /\bdeals?\b/i,
  /cash\s?back/i,
  /\bschemes?\b/i,
  /\bwaive/i,
  /concession/i,
  /\bbonus/i,
  /%\s*off|percent(?:age)?\s+off/i,
  /\b(?:best|lowest|special)\s+price/i,
  /छूट|डिस्काउंट|ऑफर|ऑफ़र|कैशबैक|स्कीम|रियायत|बोनस/,
];

const NUMBER = /\d(?:[\d,]*\d)?(?:\.\d+)?/g;
const CURRENCY_BEFORE = /(?:₹|\brs\.?|\binr|रु\.?)\s*$/i;
const SCALE = /^\s*(lakhs?|lacs?|crores?|लाख|करोड़|करोड)|^(l|cr)(?![a-z])/i;
const CURRENCY_AFTER = /^\s*(?:rupees?|rs\b|inr\b|रुपये|रुपए|रुपया|\/-)/i;
const DISTANCE_AFTER = /^\s*(?:km|kms|kilomet)/i;
const MOBILE_NUMBER = /^[6-9]\d{9}$/;
const BARE_AMOUNT_MIN_DIGITS = 5;

const SCALE_MULTIPLIER: Record<string, number> = { l: 1e5, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, लाख: 1e5, cr: 1e7, crore: 1e7, crores: 1e7, करोड़: 1e7, करोड: 1e7 };

// "7-seater", "seven seats", "7‑सीटर", "सात सीटर": a seat count, in digits or words, next to the word for seats.
const SEAT_COUNTS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5, छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9,
};
const SEAT_CLAIM = new RegExp(`(?<![\\p{L}\\d])(\\d|${Object.keys(SEAT_COUNTS).join("|")})[\\s\\u2010-\\u2015-]*(?:seater|seats?(?![\\p{L}])|सीटर|सीटें|सीट)`, "giu");

function seatClaims(sentence: string) {
  return [...sentence.matchAll(SEAT_CLAIM)].map((match) => SEAT_COUNTS[match[1].toLowerCase()] ?? Number(match[1]));
}

type Amount = { raw: string; paise: number };

// Every rupee amount in the text: after ₹ or Rs, before "rupees", with lakh or crore, or any
// bare number of five digits or more (that isn't a distance or a mobile number).
export function findAmounts(text: string): Amount[] {
  const amounts: Amount[] = [];
  for (const match of text.matchAll(NUMBER)) {
    const token = match[0];
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + token.length);

    const scale = SCALE.exec(after);
    const afterScale = scale ? after.slice(scale[0].length) : after;
    const digits = token.replaceAll(",", "");
    const isBareAmount = digits.replace(".", "").length >= BARE_AMOUNT_MIN_DIGITS && !MOBILE_NUMBER.test(digits) && !DISTANCE_AFTER.test(after);
    if (!CURRENCY_BEFORE.test(before) && !CURRENCY_AFTER.test(afterScale) && !scale && !isBareAmount) continue;

    const multiplier = scale ? SCALE_MULTIPLIER[(scale[1] ?? scale[2]).toLowerCase()] : 1;
    const raw = scale ? `${token} ${scale[0].trim()}` : token;
    amounts.push({ raw, paise: Math.round(Number(digits) * multiplier * 100) });
  }
  return amounts;
}

function violation(sentence: string, allowedPaise: readonly number[], seats: number | null, priceNotAsked: boolean): Omit<Removal, "text"> | null {
  if (DISCOUNT_WORDS.some((pattern) => pattern.test(sentence))) {
    return { kind: "discount", reason: "it mentions a discount or an offer" };
  }
  const stray = findAmounts(sentence).find((amount) => !allowedPaise.includes(amount.paise));
  if (stray) {
    return { kind: "amount", reason: priceNotAsked ? `it quotes ${stray.raw}, but the buyer did not ask about price` : `it quotes ${stray.raw}, which is not a price from the admin tables` };
  }

  // A seat count is kept only when it matches the lead's variant. With no variant there is nothing to match.
  const claims = seatClaims(sentence);
  if (claims.length > 0 && (seats === null || !claims.includes(seats))) {
    return { kind: "claim", reason: seats === null ? "it states a seat count, which is not in the data" : `it states a seat count that is not the ${seats} seats in the data` };
  }
  return null;
}

const SENTENCE_BREAK = /(?<=[.!?।])\s+|\n+/;

export function guardDraft(
  draft: string,
  allowedPaise: readonly number[],
  specs: { seats: number } | null = null,
  options: { priceNotAsked?: boolean } = {},
): GuardResult {
  const kept: string[] = [];
  const removed: Removal[] = [];
  for (const sentence of draft.split(SENTENCE_BREAK).filter(Boolean)) {
    const found = violation(sentence, allowedPaise, specs?.seats ?? null, options.priceNotAsked ?? false);
    if (found) removed.push({ ...found, text: sentence.trim() });
    else kept.push(sentence.trim());
  }
  // Untouched drafts keep their original line breaks.
  return { text: removed.length === 0 ? draft.trim() : kept.join(" "), removed };
}
