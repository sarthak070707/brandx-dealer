import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffShell, StaffShellSkeleton } from "@/components/staff/staff-shell";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Lead inbox | Brand X staff", template: "%s | Brand X staff" },
  robots: { index: false },
};

export default function ConsultantLayout({ children }: LayoutProps<"/consultant">) {
  return (
    <>
      <Suspense fallback={<StaffShellSkeleton />}>
        <StaffShell>{children}</StaffShell>
      </Suspense>
      <Toaster />
    </>
  );
}
