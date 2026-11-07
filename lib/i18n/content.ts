export type Translator = ((key: string) => string) & { has: (key: string) => boolean };

// Colour names, model descriptions, inspection areas and the like come from the database in
// English. Their Hindi lives in the message files under a key made from the English value.
export const contentKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Anything with no Hindi yet, such as a colour an admin has just added, shows as entered.
export function localised(t: Translator, group: string, id: string, fallback: string, field?: string) {
  const key = [group, contentKey(id), field].filter(Boolean).join(".");
  return t.has(key) ? t(key) : fallback;
}

// Public forms get error keys from the server (see PublicError); this turns one into text.
export const errorText = (t: Translator, key: string) => (t.has(key) ? t(key) : key);
