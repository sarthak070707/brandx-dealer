"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type ButtonsProps = { className?: string; onChoose?: (locale: Locale) => void };

function LanguageButtons({ className, onChoose }: ButtonsProps) {
  const t = useTranslations("Language");
  const active = useLocale();

  return (
    <div role="group" aria-label={t("label")} className={cn("flex gap-0.5 rounded-lg border p-0.5", className)}>
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          disabled={!onChoose}
          aria-pressed={locale === active}
          aria-label={t("switchTo", { language: t(locale === "en" ? "english" : "hindi") })}
          onClick={() => onChoose?.(locale)}
          className={cn(
            "h-10 min-w-11 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            locale === active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`short.${locale}`)}
        </button>
      ))}
    </div>
  );
}

// Moves to the same page in the other language, keeping its query (e.g. ?model=model-h).
// This is a full page load on purpose. Changing language replaces the whole page shell
// (<html lang>), and a client-side move would rebuild it without the dark-theme class that the
// early theme script added, flipping a dark-mode visitor to light.
function ConnectedSwitch({ className }: { className?: string }) {
  const pathname = usePathname();

  const choose = (locale: Locale) => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load is the point, see above
    window.location.href = `${getPathname({ href: pathname, locale })}${window.location.search}`;
  };

  return <LanguageButtons className={className} onChoose={choose} />;
}

// Reading the address needs a loading boundary, so until it is ready the same buttons show
// greyed out and the header doesn't jump.
export function LanguageSwitch({ className }: { className?: string }) {
  return (
    <Suspense fallback={<LanguageButtons className={className} />}>
      <ConnectedSwitch className={className} />
    </Suspense>
  );
}
