// WCAG contrast between two #rrggbb colours: 1 is no difference, 21 is black on white.
function luminance(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].toSorted((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}
