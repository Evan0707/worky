"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, PackagePlus, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/i18n-helpers";

export function MaterialsView({ projectId, locale }: { projectId: string; locale: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const utils = api.useUtils();

  const [label, setLabel] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("u");
  const [price, setPrice] = useState<string>("");

  const { data, isLoading } = api.material.listByProject.useQuery({ projectId });

  const createMutation = api.material.create.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.created"));
      setLabel("");
      setQuantity("1");
      setUnit("u");
      setPrice("");
      utils.material.listByProject.invalidate({ projectId });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = api.material.delete.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      utils.material.listByProject.invalidate({ projectId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !quantity || !price) return;
    createMutation.mutate({
      projectId,
      label,
      quantity: parseFloat(quantity),
      unit,
      unitPrice: Math.round(parseFloat(price) * 100),
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column — Stat + Form */}
      <div className="md:col-span-1 space-y-4">
        {/* Total TTC Card */}
        <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5 shadow-none overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400 mb-3">
              <div className="h-7 w-7 rounded-lg icon-orange flex items-center justify-center">
                <PackagePlus className="w-4 h-4" />
              </div>
              {t("materials.totalTTC")}
            </div>
            <div className="text-4xl font-bold tracking-tight text-orange-700 dark:text-orange-400 animate-count-up">
              {isLoading ? (
                <Skeleton className="h-10 w-28" />
              ) : (
                formatCurrency(data?.totalTTC ?? 0, "EUR", locale)
              )}
            </div>
            {data && (
              <div className="mt-2 text-xs text-orange-700/70 dark:text-orange-400/70 flex gap-2">
                <span>{t("materials.ht")}: {formatCurrency(data.totalHT, "EUR", locale)}</span>
                <span>·</span>
                <span>{t("materials.vat")}: {data.vatRate}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Material Form */}
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {t("materials.addMaterial")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("materials.label")}</Label>
                <Input
                  required
                  placeholder={t("materials.labelPlaceholder")}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("materials.quantity")}</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-9 text-sm flex-1 min-w-0"
                    />
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="h-9 w-[62px] text-xs px-2 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["u", "h", "m²", "m³", "ml", "m", "cm", "kg", "t", "pcs", "forfait"].map((u) => (
                          <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("materials.unitPriceHT")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-9 text-sm pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-9" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {tCommon("buttons.add")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column — Materials List */}
      <div className="md:col-span-2">
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">{t("materials.list")}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-14" />
                  </div>
                ))}
              </div>
            ) : data?.materials && data.materials.length > 0 ? (
              <div className="space-y-2">
                {data.materials.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/50 transition-all duration-150"
                  >
                    {/* Icon */}
                    <div className="h-9 w-9 rounded-xl icon-orange flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {Number(item.quantity)} {item.unit} × {formatCurrency(Number(item.unitPrice), "EUR", locale)}
                      </div>
                    </div>
                    {/* Total */}
                    <div className="text-sm font-semibold shrink-0">
                      {formatCurrency(Number(item.quantity) * Number(item.unitPrice), "EUR", locale)}
                    </div>
                    {/* Delete */}
                    <ConfirmDialog
                      title={t("deleteConfirm.title")}
                      description={t("deleteConfirm.description")}
                      confirmLabel={tCommon("buttons.delete")}
                      cancelLabel={tCommon("buttons.cancel")}
                      onConfirm={() => deleteMutation.mutate({ id: item.id })}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="h-10 w-10 rounded-xl icon-orange flex items-center justify-center mb-1">
                  <Package className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{t("materials.empty")}</p>
                <p className="text-xs text-muted-foreground">{tCommon("subpages.materialsHint")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
