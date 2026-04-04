import { getTranslations } from "next-intl/server";
import { MaterialsView } from "./_components/materials-view";

export default async function ProjectMaterialsPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("subpages.materials")}</h2>
      <MaterialsView projectId={id} locale={locale} />
    </div>
  );
}
