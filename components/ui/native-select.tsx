import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// A native select keeps the phone's own picker, which is what buyers expect on mobile.
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn("h-11 w-full rounded-lg border bg-background px-3 focus-visible:outline-2 focus-visible:outline-ring", className)}
      {...props}
    />
  );
}
