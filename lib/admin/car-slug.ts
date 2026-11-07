// "Model Z" becomes "model-z", the address of its page.
export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
}

// Variant codes follow the existing pattern: NEW-H-01 for the first variant of Model H.
export function variantCode(slug: string, position: number) {
  return `NEW-${slug.replace(/^model-/, "").toUpperCase()}-${String(position).padStart(2, "0")}`;
}
