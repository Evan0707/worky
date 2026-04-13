"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Message = RouterOutputs["message"]["list"]["items"][number];

interface MessagesViewProps {
  projectId: string;
}

export function MessagesView({ projectId }: MessagesViewProps) {
  const t = useTranslations("projects.messages");
  const tCommon = useTranslations("common.buttons");
  const locale = useLocale();
  const { data: session } = useSession();
  const utils = api.useUtils();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = api.message.list.useQuery({ projectId, limit: 50 });
  const messages: Message[] = data?.items ?? [];

  const sendMutation = api.message.send.useMutation({
    onSuccess: () => {
      setContent("");
      void utils.message.list.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = api.message.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      toast.success(t("deleteSuccess"));
      void utils.message.list.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  // Scroll to bottom when messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMutation.mutate({ projectId, content: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col max-w-2xl h-[calc(100vh-280px)] min-h-[400px]">
        <div className="flex-1 space-y-3 pr-1 pb-4">
          {/* Alternating left/right bubble skeletons */}
          {["left", "right", "left", "right", "left"].map((side, i) => (
            <div key={i} className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
              <div className="space-y-1 max-w-[65%]">
                {side === "left" && <Skeleton className="h-3 w-16" />}
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <Skeleton className="h-[72px] w-full rounded-md" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  const myId = session?.user?.id;

  return (
    <div className="flex flex-col max-w-2xl h-[calc(100vh-280px)] min-h-[400px]">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">{t("empty")}</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              locale={locale}
              isMe={msg.authorId === myId}
              onDeleteRequest={() => setDeletingId(msg.id)}
              t={t}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="min-h-[72px] resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{tCommon("ctrlEnter")}</span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!content.trim() || sendMutation.isPending}
            className="gap-1.5"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {t("send")}
          </Button>
        </div>
      </div>

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

function MessageBubble({
  message,
  locale,
  isMe,
  onDeleteRequest,
  t,
}: {
  message: Message;
  locale: string;
  isMe: boolean;
  onDeleteRequest: () => void;
  t: ReturnType<typeof useTranslations<"projects.messages">>;
}) {
  const [hovered, setHovered] = useState(false);
  const name = message.isFromClient
    ? t("client")
    : (message.author?.name ?? message.authorName ?? "?");

  return (
    <div
      className={cn("flex group", isMe ? "justify-end" : "justify-start")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn("max-w-[75%] space-y-1", isMe ? "items-end" : "items-start")}>
        {!isMe && (
          <p className="text-xs text-muted-foreground px-1">{name}</p>
        )}

        <div className="flex items-end gap-2">
          {isMe && hovered && (
            <button
              onClick={onDeleteRequest}
              className="text-muted-foreground hover:text-destructive transition-colors mb-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm",
              isMe
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted rounded-bl-sm",
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          {!isMe && hovered && (
            <button
              onClick={onDeleteRequest}
              className="text-muted-foreground hover:text-destructive transition-colors mb-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <p className={cn("text-xs text-muted-foreground px-1", isMe && "text-right")}>
          {formatDate(message.createdAt, locale)}
        </p>
      </div>
    </div>
  );
}
