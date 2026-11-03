import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarConfigurator } from "@/components/car/car-configurator";
import { MorphGallery } from "@/components/car/morph-gallery";
import { getCarPage, getModelSlugs } from "@/lib/catalogue";

export async function generateStaticParams() {
  return getModelSlugs();
}

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const car = await getCarPage((await params).slug);
  if (!car) return {};
  return {
    title: `${car.name} on-road price in Lucknow | Brand X`,
    description: `${car.description} See the exact on-road price for your city and book a test drive.`,
  };
}

export default async function CarPage({ params }: PageProps<"/cars/[slug]">) {
  const car = await getCarPage((await params).slug);
  if (!car || car.variants.length === 0) notFound();

  return (
    <main className="px-4 pt-6 sm:px-8 lg:px-12 lg:pb-section">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/cars" className="underline-offset-4 hover:underline">
          New cars
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-foreground">
          {car.name}
        </span>
      </nav>
      <CarConfigurator
        car={car}
        gallery={
          <MorphGallery
            label={`${car.name} photos`}
            photos={car.photos.map((src, index) => ({ src, alt: `${car.name}, photo ${index + 1}` }))}
          />
        }
      />
    </main>
  );
}
