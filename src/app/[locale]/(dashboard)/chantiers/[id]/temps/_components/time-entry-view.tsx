"use client";

import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { Loader2, Trash2, Clock, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function TimeEntryView({ projectId, locale }: { projectId: string; locale: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const utils = api.useUtils();

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]!);
  const [hours, setHours] = useState<string>("1");
  const [desc, setDesc] = useState<string>("");

  const { data, isLoading } = api.timeEntry.listByProject.useQuery({ projectId });

  const createMutation = api.timeEntry.create.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.created"));
      setDesc("");
      utils.timeEntry.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(tCommon("errors.unexpected")),
  });

  const deleteMutation = api.timeEntry.delete.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      utils.timeEntry.listByProject.invalidate({ projectId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      projectId,
      date: new Date(date),
      hours: parseFloat(hours),
      description: desc || undefined,
    });
  };

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Left — Form */}
      <div className="md:col-span-1">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {/* Total */}
          <div className="pb-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">{t("time.totalHours")}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {data?.totalHours ?? 0}
                <span className="text-lg font-medium text-muted-foreground ml-1">h</span>
              </p>
            )}
          </div>

          {/* Form */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("time.addEntry")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("time.date")}</Label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("time.hours")}</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="h-9 text-sm pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("time.descriptionOptional")}</Label>
              <Input
                placeholder={t("time.descriptionPlaceholder")}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="h-9 text-sm"
              />
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

      {/* Right — Timeline */}
      <div className="md:col-span-2">
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b border-border/50">
            <p className="text-sm font-semibold">{t("time.history")}</p>
          </div>

          <div className="px-5 py-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-3 w-3 rounded-full mt-1.5 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.entries && data.entries.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[8px] top-2 bottom-2 w-px bg-border/60" />
                <div className="space-y-0.5">
                  {data.entries.map((entry) => (
                    <div key={entry.id} className="flex gap-4 group">
                      <div className="relative shrink-0 mt-[14px]">
                        <div className="h-4 w-4 rounded-full border-2 border-border bg-background group-hover:border-primary transition-colors" />
                      </div>
                      <div className="flex-1 flex items-center justify-between py-2.5 border-b last:border-0 border-border/40 gap-3 min-w-0">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium">{formatDate(new Date(entry.date), locale)}</span>
                            <span className="text-muted-foreground tabular-nums">{Number(entry.hours)} h</span>
                            {(entry as { createdBy?: { name: string } | null }).createdBy?.name && (
                              <span className="text-xs text-muted-foreground/70 italic">
                                {t("time.addedBy", { name: (entry as { createdBy?: { name: string } | null }).createdBy!.name })}
                              </span>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground pl-5 truncate">{entry.description}</p>
                          )}
                        </div>
                        <ConfirmDialog
                          title={t("deleteConfirm.title")}
                          description={t("deleteConfirm.description")}
                          confirmLabel={tCommon("buttons.delete")}
                          cancelLabel={tCommon("buttons.cancel")}
                          onConfirm={() => deleteMutation.mutate({ id: entry.id })}
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
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">{t("time.empty")}</p>
                <p className="text-xs text-muted-foreground">{tCommon("subpages.timeHint")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
