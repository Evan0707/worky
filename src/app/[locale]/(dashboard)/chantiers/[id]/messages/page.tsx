import { getTranslations } from "next-intl/server";
import { MessagesView } from "./_components/messages-view";

export default async function ProjectMessagesPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("messages.title")}</h2>
      <MessagesView projectId={id} />
    </div>
  );
}
