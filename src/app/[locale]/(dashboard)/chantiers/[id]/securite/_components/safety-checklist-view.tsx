"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, PenLine, CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

type Checklist = RouterOutputs["safetyChecklist"]["listByProject"][number];

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string | null;
  checkedBy?: string | null;
}

interface SafetyChecklistViewProps {
  projectId: string;
}

export function SafetyChecklistView({ projectId }: SafetyChecklistViewProps) {
  const t = useTranslations("projects.safety");
  const tCommon = useTranslations("common.buttons");
  const locale = useLocale();
  const { data: session } = useSession();
  const utils = api.useUtils();

  const [newOpen, setNewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);

  const { data: checklists = [], isLoading } = api.safetyChecklist.listByProject.useQuery({ projectId });
  const { data: templates = [] } = api.safetyChecklist.getTemplates.useQuery();

  const createMutation = api.safetyChecklist.create.useMutation({
    onSuccess: () => {
      setNewOpen(false);
      setSelectedTemplate("");
      toast.success(t("createSuccess"));
      void utils.safetyChecklist.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const updateMutation = api.safetyChecklist.updateItems.useMutation({
    onError: () => toast.error(t("error")),
    onSuccess: () => {
      void utils.safetyChecklist.listByProject.invalidate({ projectId });
    },
  });

  const signMutation = api.safetyChecklist.sign.useMutation({
    onSuccess: () => {
      setSigningId(null);
      toast.success(t("signSuccess"));
      void utils.safetyChecklist.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = api.safetyChecklist.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      toast.success(t("deleteSuccess"));
      void utils.safetyChecklist.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  function handleToggleItem(checklist: Checklist, itemId: string) {
    if (checklist.signedAt) return;
    const items = (checklist.items as unknown as ChecklistItem[]).map((item) => {
      if (item.id !== itemId) return item;
      const nowChecked = !item.checked;
      return {
        ...item,
        checked: nowChecked,
        checkedAt: nowChecked ? new Date().toISOString() : null,
        checkedBy: nowChecked ? (session?.user?.name ?? null) : null,
      };
    });
    updateMutation.mutate({ id: checklist.id, items });
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-36" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card">
            {/* Card header */}
            <div className="px-6 py-4 border-b space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            {/* Card content */}
            <div className="px-6 py-4 space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setNewOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t("new")}
        </Button>
      </div>

      {checklists.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("emptyTitle")}
          description={t("empty")}
        />
      ) : (
        checklists.map((checklist) => (
          <ChecklistCard
            key={checklist.id}
            checklist={checklist}
            locale={locale}
            t={t}
            onToggleItem={(itemId) => handleToggleItem(checklist, itemId)}
            onDeleteRequest={() => setDeletingId(checklist.id)}
            onSignRequest={() => setSigningId(checklist.id)}
          />
        ))
      )}

      {/* New checklist dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{t("chooseTemplate")}</p>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder={t("templateLabel")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.key} value={tpl.key}>
                    {t(`templates.${tpl.key as "EPI" | "ECHAFAUDAGE" | "ELECTRIQUE" | "AMIANTE"}`)}
                    <span className="ml-2 text-xs text-muted-foreground">({tpl.itemCount} pts)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              disabled={!selectedTemplate || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  projectId,
                  template: selectedTemplate as "EPI" | "ECHAFAUDAGE" | "ELECTRIQUE" | "AMIANTE",
                })
              }
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign confirm dialog */}
      <ConfirmDialog
        open={!!signingId}
        onOpenChange={(open) => { if (!open) setSigningId(null); }}
        title={t("signTitle")}
        description={t("signDesc")}
        onConfirm={() => { if (signingId) signMutation.mutate({ id: signingId }); }}
        loading={signMutation.isPending}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
        title={t("deleteConfirm")}
        description={t("deleteDesc")}
        onConfirm={() => { if (deletingId) deleteMutation.mutate({ id: deletingId }); }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function ChecklistCard({
  checklist,
  locale,
  t,
  onToggleItem,
  onDeleteRequest,
  onSignRequest,
}: {
  checklist: Checklist;
  locale: string;
  t: ReturnType<typeof useTranslations<"projects.safety">>;
  onToggleItem: (itemId: string) => void;
  onDeleteRequest: () => void;
  onSignRequest: () => void;
}) {
  const items = checklist.items as unknown as ChecklistItem[];
  const checkedCount = items.filter((i) => i.checked).length;
  const isSigned = !!checklist.signedAt;
  const templateKey = checklist.template as "EPI" | "ECHAFAUDAGE" | "ELECTRIQUE" | "AMIANTE";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {t(`templates.${templateKey}`)}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {checkedCount}/{items.length} {t("itemCount", { count: items.length })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSigned ? (
              <Badge variant="default" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                {t("signedAt", { date: formatDate(checklist.signedAt!, locale) })}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                <Circle className="h-3 w-3" />
                {t("notSigned")}
              </Badge>
            )}
            {!isSigned && (
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onSignRequest}>
                <PenLine className="h-3 w-3" />
                {t("sign")}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDeleteRequest}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              checkedCount === items.length ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors",
              !isSigned && "hover:bg-muted/50 cursor-pointer"
            )}
            onClick={() => !isSigned && onToggleItem(item.id)}
          >
            <Checkbox
              checked={item.checked}
              disabled={isSigned}
              onCheckedChange={() => !isSigned && onToggleItem(item.id)}
              className="mt-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className={cn(
                "text-sm leading-snug",
                item.checked && "line-through text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
