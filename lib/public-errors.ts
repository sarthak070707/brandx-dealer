// What a public form can be told went wrong. These are keys, not sentences: each page shows
// the matching text from its own language's messages (Errors.<key>).
export type PublicError =
  | "name"
  | "phone"
  | "consent"
  | "messageTooLong"
  | "yourCar"
  | "tradeYear"
  | "tradeKm"
  | "tradeOwners"
  | "tradeCondition"
  | "tradePrice"
  | "showroom"
  | "checkFields"
  | "demoCarUnavailable"
  | "slotUnavailable"
  | "slotTaken"
  | "rateLimited"
  | "carNotFound"
  | "carSold"
  | "linkInvalid"
  | "credentialsMissing"
  | "credentialsWrong";
