import Link from "next/link";

export function BrandMark() {
  return (
    <Link
      href="/"
      className="rounded-lg text-[0.9375rem] font-semibold tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      BRAND X
    </Link>
  );
}
