"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Package, CheckSquare, Tag as TagIcon, Loader2, Copy, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Template = RouterOutputs["projectTemplate"]["list"][number];
type Project = RouterOutputs["project"]["list"][number];

export function TemplatesView() {
  const t = useTranslations("settings.templates");
  const tCommon = useTranslations("common.buttons");
  const utils = api.useUtils();

  const [creating, setCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<Template | null>(null);
  const [creatingFromProject, setCreatingFromProject] = useState(false);

  const { data: templates = [], isLoading, error } = api.projectTemplate.list.useQuery();
  const { data: allProjects = [] } = api.project.list.useQuery();

  // Only ACTIVE/PAUSED projects make sense as targets
  const activeProjects = allProjects.filter(
    (p) => p.status === "ACTIVE" || p.status === "PAUSED",
  );

  const createMutation = api.projectTemplate.create.useMutation({
    onSuccess: () => {
      setCreating(false);
      toast.success(t("createSuccess"));
      void utils.projectTemplate.list.invalidate();
    },
    onError: () => toast.error(t("error")),
  });

  const updateMutation = api.projectTemplate.update.useMutation({
    onSuccess: () => {
      setEditingTemplate(null);
      toast.success(t("updateSuccess"));
      void utils.projectTemplate.list.invalidate();
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = api.projectTemplate.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      toast.success(t("deleteSuccess"));
      void utils.projectTemplate.list.invalidate();
    },
    onError: () => toast.error(t("error")),
  });

  const applyMutation = api.projectTemplate.applyToProject.useMutation({
    onSuccess: () => {
      setApplyingTemplate(null);
      toast.success(t("applySuccess"));
      void utils.task.listByProject.invalidate();
      void utils.material.listByProject.invalidate();
    },
    onError: () => toast.error(t("error")),
  });

  const createFromProjectMutation = api.projectTemplate.createFromProject.useMutation({
    onSuccess: () => {
      setCreatingFromProject(false);
      toast.success(t("createFromProjectSuccess"));
      void utils.projectTemplate.list.invalidate();
    },
    onError: () => toast.error(t("error")),
  });

  // FREE plan: server returns FORBIDDEN
  if (error?.data?.code === "FORBIDDEN") {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{t("proRequired")}</p>
          </div>
          <Button size="sm">{t("proRequiredCta")}</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card flex flex-col">
              <div className="p-6 pb-3 border-b space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 pt-4 flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setCreatingFromProject(true)}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          {t("createFromProject")}
        </Button>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Package className="h-8 w-8 mb-4 text-muted-foreground/50" />
            <p>{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((tpl) => {
            const tasksCount = Array.isArray(tpl.tasks) ? tpl.tasks.length : 0;
            const materialsCount = Array.isArray(tpl.materials) ? tpl.materials.length : 0;
            const tagsCount = Array.isArray(tpl.tags) ? tpl.tags.length : 0;

            return (
              <Card key={tpl.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{tpl.name}</CardTitle>
                      {tpl.description && (
                        <CardDescription className="line-clamp-2 mt-1.5 text-xs">
                          {tpl.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingTemplate(tpl)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingId(tpl.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0 space-y-4">
                  <div className="flex gap-4 text-xs text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="h-3 w-3" />
                      {tasksCount} {t("stats.tasks")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3 w-3" />
                      {materialsCount} {t("stats.materials")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TagIcon className="h-3 w-3" />
                      {tagsCount} {t("stats.tags")}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setApplyingTemplate(tpl)}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {t("applyToProject")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog — key forces remount when switching templates */}
      <TemplateFormDialog
        key={editingTemplate?.id ?? (creating ? "new" : "")}
        open={creating || !!editingTemplate}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditingTemplate(null);
          }
        }}
        template={editingTemplate}
        onSave={(data) => {
          if (editingTemplate) {
            updateMutation.mutate({ id: editingTemplate.id, ...data });
          } else {
            createMutation.mutate(data);
          }
        }}
        saving={createMutation.isPending || updateMutation.isPending}
        t={t}
        tCommon={tCommon}
      />

      {/* Apply template to project dialog */}
      <ProjectPickerDialog
        open={!!applyingTemplate}
        onOpenChange={(v) => { if (!v) setApplyingTemplate(null); }}
        title={t("applyDialogTitle")}
        selectLabel={t("selectProject")}
        noProjectsLabel={t("noActiveProjects")}
        projects={activeProjects}
        onConfirm={(projectId) => {
          if (applyingTemplate) {
            applyMutation.mutate({ templateId: applyingTemplate.id, projectId });
          }
        }}
        loading={applyMutation.isPending}
        t={t}
        tCommon={tCommon}
      />

      {/* Create template from project dialog */}
      <CreateFromProjectDialog
        open={creatingFromProject}
        onOpenChange={(v) => { if (!v) setCreatingFromProject(false); }}
        projects={activeProjects}
        onSave={(projectId, name) =>
          createFromProjectMutation.mutate({ projectId, name })
        }
        loading={createFromProjectMutation.isPending}
        t={t}
        tCommon={tCommon}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => { if (!v) setDeletingId(null); }}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        onConfirm={() => { if (deletingId) deleteMutation.mutate({ id: deletingId }); }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type TFn = ReturnType<typeof useTranslations<"settings.templates">>;
type TCommonFn = ReturnType<typeof useTranslations<"common.buttons">>;

function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSave,
  saving,
  t,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: Template | null;
  onSave: (data: { name: string; description?: string }) => void;
  saving: boolean;
  t: TFn;
  tCommon: TCommonFn;
}) {
  // Because the component is remounted via `key`, useState is always fresh
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? t("edit") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">{t("nameLabel")}</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-desc">{t("descriptionLabel")}</Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>
          {template && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              {t("editWarning")}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={() => onSave({ name, description: description || undefined })}
            disabled={!name.trim() || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectPickerDialog({
  open,
  onOpenChange,
  title,
  selectLabel,
  noProjectsLabel,
  projects,
  onConfirm,
  loading,
  t,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  selectLabel: string;
  noProjectsLabel: string;
  projects: Project[];
  onConfirm: (projectId: string) => void;
  loading: boolean;
  t: TFn;
  tCommon: TCommonFn;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedProjectId(""); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {noProjectsLabel}
            </p>
          ) : (
            <div className="space-y-2">
              <Label>{selectLabel}</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={selectLabel} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={() => { if (selectedProjectId) onConfirm(selectedProjectId); }}
            disabled={!selectedProjectId || loading || projects.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateFromProjectDialog({
  open,
  onOpenChange,
  projects,
  onSave,
  loading,
  t,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: Project[];
  onSave: (projectId: string, name: string) => void;
  loading: boolean;
  t: TFn;
  tCommon: TCommonFn;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [name, setName] = useState<string>("");

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) {
      setSelectedProjectId("");
      setName("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createFromProject")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("noActiveProjects")}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t("fromProjectSelectLabel")}</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectProject")} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-proj-name">{t("createFromProjectTitle")}</Label>
                <Input
                  id="from-proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={() => { if (selectedProjectId && name.trim()) onSave(selectedProjectId, name.trim()); }}
            disabled={!selectedProjectId || !name.trim() || loading || projects.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
