"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Camera, Clock, Package, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityEvent = {
  id: string;
  type: "photo" | "time" | "material" | "invoice";
  createdAt: Date;
  createdBy: { id: string; name: string | null; image: string | null } | null;
  project: { id: string; name: string };
  meta: Record<string, unknown>;
};

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  photo: {
    icon: Camera,
    className: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    dotClassName: "bg-violet-500",
  },
  time: {
    icon: Clock,
    className: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    dotClassName: "bg-sky-500",
  },
  material: {
    icon: Package,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dotClassName: "bg-amber-500",
  },
  invoice: {
    icon: FileText,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dotClassName: "bg-emerald-500",
  },
} as const;

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event, t }: { event: ActivityEvent; t: ReturnType<typeof useTranslations> }) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;
  const actor = event.createdBy?.name ?? t("activity.unknownMember");

  const getDescription = () => {
    switch (event.type) {
      case "photo":
        return t("activity.events.photo", { member: actor, project: event.project.name });
      case "time": {
        const hours = (event.meta as { hours: number }).hours;
        return t("activity.events.time", { member: actor, hours, project: event.project.name });
      }
      case "material": {
        const label = (event.meta as { label: string }).label;
        return t("activity.events.material", { member: actor, label, project: event.project.name });
      }
      case "invoice": {
        const number = (event.meta as { number: string }).number;
        return t("activity.events.invoice", { member: actor, number, project: event.project.name });
      }
    }
  };

  const relativeTime = () => {
    const diff = Date.now() - new Date(event.createdAt).getTime();
    const mins = Math.floor(diff / 60_000);
    const hrs = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 2) return t("activity.justNow");
    if (mins < 60) return t("activity.minutesAgo", { n: mins });
    if (hrs < 24) return t("activity.hoursAgo", { n: hrs });
    return t("activity.daysAgo", { n: days });
  };

  return (
    <div className="flex gap-3 group animate-in fade-in-0 slide-in-from-top-1 duration-300">
      {/* Icon */}
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", config.className)}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <p className="text-sm leading-snug text-foreground">{getDescription()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{relativeTime()}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamActivityFeed() {
  const t = useTranslations("team");
  const utils = api.useUtils();

  const { data, isLoading } = api.team.activity.useQuery(undefined, {
    refetchInterval: 60_000, // Also poll every minute as fallback
  });

  const channelRef = useRef<ReturnType<typeof pusherClient.subscribe> | null>(null);

  // Subscribe to Pusher real-time updates
  useEffect(() => {
    if (!data?.teamId) return;

    const channelName = `private-team-${data.teamId}`;
    const channel = pusherClient.subscribe(channelName);
    channelRef.current = channel;

    const handlePhotoAdded = (payload: { memberName: string; projectName: string; count: number }) => {
      toast.info(t("activity.toasts.photo", { member: payload.memberName, project: payload.projectName, count: payload.count }), {
        duration: 5000,
      });
      void utils.team.activity.invalidate();
    };

    const handleTimeLogged = (payload: { memberName: string; projectName: string; hours: number }) => {
      toast.info(t("activity.toasts.time", { member: payload.memberName, project: payload.projectName, hours: payload.hours }), {
        duration: 5000,
      });
      void utils.team.activity.invalidate();
    };

    const handleMaterialAdded = (payload: { memberName: string; projectName: string; label: string }) => {
      toast.info(t("activity.toasts.material", { member: payload.memberName, project: payload.projectName, label: payload.label }), {
        duration: 5000,
      });
      void utils.team.activity.invalidate();
    };

    channel.bind("photo:added", handlePhotoAdded);
    channel.bind("time:logged", handleTimeLogged);
    channel.bind("material:added", handleMaterialAdded);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [data?.teamId, t, utils.team.activity]);

  if (isLoading) {
    return (
      <Card className="shadow-none border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {t("activity.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 py-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const events = data?.events ?? [];

  return (
    <Card className="shadow-none border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {t("activity.title")}
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs font-normal">
              {events.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("activity.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event as ActivityEvent}
                t={t}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
