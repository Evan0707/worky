import { getTranslations } from "next-intl/server";
import { NotesView } from "./_components/notes-view";

export default async function ProjectNotesPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("notes.title")}</h2>
      <NotesView projectId={id} />
    </div>
  );
}
