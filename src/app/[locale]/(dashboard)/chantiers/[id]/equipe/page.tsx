import { getTranslations } from "next-intl/server";
import { TeamAssignmentView } from "./_components/team-assignment-view";

export default async function EquipePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects.team" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("title")}</h2>
      <TeamAssignmentView projectId={id} />
    </div>
  );
}
