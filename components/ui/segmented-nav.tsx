"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; matchPrefix?: string };
type Props = { label: string; items: Item[] };

// Segmented-control look, but each choice is a real page, so it works with the back button and
// links, and needs no animation library.
export function SegmentedNav({ label, items }: Props) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="max-w-full self-start overflow-x-auto rounded-xl bg-muted p-1">
      <ul className="flex w-max gap-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.matchPrefix !== undefined && pathname.startsWith(item.matchPrefix));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-4 py-2 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
