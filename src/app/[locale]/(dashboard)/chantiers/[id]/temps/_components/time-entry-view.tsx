"use client";

import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    onError: (error) => {
      toast.error(error.message);
    },
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
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column — Stat + Form */}
      <div className="md:col-span-1 space-y-4">
        {/* Total Hours Card */}
        <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-500/5 shadow-none overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-400 mb-3">
              <div className="h-7 w-7 rounded-lg icon-violet flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              {t("time.totalHours")}
            </div>
            <div className="text-4xl font-bold tracking-tight text-violet-700 dark:text-violet-400 animate-count-up">
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <>{data?.totalHours} <span className="text-2xl font-medium">h</span></>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Entry Form */}
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {t("time.addEntry")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("time.date")}</Label>
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
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("time.hours")}</Label>
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
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("time.descriptionOptional")}</Label>
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
          </CardContent>
        </Card>
      </div>

      {/* Right Column — Timeline */}
      <div className="md:col-span-2">
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">{t("time.history")}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="w-px flex-1 mt-2" />
                    </div>
                    <div className="space-y-1.5 pb-4 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.entries && data.entries.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-1">
                  {data.entries.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-4 group">
                      {/* Timeline dot */}
                      <div className="relative flex-shrink-0 mt-3">
                        <div className="h-[18px] w-[18px] rounded-full border-2 border-primary/40 bg-background group-hover:border-primary transition-colors flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex-1 flex items-center justify-between py-2.5 border-b last:border-0 border-border/50 gap-4 min-w-0">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{formatDate(new Date(entry.date), locale)}</span>
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">
                              {Number(entry.hours)} h
                            </span>
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
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="h-10 w-10 rounded-xl icon-violet flex items-center justify-center mb-1">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{t("time.empty")}</p>
                <p className="text-xs text-muted-foreground">{tCommon("subpages.timeHint")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
