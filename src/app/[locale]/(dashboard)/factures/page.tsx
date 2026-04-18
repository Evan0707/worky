import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import Link from "next/link";
import { InvoiceTable } from "./_components/invoice-table";

export default async function FacturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const tInvoices = await getTranslations({ locale, namespace: "invoices" });

  const invoices = await api.invoice.list();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.invoices")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoices.length} document{invoices.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm" className="shadow-md shadow-primary/20">
          <Link href={`/${locale}/factures/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {tInvoices("newInvoice")}
          </Link>
        </Button>
      </div>

      <InvoiceTable 
        data={invoices} 
        locale={locale} 
        fullHeight={true} 
        actionButton={
          <Button className="mt-8 h-10 px-6 shadow-md shadow-primary/20" asChild>
            <Link href={`/${locale}/factures/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {tInvoices("newInvoice")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
