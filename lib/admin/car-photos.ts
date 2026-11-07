// Photos for new cars: what is accepted, and how a stored photo is addressed.
export const MAX_PHOTO_BYTES = 900_000;
export const PHOTO_PATH = "/api/car-photos/";
export type PhotoType = "image/jpeg" | "image/png" | "image/webp";

const PHOTO_URL = /^\/api\/car-photos\/([a-z0-9]{20,32})$/;

const startsWith = (bytes: Uint8Array, expected: number[], offset = 0) => expected.every((byte, index) => bytes[offset + index] === byte);

// The type comes from the file's own first bytes, never from its name or what the browser says,
// so only a real JPEG, PNG or WebP is ever stored. SVG, which can carry scripts, is not accepted.
export function detectImageType(bytes: Uint8Array): PhotoType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

export const photoUrlFor = (id: string) => `${PHOTO_PATH}${id}`;
export const photoIdFrom = (url: string) => PHOTO_URL.exec(url)?.[1] ?? null;
