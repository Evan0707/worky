"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = RouterOutputs["task"]["listByProject"][number];
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";


const STATUS_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

interface TasksViewProps {
  projectId: string;
}

export function TasksView({ projectId }: TasksViewProps) {
  const t = useTranslations("projects.tasks");
  const locale = useLocale();
  const utils = api.useUtils();

  const { data: tasks = [], isLoading } = api.task.listByProject.useQuery({ projectId });

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const updateMutation = api.task.update.useMutation({
    onSuccess: () => void utils.task.listByProject.invalidate({ projectId }),
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      toast.success(t("deleteSuccess"));
      void utils.task.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  function handleStatusChange(task: Task, checked: boolean) {
    const newStatus: TaskStatus = checked ? "DONE" : "TODO";
    updateMutation.mutate({ id: task.id, status: newStatus });
  }

  function handleColumnChange(task: Task, status: TaskStatus) {
    updateMutation.mutate({ id: task.id, status });
  }

  const tasksByStatus = STATUS_COLUMNS.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    { TODO: [], IN_PROGRESS: [], DONE: [] },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["TODO", "IN_PROGRESS", "DONE"].map((col) => (
            <div key={col} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {tasks.filter((t) => t.status === "DONE").length}/{tasks.length} {t("status.DONE").toLowerCase()}
        </span>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t("add")}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <img src="/No_notes.svg" alt="" className="mx-auto h-[120px] mb-4 opacity-80" />
          <p className="font-medium text-sm">{t("emptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((status) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(`status.${status}`)}
                </span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {tasksByStatus[status].length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[60px]">
                {tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    locale={locale}
                    onStatusToggle={(checked) => handleStatusChange(task, checked)}
                    onStatusChange={(s) => handleColumnChange(task, s)}
                    onDeleteRequest={() => setDeletingId(task.id)}
                    isUpdating={updateMutation.isPending}
                    t={t}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        projectId={projectId}
        onCreated={() => void utils.task.listByProject.invalidate({ projectId })}
      />

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

function TaskCard({
  task,
  locale,
  onStatusToggle,
  onStatusChange: _onStatusChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDeleteRequest,
  isUpdating,
  t,
}: {
  task: Task;
  locale: string;
  onStatusToggle: (checked: boolean) => void;
  onStatusChange: (status: TaskStatus) => void;
  onDeleteRequest: () => void;
  isUpdating: boolean;
  t: ReturnType<typeof useTranslations<"projects.tasks">>;
}) {
  const isOverdue =
    task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <Card className="p-3 group relative">
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={task.status === "DONE"}
          onCheckedChange={(checked) => onStatusToggle(!!checked)}
          disabled={isUpdating}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              task.status === "DONE" && "line-through text-muted-foreground",
              task.priority === 2 && "text-red-600",
            )}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {isOverdue && (
              <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium">
                <AlertCircle className="h-3 w-3" />
                {t("overdue")}
              </span>
            )}
            {task.dueDate && !isOverdue && (
              <span className="text-xs text-muted-foreground">
                {t("dueOn", { date: formatDate(new Date(task.dueDate), locale) })}
              </span>
            )}
            {task.assignee && (
              <span className="text-xs text-muted-foreground">
                {t("assignedTo", { name: task.assignee.name ?? "?" })}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onDeleteRequest}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  onCreated: () => void;
}) {
  const t = useTranslations("projects.tasks");
  const tCommon = useTranslations("common.buttons");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("0");

  const createMutation = api.task.create.useMutation({
    onSuccess: () => {
      toast.success(t("createSuccess"));
      setTitle("");
      setDescription("");
      setPriority("0");
      onOpenChange(false);
      onCreated();
    },
    onError: () => toast.error(t("error")),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority: Number(priority),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("titleLabel")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("descriptionLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("priorityLabel")}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("priority.0")}</SelectItem>
                <SelectItem value="1">{t("priority.1")}</SelectItem>
                <SelectItem value="2">{t("priority.2")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={!title.trim() || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {t("add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
