import type { AbstractIntlMessages } from "next-intl";

// Only what the browser-side components use, so pages don't ship the privacy text,
// the home page or the used-car detail wording to every visitor.
export const CLIENT_NAMESPACES = [
  "Nav", "Language", "Car", "Price", "Colour", "Variant", "Specs", "MobileBar", "Gallery",
  "UsedBrowser", "UsedFilters", "UsedCard", "Booking", "Scheduler", "Enquiry", "Forms", "Consent",
  "Emi", "TradeIn", "Stop", "SignIn", "Error", "Errors", "Labels", "Content",
] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  return Object.fromEntries(CLIENT_NAMESPACES.filter((name) => name in messages).map((name) => [name, messages[name]]));
}
