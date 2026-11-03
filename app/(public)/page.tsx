import { Hero } from "@/components/home/hero";
import { NewCars } from "@/components/home/new-cars";
import { TestDriveBand } from "@/components/home/test-drive-band";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <NewCars />
      <TestDriveBand />
    </main>
  );
}
