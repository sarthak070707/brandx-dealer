import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const trackStyle =
  "flex shrink-0 gap-4 pr-4 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none";

export function Marquee({ children, reverse = false }: { children: ReactNode; reverse?: boolean }) {
  return (
    <div className="group flex overflow-hidden">
      <div className={cn(trackStyle, reverse && "[animation-direction:reverse]")}>{children}</div>
      <div className={cn(trackStyle, reverse && "[animation-direction:reverse]")} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
