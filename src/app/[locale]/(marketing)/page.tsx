import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  HardHat,
  Camera,
  Clock,
  FileText,
  Share2,
  Users,
  Check,
  Smartphone,
  Zap,
  WifiOff,
} from "lucide-react";

import { HeroBackground } from "./_components/hero-background";
import { FadeIn } from "./_components/fade-in";
import { Logo } from "./_components/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return {
    title: "Worky — Gestion de chantier pour artisans",
    description:
      "Photos, pointage, devis et factures — tout au même endroit. L'outil professionnel des artisans du BTP.",
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  const features = [
    {
      icon: HardHat,
      title: t("features.projects.title"),
      description: t("features.projects.description"),
    },
    {
      icon: Camera,
      title: t("features.photos.title"),
      description: t("features.photos.description"),
    },
    {
      icon: Clock,
      title: t("features.time.title"),
      description: t("features.time.description"),
    },
    {
      icon: FileText,
      title: t("features.invoices.title"),
      description: t("features.invoices.description"),
    },
    {
      icon: Share2,
      title: t("features.sharing.title"),
      description: t("features.sharing.description"),
    },
    {
      icon: Users,
      title: t("features.team.title"),
      description: t("features.team.description"),
    },
  ];

  const steps = [
    { num: "01", title: t("steps.step1.title"), desc: t("steps.step1.description") },
    { num: "02", title: t("steps.step2.title"), desc: t("steps.step2.description") },
    { num: "03", title: t("steps.step3.title"), desc: t("steps.step3.description") },
  ];

  const freeFeatures = [t("pricing.free.f1"), t("pricing.free.f2"), t("pricing.free.f3"), t("pricing.free.f4")];
  const proFeatures = [t("pricing.pro.f1"), t("pricing.pro.f2"), t("pricing.pro.f3"), t("pricing.pro.f4"), t("pricing.pro.f5"), t("pricing.pro.f6"), t("pricing.pro.f7"), t("pricing.pro.f8")];

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a]">
        <HeroBackground />

        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-32 text-center">
          {/* Logo mark large */}
          <FadeIn delay={0}>
            <div className="mb-10 flex justify-center">
              <div className="animate-logo-spin">
                <Logo className="h-14 w-14 opacity-80" />
              </div>
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={100}>
            <h1 className="font-heading text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-black dark:text-white">
              {t("hero.title")}
              <br />
              <span className="bg-gradient-to-r from-neutral-700 via-black to-neutral-600 dark:from-neutral-300 dark:via-white dark:to-neutral-400 bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={200}>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-500">
              {t("hero.subtitle")}
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/login`}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[15px] font-medium text-neutral-900 dark:text-black transition-all hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-7 py-3 text-[15px] font-medium text-neutral-600 dark:text-neutral-400 transition-all hover:text-neutral-900 dark:text-white hover:border-white/25 hover:bg-black/5 dark:bg-white/[0.03]"
              >
                {t("hero.ctaSecondary")}
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="mt-6 text-[13px] text-neutral-600">{t("hero.noCard")}</p>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="h-8 w-[18px] rounded-full border border-black/10 dark:border-white/10 flex items-start justify-center p-1">
            <div className="h-1.5 w-1 rounded-full bg-white/30 animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ───────── DIVIDER LINE ───────── */}
      <div className="bg-neutral-50 dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
      </div>

      {/* ───────── FEATURES ───────── */}
      <section id="features" className="relative bg-neutral-50 dark:bg-[#0a0a0a] py-28 sm:py-36">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <div className="text-center mb-20">
              <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                {t("features.badge")}
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-[2.75rem]">
                {t("features.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-neutral-500 text-[17px] leading-relaxed">
                {t("features.subtitle")}
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-black/5 dark:bg-white/[0.04] rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06]">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 60}>
                <div className="group relative bg-neutral-50 dark:bg-[#0a0a0a] p-8 transition-colors duration-300 hover:bg-white dark:bg-[#111]">
                  <feature.icon className="mb-5 h-5 w-5 text-neutral-500 transition-colors group-hover:text-neutral-900 dark:text-white" />
                  <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── MOBILE APP PREVIEW ───────── */}
      <section className="relative bg-neutral-50 dark:bg-[#0a0a0a] py-28 sm:py-36 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.03] to-transparent mb-28" />

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Illustration (Left) */}
            <div className="relative order-last lg:order-none">
              <FadeIn delay={200}>
                {/* Decorative background gradients */}
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] z-0" />
                <div className="absolute top-1/4 left-1/4 bg-white/5 blur-[80px] w-64 h-64 rounded-full z-0" />

                <div className="relative z-10 flex justify-center lg:justify-start">
                  {/* Image for light mode */}
                  <Image
                    src="/mobile-app-soon-illu-light.svg"
                    width={500}
                    height={600}
                    alt="Mobile app preview"
                    className="w-full max-w-[320px] lg:max-w-[300px] object-contain drop-shadow-2xl translate-y-4 dark:hidden"
                    priority
                  />
                  {/* Image for dark mode */}
                  <Image
                    src="/mobile-app-soon-illu.svg"
                    width={500}
                    height={600}
                    alt="Mobile app preview"
                    className="w-full max-w-[320px] lg:max-w-[300px] object-contain drop-shadow-2xl translate-y-4 hidden dark:block"
                    priority
                  />
                </div>
              </FadeIn>
            </div>

            {/* Context/Text (Right) */}
            <div className="relative z-10">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-black dark:bg-white/[0.02] px-3 py-1 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                  <span className="text-[13px] font-medium uppercase tracking-[0.1em] text-neutral-200">
                    {t("mobileApp.badge")}
                  </span>
                </div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-[2.75rem] leading-[1.1]">
                  {t("mobileApp.title")}
                </h2>
                <p className="mt-6 max-w-lg text-[17px] text-neutral-500 leading-relaxed">
                  {t("mobileApp.subtitle")}
                </p>

                <div className="mt-10 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.04]">
                      <WifiOff className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("mobileApp.features.offline")}</h4>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.04]">
                      <Smartphone className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("mobileApp.features.notifications")}</h4>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.04]">
                      <Zap className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("mobileApp.features.fast")}</h4>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section className="relative bg-neutral-50 dark:bg-[#0a0a0a] py-28 sm:py-36">
        <div className="mx-auto max-w-5xl px-6">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-28" />

          <FadeIn>
            <div className="text-center mb-20">
              <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                {t("steps.badge")}
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-[2.75rem]">
                {t("steps.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-neutral-500 text-[17px] leading-relaxed">
                {t("steps.subtitle")}
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 120}>
                <div className="relative">
                  {/* Step number */}
                  <div className="mb-6 flex items-center gap-4">
                    <span className="text-[48px] font-bold leading-none text-gray-300 dark:text-gray-600/40 tabular-nums">
                      {step.num}
                    </span>
                    {/* Connector (desktop) */}
                    {i < steps.length - 1 && (
                      <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-gray-300/30 to-transparent" />
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── PRICING ───────── */}
      <section id="pricing" className="relative bg-neutral-50 dark:bg-[#0a0a0a] py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-28" />

          <FadeIn>
            <div className="text-center mb-20">
              <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                {t("pricing.badge")}
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-[2.75rem]">
                {t("pricing.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-neutral-500 text-[17px] leading-relaxed">
                {t("pricing.subtitle")}
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Free plan */}
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111] p-8 flex flex-col h-full">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{t("pricing.free.name")}</h3>
                <p className="mt-1 text-[14px] text-neutral-500">
                  {t("pricing.free.description")}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {t("pricing.free.price")}
                  </span>
                  <span className="text-xl font-semibold text-neutral-500">
                    {t("pricing.free.currency")}
                  </span>
                  <span className="text-[14px] text-neutral-600 ml-1">
                    {t("pricing.free.period")}
                  </span>
                </div>
                <ul className="mt-8 space-y-3.5 flex-1">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[14px] text-neutral-600 dark:text-neutral-400">
                      <Check className="h-4 w-4 text-neutral-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/login`}
                  className="mt-8 flex items-center justify-center rounded-full border border-white/[0.1] bg-transparent px-6 py-2.5 text-[14px] font-medium text-neutral-900 dark:text-white transition-all hover:bg-black/5 dark:bg-white/[0.04] hover:border-white/20"
                >
                  {t("pricing.free.cta")}
                </Link>
              </div>
            </FadeIn>

            {/* Pro plan */}
            <FadeIn delay={100}>
              <div className="relative rounded-2xl border border-white/[0.12] bg-white dark:bg-[#111] p-8 flex flex-col h-full shadow-[0_0_80px_-20px_rgba(255,255,255,0.05)]">
                <div className="absolute -top-3 right-6 rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-neutral-900 dark:text-black">
                  {t("pricing.pro.popular")}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{t("pricing.pro.name")}</h3>
                <p className="mt-1 text-[14px] text-neutral-500">
                  {t("pricing.pro.description")}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {t("pricing.pro.price")}
                  </span>
                  <span className="text-xl font-semibold text-neutral-500">
                    {t("pricing.pro.currency")}
                  </span>
                  <span className="text-[14px] text-neutral-600 ml-1">
                    {t("pricing.pro.period")}
                  </span>
                </div>
                <ul className="mt-8 space-y-3.5 flex-1">
                  {proFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[14px] text-neutral-600 dark:text-neutral-400">
                      <Check className="h-4 w-4 text-neutral-900 dark:text-white mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/login`}
                  className="mt-8 flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-neutral-900 dark:text-black transition-all hover:bg-neutral-200"
                >
                  {t("pricing.pro.cta")}
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className="relative bg-neutral-50 dark:bg-[#0a0a0a] py-32 sm:py-40 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-white/[0.015] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <FadeIn>
            <Logo className="h-10 w-10 mx-auto mb-8 opacity-40" />
            <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-5xl">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-[17px] text-neutral-500 leading-relaxed">
              {t("cta.subtitle")}
            </p>
            <Link
              href={`/${locale}/login`}
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-neutral-900 dark:text-black transition-all hover:bg-neutral-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              {t("cta.button")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
