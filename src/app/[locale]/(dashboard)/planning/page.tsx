import { getTranslations } from "next-intl/server";
import { PlanningView } from "./_components/planning-view";

export default async function PlanningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("planning.title")}</h1>
      <PlanningView />
    </div>
  );
}
