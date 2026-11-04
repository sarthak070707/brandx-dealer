"use client";

import { MenuIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function StaffMobileMenu({ children }: { children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="flex flex-col p-0">
        <SheetTitle className="sr-only">Staff menu</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
