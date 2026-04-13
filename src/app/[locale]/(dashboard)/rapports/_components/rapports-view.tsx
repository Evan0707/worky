"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/i18n-helpers";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700",
  PAUSED: "bg-amber-500/10 text-amber-700",
  DONE: "bg-blue-500/10 text-blue-700",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function RapportsView() {
  const t = useTranslations("common.reports");
  const locale = useLocale();
  const { data, isLoading } = api.report.profitability.useQuery();

  function downloadCsv(rows: string[][], filename: string) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCsv() {
    if (!data) return;
    const header = [
      t("profitability"), t("client"), t("status"),
      t("totalHours"), t("laborCost"), t("materialCost"),
      t("totalCost"), t("totalInvoiced"), t("totalPaid"), t("margin"),
    ];
    const rows = data.map((p) => [
      p.name,
      p.clientName,
      p.status,
      String(p.totalHours),
      String(p.laborCost / 100),
      String(p.materialCost / 100),
      String(p.totalCost / 100),
      String(p.totalInvoiced / 100),
      String(p.totalPaid / 100),
      String(p.margin / 100),
    ]);
    downloadCsv([header, ...rows], "rentabilite-chantiers.csv");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Aucun chantier à afficher.
      </p>
    );
  }

  // Global totals
  const totals = data.reduce(
    (acc, p) => ({
      hours: acc.hours + p.totalHours,
      laborCost: acc.laborCost + p.laborCost,
      materialCost: acc.materialCost + p.materialCost,
      totalCost: acc.totalCost + p.totalCost,
      invoiced: acc.invoiced + p.totalInvoiced,
      paid: acc.paid + p.totalPaid,
      margin: acc.margin + p.margin,
    }),
    { hours: 0, laborCost: 0, materialCost: 0, totalCost: 0, invoiced: 0, paid: 0, margin: 0 },
  );

  const noHourlyRate = data.every((p) => p.laborCost === 0 && p.totalHours > 0);
  const currency = "EUR"; // use first project's currency in real app

  return (
    <div className="space-y-6">
      {noHourlyRate && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {t("noHourlyRate")}
        </div>
      )}

      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("totalHours"), value: `${totals.hours.toFixed(1)}h` },
          { label: t("totalCost"), value: formatCurrency(totals.totalCost, currency, locale) },
          { label: t("totalPaid"), value: formatCurrency(totals.paid, currency, locale) },
          {
            label: t("margin"),
            value: formatCurrency(totals.margin, currency, locale),
            positive: totals.margin > 0,
            negative: totals.margin < 0,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className={cn(
              "text-xl font-bold mt-1",
              kpi.positive && "text-emerald-600",
              kpi.negative && "text-red-600",
            )}>
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("profitability")}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {t("exportCsv")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Chantier</th>
                  <th className="pb-2 font-medium px-2">{t("totalHours")}</th>
                  <th className="pb-2 font-medium px-2">{t("laborCost")}</th>
                  <th className="pb-2 font-medium px-2">{t("materialCost")}</th>
                  <th className="pb-2 font-medium px-2">{t("totalInvoiced")}</th>
                  <th className="pb-2 font-medium px-2">{t("totalPaid")}</th>
                  <th className="pb-2 font-medium px-2 text-right">{t("margin")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[p.status])}>
                          {p.status}
                        </Badge>
                        <div>
                          <p className="font-medium truncate max-w-[160px]">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.clientName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground">{p.totalHours.toFixed(1)}h</td>
                    <td className="py-2.5 px-2">{formatCurrency(p.laborCost, currency, locale)}</td>
                    <td className="py-2.5 px-2">{formatCurrency(p.materialCost, currency, locale)}</td>
                    <td className="py-2.5 px-2">{formatCurrency(p.totalInvoiced, currency, locale)}</td>
                    <td className="py-2.5 px-2">{formatCurrency(p.totalPaid, currency, locale)}</td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        p.margin > 0 ? "text-emerald-600" : p.margin < 0 ? "text-red-600" : "text-muted-foreground",
                      )}>
                        {p.margin > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : p.margin < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        {formatCurrency(p.margin, currency, locale)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
