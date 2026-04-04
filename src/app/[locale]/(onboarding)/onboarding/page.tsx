import { getTranslations } from "next-intl/server";
import { OnboardingForm } from "./_components/onboarding-form";
import { Logo } from "@/app/[locale]/(marketing)/_components/logo";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.onboarding" });

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <Logo />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
        <OnboardingForm locale={locale} />
      </div>
    </div>
  );
}
