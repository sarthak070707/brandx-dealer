// The deterministic check after the AI (spec): no discounts or offers, and no rupee amount
// that isn't exactly one of the admin prices. Offending sentences are removed, not edited.

export type Removal = { kind: "discount" | "amount"; text: string; reason: string };
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

function violation(sentence: string, allowedPaise: readonly number[]): Omit<Removal, "text"> | null {
  if (DISCOUNT_WORDS.some((pattern) => pattern.test(sentence))) {
    return { kind: "discount", reason: "it mentions a discount or an offer" };
  }
  const stray = findAmounts(sentence).find((amount) => !allowedPaise.includes(amount.paise));
  if (stray) return { kind: "amount", reason: `it quotes ${stray.raw}, which is not a price from the admin tables` };
  return null;
}

const SENTENCE_BREAK = /(?<=[.!?।])\s+|\n+/;

export function guardDraft(draft: string, allowedPaise: readonly number[]): GuardResult {
  const kept: string[] = [];
  const removed: Removal[] = [];
  for (const sentence of draft.split(SENTENCE_BREAK).filter(Boolean)) {
    const found = violation(sentence, allowedPaise);
    if (found) removed.push({ ...found, text: sentence.trim() });
    else kept.push(sentence.trim());
  }
  // Untouched drafts keep their original line breaks.
  return { text: removed.length === 0 ? draft.trim() : kept.join(" "), removed };
}
