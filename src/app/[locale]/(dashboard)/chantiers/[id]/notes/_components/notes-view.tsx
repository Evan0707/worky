"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Image from "next/image";
import { Loader2, Pin, PinOff, Trash2, Pencil, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Note = RouterOutputs["projectNote"]["listByProject"][number];

interface NotesViewProps {
  projectId: string;
}

export function NotesView({ projectId }: NotesViewProps) {
  const t = useTranslations("projects.notes");
  const tCommon = useTranslations("common.buttons");
  const locale = useLocale();
  const utils = api.useUtils();

  const { data: notes = [], isLoading } = api.projectNote.listByProject.useQuery({ projectId });

  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createMutation = api.projectNote.create.useMutation({
    onSuccess: () => {
      setContent("");
      toast.success(t("addSuccess"));
      void utils.projectNote.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const updateMutation = api.projectNote.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      toast.success(t("updateSuccess"));
      void utils.projectNote.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = api.projectNote.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      toast.success(t("deleteSuccess"));
      void utils.projectNote.listByProject.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  function handleCreate() {
    if (!content.trim()) return;
    createMutation.mutate({ projectId, content: content.trim() });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCreate();
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  function saveEdit() {
    if (!editingId || !editContent.trim()) return;
    updateMutation.mutate({ id: editingId, content: editContent.trim() });
  }

  function togglePin(note: Note) {
    updateMutation.mutate({ id: note.id, isPinned: !note.isPinned });
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {/* Input area skeleton */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        {/* Note cards skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Input area */}
      <Card className="p-4 space-y-3">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="min-h-[80px] resize-none border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{tCommon("ctrlEnter")}</span>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!content.trim() || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("add")}
          </Button>
        </div>
      </Card>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image src="/No_notes.svg" alt="" width={120} height={120} className="mx-auto mb-4 opacity-80" />
          <p className="font-medium text-sm">{t("emptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              locale={locale}
              isEditing={editingId === note.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onStartEdit={() => startEdit(note)}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onTogglePin={() => togglePin(note)}
              onDeleteRequest={() => setDeletingId(note.id)}
              isSaving={updateMutation.isPending && editingId === note.id}
              t={t}
            />
          ))}
        </div>
      )}

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

function NoteCard({
  note,
  locale,
  isEditing,
  editContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePin,
  onDeleteRequest,
  isSaving,
  t,
}: {
  note: Note;
  locale: string;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTogglePin: () => void;
  onDeleteRequest: () => void;
  isSaving: boolean;
  t: ReturnType<typeof useTranslations<"projects.notes">>;
}) {
  return (
    <Card className={cn("p-4", note.isPinned && "border-primary/30 bg-primary/5")}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {note.isPinned && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mb-1.5">
              <Pin className="h-3 w-3" />
              {t("pinned")}
            </span>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveEdit} disabled={isSaving || !editContent.trim()}>
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            {note.createdBy?.name && `${t("by", { name: note.createdBy.name })} · `}
            {formatDate(note.createdAt, locale)}
          </p>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onTogglePin}
              title={note.isPinned ? t("unpin") : t("pin")}
            >
              {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onStartEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDeleteRequest}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
