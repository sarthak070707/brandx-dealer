export const brandLinkStyle =
  "-my-2.5 inline-block rounded-lg py-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

// The wordmark only. Each place that shows it wraps it in the right kind of link: the public
// site's keeps the visitor's language, the staff screens' goes to the site's front door.
export function BrandMark() {
  return <span className="text-[0.9375rem] font-semibold tracking-[0.22em]">BRAND X</span>;
}
