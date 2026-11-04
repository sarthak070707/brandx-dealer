import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SidebarContent } from "@/components/staff/sidebar-content";
import { StaffMobileMenu } from "@/components/staff/staff-mobile-menu";
import { requireStaff } from "@/lib/auth/staff";

// Sidebar on desktop, a top bar with a menu on phones. Signing in is checked here and again
// by every page and query, so no staff screen ever depends on this layout alone.
export async function StaffShell({ children }: { children: ReactNode }) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block">
        <SidebarContent staff={staff} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
          <BrandMark />
          <StaffMobileMenu>
            <SidebarContent staff={staff} />
          </StaffMobileMenu>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

export function StaffShellSkeleton() {
  return (
    <div aria-hidden="true" className="flex min-h-screen animate-pulse">
      <div className="hidden w-60 shrink-0 border-r bg-card lg:block" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="h-9 w-48 rounded bg-muted" />
        <div className="mt-6 h-96 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
