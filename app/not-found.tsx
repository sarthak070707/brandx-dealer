import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col items-start gap-6 px-4 py-16 sm:px-8 lg:px-12 lg:pb-section">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">Page not found</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          This page doesn&apos;t exist, or the car has moved. The models and certified used cars are a good place to start.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/cars">See all models</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/used-cars">Certified used cars</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
