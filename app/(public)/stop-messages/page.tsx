import type { Metadata } from "next";
import { Suspense } from "react";
import { StopForm } from "@/app/(public)/stop-messages/stop-form";
import { phoneForOptOutToken } from "@/lib/privacy/opt-out";
import { maskPhone } from "@/lib/privacy/mask-phone";

export const metadata: Metadata = { title: "Stop messages | Brand X Lucknow", robots: { index: false } };

async function StopCard({ searchParams }: { searchParams: PageProps<"/stop-messages">["searchParams"] }) {
  const { token } = await searchParams;
  const given = typeof token === "string" ? token : undefined;
  const phone = given ? await phoneForOptOutToken(given) : null;

  return <StopForm token={phone ? given : undefined} maskedPhone={phone ? maskPhone(phone) : undefined} linkProblem={Boolean(given) && !phone} />;
}

export default function StopMessagesPage({ searchParams }: PageProps<"/stop-messages">) {
  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">Stop messages</h1>
          <p className="text-lg text-muted-foreground">
            We&apos;ll stop every WhatsApp and SMS message to your number. It takes effect straight away.
          </p>
        </div>
        <Suspense fallback={<div aria-hidden="true" className="h-56 animate-pulse rounded-2xl bg-muted" />}>
          <StopCard searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
