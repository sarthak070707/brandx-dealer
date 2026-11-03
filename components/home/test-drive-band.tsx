import Link from "next/link";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { getShowrooms } from "@/lib/catalogue";
import { formatClock } from "@/lib/dates";

export async function TestDriveBand() {
  const showrooms = await getShowrooms();

  return (
    <section id="showrooms" aria-labelledby="test-drive-title" className="scroll-mt-20 px-4 pb-20 sm:px-8 lg:px-12 lg:pb-section">
      <div className="flex flex-wrap justify-between gap-12 rounded-3xl bg-inverse px-6 py-12 text-inverse-foreground [--ring:var(--inverse-foreground)] sm:p-16 dark:border dark:border-inverse-border">
        <div className="flex max-w-md flex-col items-start gap-5">
          <h2 id="test-drive-title" className="text-4xl leading-tight font-light tracking-tight font-stretch-semi-condensed sm:text-5xl">
            Drive it before you decide.
          </h2>
          <p className="text-lg leading-relaxed text-inverse-muted">
            Pick a showroom, a demo car and a free 30-minute slot. A named consultant confirms it with you.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href={TEST_DRIVE_HREF}>Book a test drive</Link>
          </Button>
        </div>

        <ul className="flex max-w-xl flex-[1_1_22rem] flex-col">
          {showrooms.map((showroom) => (
            <li
              key={showroom.name}
              className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-inverse-border py-5 last:border-b-0"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg">{showroom.name}</h3>
                <p className="text-sm text-inverse-muted">{showroom.address}</p>
              </div>
              <p className="text-sm text-inverse-muted">
                Mon to Sat, {formatClock(showroom.openMinute)} to {formatClock(showroom.closeMinute)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
