// Did the buyer ask about money? A price may be quoted only when they did: asking what it costs, the
// on-road price or the total, or about a loan, EMI or down payment. This is a plain word check, in
// English, Hindi and the Hindi people type in Latin letters. When it is unsure it says no, which only
// means the consultant adds the price themselves.
const PRICE_WORDS = [
  /\bprice/i,
  /\bcost/i,
  /\brates?\b/i,
  /\bquot(?:e|ation)/i,
  /\bhow\s+much\b/i,
  /\btotal\b/i,
  /\bon[-\s]?road\b/i,
  /\bex[-\s]?showroom\b/i,
  /\bemi\b/i,
  /\bloan\b/i,
  /\bfinanc/i,
  /\bdown\s?payment/i,
  /\bkitn[aei]\b/i,
  /\bkimat\b|\bqimat\b|\bdaam\b|\bdam\b/i,
  /कीमत|क़ीमत|प्राइस|दाम|रेट|मूल्य|कितना|कितने|कितनी|ऑन[-\s‑]?रोड|ऑनरोड|एक्स[-\s‑]?शोरूम|कुल\s+खर्च|लोन|ईएमआई|ई\.?एम\.?आई|फाइनेंस|फ़ाइनेंस|डाउन\s?पेमेंट|किस्त/,
];

export const asksAboutPrice = (message: string | null) => message !== null && PRICE_WORDS.some((pattern) => pattern.test(message));
