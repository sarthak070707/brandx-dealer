import type { Language } from "@/generated/prisma/enums";

type AcknowledgementInput = {
  language: Language;
  buyerName: string;
  carLabel: string;
  showroomName: string;
  consultantName: string | null;
  optOutUrl?: string;
};

// Every message carries a way to stop them (DPDP). The link is last, so nothing follows it.
export const optOutNotice = (language: Language, url: string) =>
  language === "HI" ? `हमारे संदेश बंद करने के लिए यह लिंक खोलें: ${url}` : `To stop messages from us, open ${url}`;

// Mocked WhatsApp/SMS text written to the outbox when a lead is created.
export function acknowledgement({ language, buyerName, carLabel, showroomName, consultantName, optOutUrl }: AcknowledgementInput) {
  const notice = optOutUrl ? ` ${optOutNotice(language, optOutUrl)}` : "";
  if (language === "HI") {
    const who = consultantName ?? "हमारी टीम";
    return `नमस्ते ${buyerName}, ${carLabel} में रुचि के लिए धन्यवाद। Brand X ${showroomName} से ${who} जल्द ही आपको कॉल करेंगे।${notice}`;
  }
  const who = consultantName ?? "Our team";
  return `Hi ${buyerName}, thanks for your interest in the ${carLabel}. ${who} at Brand X ${showroomName} will call you shortly.${notice}`;
}
