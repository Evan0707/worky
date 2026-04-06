"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Trash2, Package, Plus } from "lucide-react";
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
    <div className="grid gap-5 md:grid-cols-3">
      {/* Left — Form */}
      <div className="md:col-span-1">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {/* Total */}
          <div className="pb-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">{t("materials.totalTTC")}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(data?.totalTTC ?? 0, "EUR", locale)}
                </p>
                {data && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("materials.ht")}: {formatCurrency(data.totalHT, "EUR", locale)}
                    {" · "}
                    {t("materials.vat")}: {data.vatRate}%
                  </p>
                )}
              </>
            )}
          </div>

          {/* Form */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("materials.addMaterial")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("materials.label")}</Label>
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
                <Label className="text-xs text-muted-foreground">{t("materials.quantity")}</Label>
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
                <Label className="text-xs text-muted-foreground">{t("materials.unitPriceHT")}</Label>
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
        </div>
      </div>

      {/* Right — List */}
      <div className="md:col-span-2">
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b border-border/50">
            <p className="text-sm font-semibold">{t("materials.list")}</p>
          </div>

          <div className="px-5 py-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : data?.materials && data.materials.length > 0 ? (
              <div className="divide-y divide-border/50">
                {data.materials.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(item.quantity)} {item.unit} × {formatCurrency(Number(item.unitPrice), "EUR", locale)}
                        {(item as { createdBy?: { name: string } | null }).createdBy?.name && (
                          <span className="ml-1.5 italic text-muted-foreground/70">
                            {t("materials.addedBy", { name: (item as { createdBy?: { name: string } | null }).createdBy!.name })}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(Number(item.quantity) * Number(item.unitPrice), "EUR", locale)}
                    </p>
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
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Package className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">{t("materials.empty")}</p>
                <p className="text-xs text-muted-foreground">{tCommon("subpages.materialsHint")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
