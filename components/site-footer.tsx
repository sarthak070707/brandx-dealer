import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { NAV_LINKS, SIGN_IN_HREF, TEST_DRIVE_HREF } from "@/components/site-links";

const FOOTER_GROUPS = [
  { title: "Explore", links: [...NAV_LINKS, { href: TEST_DRIVE_HREF, label: "Book a test drive" }] },
  {
    title: "Your data",
    links: [
      { href: "/privacy", label: "Privacy and consent" },
      { href: "/stop-messages", label: "Stop messages" },
      { href: SIGN_IN_HREF, label: "Staff sign-in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/50">
      <div className="grid gap-10 px-4 py-16 sm:px-8 md:grid-cols-[2fr_1fr_1fr] lg:px-12">
        <div className="flex max-w-sm flex-col items-start gap-4">
          <BrandMark />
          <p className="text-muted-foreground">
            New and certified used Brand X cars across Lucknow, with the exact on-road price for your city.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-labelledby={`footer-${group.title}`}>
            <h2 id={`footer-${group.title}`} className="mb-4 text-sm text-muted-foreground">
              {group.title}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <p>Prices shown are ex-showroom unless marked on-road.</p>
        <p>Brand X is a fictional brand. Prices and stock are sample data.</p>
      </div>
    </footer>
  );
}
