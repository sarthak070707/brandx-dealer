import { defineRouting } from "next-intl/routing";

// Every public address starts with its language: /en/cars, /hi/cars.
export const routing = defineRouting({
  locales: ["en", "hi"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
