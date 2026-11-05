import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffShell, StaffShellSkeleton } from "@/components/staff/staff-shell";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Admin | Brand X staff", template: "%s | Brand X staff" },
  robots: { index: false },
};

// The admin's sections. More join in the spec's order: models, used stock, prices, consultants.
const SECTIONS = [
  { href: "/admin/prices/ex-showroom", label: "Price tables", matchPrefix: "/admin/prices" },
  { href: "/admin/consultants", label: "Consultants" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <Suspense fallback={<StaffShellSkeleton />}>
        <StaffShell adminOnly>
          <div className="flex flex-col gap-6">
            <SegmentedNav label="Admin sections" items={SECTIONS} />
            {children}
          </div>
        </StaffShell>
      </Suspense>
      <Toaster />
    </>
  );
}
