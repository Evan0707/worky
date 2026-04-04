import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr-FR", "en-GB", "de-DE", "es-ES"],
  defaultLocale: "fr-FR",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
