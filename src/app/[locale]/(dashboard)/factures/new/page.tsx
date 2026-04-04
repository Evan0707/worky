import { getTranslations } from "next-intl/server";
import { InvoiceForm } from "../_components/invoice-form";
import { api } from "@/trpc/server";

export default async function NewFacturePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "invoices" });
  const projects = await api.project.list();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newDocument")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("newSubtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8">
        <InvoiceForm projects={projects} locale={locale} />
      </div>
    </div>
  );
}
