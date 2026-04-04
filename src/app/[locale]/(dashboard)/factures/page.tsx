import { getTranslations } from "next-intl/server";
import { Plus, Receipt, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import Link from "next/link";
import { InvoiceTable } from "./_components/invoice-table";

export default async function FacturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const tInvoices = await getTranslations({ locale, namespace: "invoices" });

  const invoices = await api.invoice.list();

  if (invoices.length === 0) {
    return (
      <div className="flex-1 flex flex-col space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("nav.invoices")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tInvoices("newSubtitle")}</p>
          </div>
        </div>

        <Card className="border-dashed bg-muted/10 animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center px-6 py-20 text-center">
            {/* Stacked icons illustration */}
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-10 w-10 text-primary/80" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-blue-500/15 flex items-center justify-center border-2 border-background">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold tracking-tight">
              {tInvoices("empty.title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {tInvoices("empty.description")}
            </p>
            <Button className="mt-8 h-10 px-6 shadow-md shadow-primary/20" asChild>
              <Link href={`/${locale}/factures/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {tInvoices("newInvoice")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
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

      <InvoiceTable data={invoices} locale={locale} fullHeight={true} />
    </div>
  );
}
