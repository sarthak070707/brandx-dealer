import { useTranslations } from "next-intl";
import { BrandMark, brandLinkStyle } from "@/components/brand-mark";
import { LinkedInIcon } from "@/components/linkedin-icon";
import { NAV_LINKS, SIGN_IN_HREF, TEST_DRIVE_HREF } from "@/components/site-links";
import { Link } from "@/i18n/navigation";
import { BUILDER } from "@/lib/builder";

export function SiteFooter() {
  const nav = useTranslations("Nav");
  const t = useTranslations("Footer");

  const groups = [
    {
      id: "explore",
      title: t("explore"),
      links: [...NAV_LINKS.map((link) => ({ href: link.href, label: nav(link.key) })), { href: TEST_DRIVE_HREF, label: nav("bookTestDrive") }, { href: "/trade-in", label: t("tradeIn") }, { href: "/service", label: t("service") }],
    },
    {
      id: "data",
      title: t("yourData"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/stop-messages", label: t("stopMessages") },
        { href: SIGN_IN_HREF, label: t("staffSignIn") },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t bg-muted/50">
      <div className="grid gap-10 px-4 py-16 sm:px-8 md:grid-cols-[2fr_1fr_1fr] lg:px-12">
        <div className="flex max-w-sm flex-col items-start gap-4">
          <Link href="/" className={brandLinkStyle}>
            <BrandMark />
          </Link>
          <p className="text-muted-foreground">{t("tagline")}</p>
        </div>

        {groups.map((group) => (
          <nav key={group.id} aria-labelledby={`footer-${group.id}`}>
            <h2 id={`footer-${group.id}`} className="mb-4 text-sm text-muted-foreground">
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

      <div className="flex flex-wrap items-center gap-3 border-t px-4 py-4 text-sm sm:px-8 lg:px-12">
        <span className="text-muted-foreground">{t("builtBy")}</span>
        <a
          href={BUILDER.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("linkedinLabel", { name: BUILDER.name })}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <LinkedInIcon className="size-4" />
          {BUILDER.name}
        </a>
      </div>

      <div className="flex flex-col gap-2 border-t px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <p>{t("priceNote")}</p>
        <p>{t("fictionalNote")}</p>
      </div>
    </footer>
  );
}
