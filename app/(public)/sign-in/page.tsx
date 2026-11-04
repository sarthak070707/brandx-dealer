import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/app/(public)/sign-in/sign-in-form";

export const metadata: Metadata = { title: "Sign in | Brand X", robots: { index: false } };

async function SignInCard({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  const { callbackUrl } = await searchParams;
  return <SignInForm redirectTo={typeof callbackUrl === "string" ? callbackUrl : undefined} />;
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="px-4 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed">Sign in</h1>
          <p className="text-muted-foreground">For Brand X consultants and admins, and buyers who have booked a test drive.</p>
        </div>
        <Suspense fallback={<div aria-hidden="true" className="h-72 animate-pulse rounded-2xl bg-muted" />}>
          <SignInCard searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
