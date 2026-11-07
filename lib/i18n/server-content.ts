import hi from "@/messages/hi.json";
import type { Language } from "@/generated/prisma/enums";
import { contentKey } from "@/lib/i18n/content";

const hindiShowrooms: Record<string, { name: string } | undefined> = hi.Content.showrooms;

// Messages to a buyer are written in their language, so the showroom is named in it too.
// A showroom with no Hindi name yet is named as entered.
export function showroomNameFor(language: Language, name: string) {
  return language === "HI" ? (hindiShowrooms[contentKey(name)]?.name ?? name) : name;
}
