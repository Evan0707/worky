import { getTranslations } from "next-intl/server";
import { SettingsNav } from "./_components/settings-nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("settings.description")}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 overflow-hidden">
        {/* Secondary Sidebar */}
        <aside className="md:w-64 shrink-0 overflow-y-auto">
          <SettingsNav />
        </aside>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8">
          <div className="max-w-3xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
