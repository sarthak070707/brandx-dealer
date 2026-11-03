import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { MobileNav } from "@/components/mobile-nav";
import { NAV_LINKS, SIGN_IN_HREF, TEST_DRIVE_HREF } from "@/components/site-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const linkStyle =
  "rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-8 py-2 pr-2 pl-4 sm:px-8 md:py-3.5">
        <BrandMark />

        <nav aria-label="Main" className="hidden flex-1 md:block">
          <ul className="flex gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`${linkStyle} text-muted-foreground hover:text-foreground`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-4">
          <ThemeToggle />
          <Link href={SIGN_IN_HREF} className={`${linkStyle} hidden md:inline`}>
            Sign in
          </Link>
          <Button asChild className="hidden md:inline-flex">
            <Link href={TEST_DRIVE_HREF}>Book a test drive</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
