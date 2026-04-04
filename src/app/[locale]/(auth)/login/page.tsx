import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HardHat, Camera, Clock, FileText } from "lucide-react";

import { auth } from "@/server/auth";
import LoginForm from "./_components/login-form";

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

  const features = [
    { icon: HardHat, text: t("login.branding.featureProjects") },
    { icon: Camera, text: t("login.branding.featurePhotos") },
    { icon: Clock, text: t("login.branding.featureTime") },
    { icon: FileText, text: t("login.branding.featureInvoicing") },
  ];

  return (
    <main className="flex min-h-screen">
      {/* Left panel -- Branding (desktop only) */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-brand p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="bg-grid-pattern h-full w-full" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-sm font-bold backdrop-blur-sm">
            W
          </div>
          <span className="text-xl font-semibold tracking-tight">Worky</span>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="max-w-xs text-3xl font-semibold leading-tight">
              {t("login.branding.headline")}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              {t("login.branding.description")}
            </p>
          </div>

          <div className="space-y-2">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-white/8 px-4 py-3"
              >
                <feature.icon className="h-4 w-4 text-white/70" />
                <span className="text-sm text-white/80">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          &copy; {new Date().getFullYear()} Worky
        </p>
      </div>

      {/* Right panel -- Login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile brand */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            W
          </div>
          <h1 className="text-xl font-semibold">Worky</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </div>

        <div className="w-full max-w-[400px]">
          <LoginForm />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("login.legal.text")}{" "}
            <a
              href={`/${locale}/terms`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("login.legal.terms")}
            </a>{" "}
            {t("login.legal.and")}{" "}
            <a
              href={`/${locale}/privacy`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("login.legal.privacy")}
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
