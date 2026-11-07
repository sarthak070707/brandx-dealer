import { useTranslations } from "next-intl";
import { BrandMark, brandLinkStyle } from "@/components/brand-mark";
import { LanguageSwitch } from "@/components/language-switch";
import { MobileNav } from "@/components/mobile-nav";
import { NAV_LINKS, SIGN_IN_HREF, TEST_DRIVE_HREF } from "@/components/site-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const linkStyle =
  "rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const theme = useTranslations("Theme");

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex items-center gap-8 py-2 pr-2 pl-4 sm:px-8 md:py-3.5 lg:px-12">
        <Link href="/" className={brandLinkStyle}>
          <BrandMark />
        </Link>

        <nav aria-label={t("main")} className="hidden flex-1 md:block">
          <ul className="flex gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`${linkStyle} text-muted-foreground hover:text-foreground`}>
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-4">
          <LanguageSwitch className="hidden md:flex" />
          <ThemeToggle label={theme("switch")} />
          <Link href={SIGN_IN_HREF} className={`${linkStyle} hidden md:inline`}>
            {t("signIn")}
          </Link>
          <Button asChild className="hidden md:inline-flex">
            <Link href={TEST_DRIVE_HREF}>{t("bookTestDrive")}</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
