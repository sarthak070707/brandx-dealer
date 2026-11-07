import { describe, expect, it } from "vitest";
import { detectImageType, photoIdFrom, photoUrlFor } from "./car-photos";

const bytes = (...values: number[]) => Uint8Array.from([...values, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0));

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectImageType(Uint8Array.from([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP"), 0]))).toBe("image/webp");
  });

  it("refuses a RIFF file that is not WebP, such as a WAV sound", () => {
    expect(detectImageType(Uint8Array.from([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE"), 0]))).toBeNull();
  });

  it("refuses SVG, GIF, HTML, empty files and anything else", () => {
    expect(detectImageType(Uint8Array.from(ascii("<svg xmlns='http://www.w3.org/2000/svg'></svg>")))).toBeNull();
    expect(detectImageType(Uint8Array.from(ascii("GIF89a....")))).toBeNull();
    expect(detectImageType(Uint8Array.from(ascii("<html><script>")))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe("photo addresses", () => {
  it("builds an address and reads the id back from it", () => {
    const id = "cmw5abcdefghijklmnopqrstu";
    expect(photoUrlFor(id)).toBe("/api/car-photos/cmw5abcdefghijklmnopqrstu");
    expect(photoIdFrom(photoUrlFor(id))).toBe(id);
  });

  it("only accepts addresses of our own stored photos", () => {
    for (const url of ["/cars/model-h-1.webp", "https://evil.example/x.png", "/api/car-photos/../secret", "/api/car-photos/SHORT", "/api/car-photos/abc/def"]) {
      expect(photoIdFrom(url), url).toBeNull();
    }
  });
});
