import { getTranslations } from "next-intl/server";
import { SafetyChecklistView } from "./_components/safety-checklist-view";

export default async function ProjectSafetyPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("safety.title")}</h2>
      <SafetyChecklistView projectId={id} />
    </div>
  );
}
