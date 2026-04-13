import { getTranslations } from "next-intl/server";
import { TemplatesView } from "./_components/templates-view";

export default async function SettingsTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings.templates" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      <TemplatesView />
    </div>
  );
}