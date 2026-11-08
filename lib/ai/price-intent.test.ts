import { describe, expect, it } from "vitest";
import { asksAboutPrice } from "./price-intent";

describe("asksAboutPrice", () => {
  it("recognises a question about cost, in English", () => {
    for (const message of ["What is the on-road price of the ZX?", "how much for the GX automatic", "Please send a quotation", "Total cost in Kanpur?", "ex-showroom rate?", "Can I get a loan? What EMI?", "down payment needed?"]) {
      expect(asksAboutPrice(message), message).toBe(true);
    }
  });

  it("recognises a question about cost, in Hindi and in Hindi typed in English letters", () => {
    for (const message of ["ऑन-रोड प्राइस कितना होगा?", "इसकी कीमत क्या है", "कितने का पड़ेगा", "लोन और EMI कितनी बनेगी", "डाउन पेमेंट कितना", "gaadi ki kimat kitna hai", "kitne ka hai Model H"]) {
      expect(asksAboutPrice(message), message).toBe(true);
    }
  });

  it("says no to the message that started this: seats, gearbox and delivery, with no mention of money", () => {
    for (const message of ["7 सीटर ऑटोमैटिक चाहिए, कानपुर में डिलीवरी हो जाएगी?", "Is the Model H available in white?", "Can I test drive on Saturday?", "Do you have a 7-seater automatic? Delivery to Kanpur?", "मुझे सफ़ेद रंग चाहिए"]) {
      expect(asksAboutPrice(message), message).toBe(false);
    }
  });

  it("says no when there is no message", () => {
    expect(asksAboutPrice(null)).toBe(false);
    expect(asksAboutPrice("")).toBe(false);
  });
});
