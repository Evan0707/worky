import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Fallback to default locale if not valid
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Each file becomes a top-level namespace:
    //   useTranslations('common')  → t('nav.dashboard')
    //   useTranslations('auth')    → t('login.title')
    //   useTranslations('projects')→ t('status.ACTIVE')
    messages: {
      common: (await import(`./locales/${locale}/common.json`)).default,
      projects: (await import(`./locales/${locale}/projects.json`)).default,
      photos: (await import(`./locales/${locale}/photos.json`)).default,
      invoices: (await import(`./locales/${locale}/invoices.json`)).default,
      billing: (await import(`./locales/${locale}/billing.json`)).default,
      auth: (await import(`./locales/${locale}/auth.json`)).default,
      settings: (await import(`./locales/${locale}/settings.json`)).default,
      team: (await import(`./locales/${locale}/team.json`)).default,
      landing: (await import(`./locales/${locale}/landing.json`)).default,
      legal: (await import(`./locales/${locale}/legal.json`)).default,
    },
  };
});
