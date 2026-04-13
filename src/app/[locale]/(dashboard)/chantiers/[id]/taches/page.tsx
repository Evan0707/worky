import { getTranslations } from "next-intl/server";
import { TasksView } from "./_components/tasks-view";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("tasks.title")}</h2>
      <TasksView projectId={id} />
    </div>
  );
}
