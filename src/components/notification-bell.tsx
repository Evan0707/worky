"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { api } from "@/trpc/react";
import { formatDate } from "@/lib/i18n-helpers";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationBell() {
  const t = useTranslations("common.notifications");
  const locale = useLocale();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const { data: count = 0 } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data, isLoading } = api.notification.list.useQuery(
    { limit: 20 },
    { enabled: open },
  );

  const markAllMutation = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const markOneMutation = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          {count > 0 ? (
            <BellDot className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</div>
          ) : (
            <div className="divide-y">
              {data.items.map((notif) => (
                <button
                  key={notif.id}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notif.isRead && "bg-primary/5",
                  )}
                  onClick={() => {
                    if (!notif.isRead) markOneMutation.mutate({ id: notif.id });
                    if (notif.link) window.location.href = notif.link;
                    setOpen(false);
                  }}
                >
                  <p className={cn("text-sm leading-snug", !notif.isRead && "font-medium")}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(notif.createdAt, locale)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
