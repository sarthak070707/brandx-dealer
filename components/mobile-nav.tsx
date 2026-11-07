import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitch } from "@/components/language-switch";
import { NAV_LINKS, SIGN_IN_HREF, TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

export function MobileNav() {
  const t = useTranslations("Nav");
  const links = [...NAV_LINKS.map((link) => ({ href: link.href, label: t(link.key) })), { href: SIGN_IN_HREF, label: t("signIn") }];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("openMenu")} className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="flex flex-col gap-8">
        <SheetTitle className="text-sm text-muted-foreground">{t("menu")}</SheetTitle>
        <nav aria-label={t("main")}>
          <ul className="flex flex-col border-t">
            {links.map((link) => (
              <li key={link.href} className="border-b">
                <SheetClose asChild>
                  <Link href={link.href} className="block py-4 text-lg">
                    {link.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSwitch className="self-start" />
        <SheetClose asChild>
          <Button asChild size="lg">
            <Link href={TEST_DRIVE_HREF}>{t("bookTestDrive")}</Link>
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
