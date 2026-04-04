import { TimeEntryView } from "./_components/time-entry-view";

export default async function ProjectTimePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Suivi des heures</h2>
      <TimeEntryView projectId={id} locale={locale} />
    </div>
  );
}
