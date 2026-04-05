import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/server/auth";
import LoginForm from "./_components/login-form";
import { Logo } from "@/app/[locale]/(marketing)/_components/logo";
import { HeroBackground } from "@/app/[locale]/(marketing)/_components/hero-background";
import { FadeIn } from "@/app/[locale]/(marketing)/_components/fade-in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("login.title"),
    description: t("login.subtitle"),
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a] p-6">
      <HeroBackground />
      
      <FadeIn delay={0} direction="none" className="absolute left-6 top-6 z-20">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 backdrop-blur-md transition-all hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </FadeIn>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Brand */}
        <FadeIn delay={100} className="mb-8 flex flex-col items-center">
          <div className="animate-logo-spin">
            <Logo className="h-12 w-12" />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            Worky
          </h1>
          <p className="mt-3 text-[17px] text-neutral-500 dark:text-neutral-400">
            {t("login.subtitle")}
          </p>
        </FadeIn>

        {/* Login Card */}
        <FadeIn delay={200} className="w-full max-w-[420px]">
          <LoginForm />

          <p className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {t("login.legal.text")}{" "}
            <Link
              href={`/${locale}/terms`}
              className="font-medium underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white"
            >
              {t("login.legal.terms")}
            </Link>{" "}
            {t("login.legal.and")}{" "}
            <Link
              href={`/${locale}/privacy`}
              className="font-medium underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white"
            >
              {t("login.legal.privacy")}
            </Link>
            .
          </p>
        </FadeIn>
      </div>
    </main>
  );
}
