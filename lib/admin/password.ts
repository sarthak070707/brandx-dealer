import { randomInt } from "node:crypto";

// No 0/O, 1/l/I: a temporary password is read aloud or typed from a message.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 12;

export function generateTemporaryPassword(pick: (max: number) => number = randomInt) {
  return Array.from({ length: LENGTH }, () => ALPHABET[pick(ALPHABET.length)]).join("");
}
