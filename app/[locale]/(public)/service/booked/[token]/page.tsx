import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cancelService } from "@/app/[locale]/(public)/service/actions";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatSlot } from "@/lib/dates";
import { localised } from "@/lib/i18n/content";
import { getServiceBookingByToken } from "@/lib/service/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/service/booked/[token]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServiceBooked" });
  return { title: t("metaTitle"), robots: { index: false } };
}

async function Confirmation({ params }: { params: PageProps<"/[locale]/service/booked/[token]">["params"] }) {
  const { locale: requested, token } = await params;
  setRequestLocale(requested);
  const [booking, t, services, content, locale] = await Promise.all([
    getServiceBookingByToken(token),
    getTranslations("ServiceBooked"),
    getTranslations("Service"),
    getTranslations("Content"),
    getLocale(),
  ]);
  if (!booking) notFound();

  const cancelled = booking.status === "CANCELLED";
  const upcoming = !cancelled && booking.slotStart > new Date();
  const consultant = booking.lead.assignedTo?.name;
  const showroomName = localised(content, "showrooms", booking.showroom.name, booking.showroom.name, "name");
  const showroomAddress = localised(content, "showrooms", booking.showroom.name, booking.showroom.address, "address");
  const who = consultant ?? t("team", { showroom: showroomName });

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-display tracking-tight sm:text-6xl">{cancelled ? t("titleCancelled") : t("titleBooked")}</h1>
        <p className="text-lg text-muted-foreground">
          {cancelled ? t("bodyCancelled") : `${t("bodyBooked", { who })}${booking.lead.optedOutAt ? "" : ` ${t("whatsapp")}`}`}
        </p>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        {[
          { label: t("when"), value: formatSlot(booking.slotStart, locale) },
          { label: t("service"), value: services(`types.${booking.serviceType}`) },
          { label: t("car"), value: `${booking.vehicle}, ${booking.regNumber}` },
          { label: t("showroom"), value: `${showroomName}, ${showroomAddress}` },
          { label: t("consultant"), value: consultant ?? t("consultantPending") },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 bg-card p-4">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-lg">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        {upcoming && (
          <form action={cancelService}>
            <input type="hidden" name="cancelToken" value={booking.cancelToken} />
            <Button type="submit" variant="outline">
              {t("cancel")}
            </Button>
          </form>
        )}
        <Button asChild variant="ghost">
          <Link href={cancelled ? "/service" : "/"}>{cancelled ? t("bookAnother") : t("home")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ServiceBookedPage({ params }: PageProps<"/[locale]/service/booked/[token]">) {
  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <Suspense fallback={<div className="h-80 max-w-2xl animate-pulse rounded-2xl bg-muted" />}>
        <Confirmation params={params} />
      </Suspense>
    </main>
  );
}
