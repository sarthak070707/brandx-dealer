import type { Language } from "@/generated/prisma/enums";
import type { DraftNames } from "@/lib/ai/types";
import { showroomNameFor } from "@/lib/i18n/server-content";

// Plain replies with no prices, used when the AI is down, unsure or blocked by the guard.
const TEMPLATES = {
  EN: {
    standard:
      "Hi {{name}}, thank you for your interest in Brand X. {{consultant}} from Brand X {{showroom}} will call you shortly to help with your questions. Is there a time today that suits you?",
    clarifying:
      "Hi {{name}}, thank you for reaching out to Brand X. To help you best, could you tell us which model you like, your rough budget, and when you would like to visit or take a test drive? {{consultant}}, Brand X {{showroom}}",
  },
  HI: {
    standard:
      "नमस्ते {{name}}, Brand X में रुचि दिखाने के लिए धन्यवाद। Brand X {{showroom}} से {{consultant}} जल्द ही आपको कॉल करेंगे। आपके लिए आज कौन सा समय ठीक रहेगा?",
    clarifying:
      "नमस्ते {{name}}, Brand X से संपर्क करने के लिए धन्यवाद। आपकी सही मदद के लिए बताइए: आपको कौन सा मॉडल पसंद है, आपका अनुमानित बजट क्या है, और आप कब आना या टेस्ट ड्राइव लेना चाहेंगे? {{consultant}}, Brand X {{showroom}}",
  },
} as const satisfies Record<Language, Record<string, string>>;

export type TemplateKind = keyof (typeof TEMPLATES)["EN"];

export const templateReply = (language: Language, kind: TemplateKind) => TEMPLATES[language][kind];

const TEAM_NAME = { EN: "our team", HI: "हमारी टीम" } as const satisfies Record<Language, string>;

// Swaps the placeholders for real values, and drops any the model invented.
export function fillPlaceholders(text: string, names: DraftNames, language: Language) {
  const values: Record<string, string> = {
    name: names.name,
    consultant: names.consultant ?? TEAM_NAME[language],
    showroom: showroomNameFor(language, names.showroom),
  };
  return text.replace(/\s*\{\{\s*(\w+)\s*\}\}/g, (placeholder, key: string) => {
    const value = values[key];
    return value === undefined ? "" : `${placeholder.startsWith(" ") ? " " : ""}${value}`;
  });
}
