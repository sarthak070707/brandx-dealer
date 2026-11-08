import type { Language } from "@/generated/prisma/enums";

// An English reply has no Devanagari in it, and a Hindi reply is mostly Devanagari. The shares leave room for
// what each can fairly contain: a Hindi reply names "Brand X" and the car in Latin letters.
const MOST_DEVANAGARI_IN_ENGLISH = 0.05;
const LEAST_DEVANAGARI_IN_HINDI = 0.3;

const isLetter = /\p{L}/u;
const isDevanagari = /\p{Script=Devanagari}/u;

// The share of the letters that are Devanagari. The {{placeholders}} are our own and are ignored.
export function devanagariShare(text: string) {
  const letters = [...text.replace(/\{\{[^}]*\}\}/g, "")].filter((character) => isLetter.test(character));
  if (letters.length === 0) return 0;
  return letters.filter((character) => isDevanagari.test(character)).length / letters.length;
}

// What is wrong with a draft's language, said so the model can fix it, or null when it is in the right one.
export function languageProblem(draft: string, language: Language) {
  const share = devanagariShare(draft);
  if (language === "EN" && share > MOST_DEVANAGARI_IN_ENGLISH) return "it was not in English: write the reply in English only, with no Hindi words and no Devanagari letters";
  if (language === "HI" && share < LEAST_DEVANAGARI_IN_HINDI) return "it was not in Hindi: write the reply in Hindi, in Devanagari script";
  return null;
}
