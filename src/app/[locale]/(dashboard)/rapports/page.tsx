import { getTranslations } from "next-intl/server";
import { RapportsView } from "./_components/rapports-view";

export default async function RapportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("reports.title")}</h1>
      <RapportsView />
    </div>
  );
}
