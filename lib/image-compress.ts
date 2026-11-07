import { MAX_PHOTO_BYTES } from "@/lib/admin/car-photos";

const MAX_EDGE = 1600;
// WebP is smaller; some browsers can only write JPEG, so it is the fallback.
const ATTEMPTS = [
  ["image/webp", 0.82],
  ["image/webp", 0.65],
  ["image/jpeg", 0.8],
  ["image/jpeg", 0.6],
] as const;

// Shrinks a photo in the browser before it is sent. A phone photo is several MB; a car page
// needs a fraction of that, and the server only accepts what fits.
export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That file isn't a photo we can read.");
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const [type, quality] of ATTEMPTS) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (blob?.type === type && blob.size <= MAX_PHOTO_BYTES) return blob;
  }
  throw new Error("This photo is still too large after shrinking. Try a smaller one.");
}
