import { MaterialsView } from "./_components/materials-view";

export default async function ProjectMaterialsPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Matériaux et Achats</h2>
      <MaterialsView projectId={id} locale={locale} />
    </div>
  );
}
