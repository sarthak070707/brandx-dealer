import type { Language } from "@/generated/prisma/enums";

type AcknowledgementInput = {
  language: Language;
  buyerName: string;
  carLabel: string;
  showroomName: string;
  consultantName: string | null;
};

// Mocked WhatsApp/SMS text written to the outbox when a lead is created.
export function acknowledgement({ language, buyerName, carLabel, showroomName, consultantName }: AcknowledgementInput) {
  if (language === "HI") {
    const who = consultantName ?? "हमारी टीम";
    return `नमस्ते ${buyerName}, ${carLabel} में रुचि के लिए धन्यवाद। Brand X ${showroomName} से ${who} जल्द ही आपको कॉल करेंगे।`;
  }
  const who = consultantName ?? "Our team";
  return `Hi ${buyerName}, thanks for your interest in the ${carLabel}. ${who} at Brand X ${showroomName} will call you shortly.`;
}
