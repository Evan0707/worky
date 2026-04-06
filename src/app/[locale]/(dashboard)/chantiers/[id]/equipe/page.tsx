import { TeamAssignmentView } from "./_components/team-assignment-view";

export default async function EquipePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <TeamAssignmentView projectId={id} />;
}
