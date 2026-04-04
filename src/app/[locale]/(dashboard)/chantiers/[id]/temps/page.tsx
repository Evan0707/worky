import { getTranslations } from "next-intl/server";
import { TimeEntryView } from "./_components/time-entry-view";

export default async function ProjectTimePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("subpages.time")}</h2>
      <TimeEntryView projectId={id} locale={locale} />
    </div>
  );
}
