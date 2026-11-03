import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { NAV_LINKS, SIGN_IN_HREF, TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const MENU_LINKS = [...NAV_LINKS, { href: SIGN_IN_HREF, label: "Sign in" }];

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="flex flex-col gap-8">
        <SheetTitle className="text-sm text-muted-foreground">Menu</SheetTitle>
        <nav aria-label="Main">
          <ul className="flex flex-col border-t">
            {MENU_LINKS.map((link) => (
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
        <SheetClose asChild>
          <Button asChild size="lg">
            <Link href={TEST_DRIVE_HREF}>Book a test drive</Link>
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
