import { LogOutIcon } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { StaffNav } from "@/components/staff/staff-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { CurrentStaff } from "@/lib/auth/staff";
import { signOutOfBrandX } from "@/lib/auth/actions";

const ROLE_LABEL = { CONSULTANT: "Sales consultant", ADMIN: "Admin", BUYER: "Buyer" } as const;

// Shared by the desktop sidebar and the phone menu: brand, links, then who is signed in.
export function SidebarContent({ staff }: { staff: CurrentStaff }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <BrandMark />
      </div>
      <div className="flex-1 px-3">
        <StaffNav isAdmin={staff.role === "ADMIN"} />
      </div>
      <div className="flex flex-col gap-3 border-t p-4">
        <div>
          <p className="font-medium">{staff.name}</p>
          <p className="text-sm text-muted-foreground">{ROLE_LABEL[staff.role]}</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={signOutOfBrandX} className="flex-1">
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <LogOutIcon />
              Sign out
            </Button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
