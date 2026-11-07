import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/hero";
import { NewCars } from "@/components/home/new-cars";
import { TestDriveBand } from "@/components/home/test-drive-band";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <NewCars />
      <TestDriveBand />
    </main>
  );
}
