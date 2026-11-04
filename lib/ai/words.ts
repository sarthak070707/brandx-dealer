// Spec: replies stay under 80 words. Kept free of imports so the browser can count too.
export const MAX_DRAFT_WORDS = 80;

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
