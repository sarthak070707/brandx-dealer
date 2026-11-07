export const brandLinkStyle =
  "rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

// The wordmark only. Each place that shows it wraps it in the right kind of link: the public
// site's keeps the visitor's language, the staff screens' goes to the site's front door.
export function BrandMark() {
  return <span className="text-[0.9375rem] font-semibold tracking-[0.22em]">BRAND X</span>;
}
