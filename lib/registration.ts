export const normaliseRegistration = (text: string) => text.toUpperCase().replace(/[\s-]+/g, "");

// State, two-digit RTO, one to three series letters, four digits: UP32MN2741.
export const REGISTRATION = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
