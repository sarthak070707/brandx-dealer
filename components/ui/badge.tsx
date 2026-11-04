import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", {
  variants: {
    variant: {
      neutral: "bg-muted text-foreground",
      solid: "bg-foreground text-background",
      outline: "border text-foreground",
      success: "bg-status-on-time/15 text-status-on-time",
      warning: "bg-status-due/15 text-status-due",
      danger: "bg-status-overdue/15 text-status-overdue",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
