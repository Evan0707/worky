import { auth } from "@/server/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { TeamView } from "../_components/team-view";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "team" });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <TeamView currentUserId={session.user.id!} />
    </div>
  );
}
