"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CalendarDays, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/i18n-helpers";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ViewMode = "week" | "month";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function PlanningView() {
  const t = useTranslations("common.planning");
  const locale = useLocale();
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));

  // Compute visible range
  const rangeStart = view === "week" ? anchor : (() => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return d;
  })();
  const rangeEnd = view === "week"
    ? addDays(anchor, 6)
    : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

  const { data, isLoading } = api.planning.getEvents.useQuery({
    startDate: rangeStart.toISOString(),
    endDate: new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59).toISOString(),
  });

  function navigate(dir: -1 | 1) {
    if (view === "week") {
      setAnchor((a) => addDays(a, dir * 7));
    } else {
      setAnchor((a) => {
        const d = new Date(a.getFullYear(), a.getMonth() + dir, 1);
        return d;
      });
    }
  }

  function goToday() {
    setAnchor(view === "week" ? startOfWeek(new Date()) : new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  }

  // Build days array
  const days: Date[] = [];
  if (view === "week") {
    for (let i = 0; i < 7; i++) days.push(addDays(anchor, i));
  } else {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  }

  const headerLabel = view === "week"
    ? `${formatDate(rangeStart, locale)} – ${formatDate(rangeEnd, locale)}`
    : anchor.toLocaleDateString(locale, { month: "long", year: "numeric" });

  function eventsForDay(day: Date) {
    if (!data) return { projects: [], tasks: [], hours: 0 };

    const projects = data.projects.filter((p) => {
      if (!p.startDate && !p.endDate) return false;
      const s = p.startDate ? new Date(p.startDate) : day;
      const e = p.endDate ? new Date(p.endDate) : day;
      return day >= s && day <= e;
    });

    const tasks = data.tasks.filter((t) => isSameDay(new Date(t.date), day));
    const hours = data.timeEntries
      .filter((e) => isSameDay(new Date(e.date), day))
      .reduce((sum, e) => sum + e.hours, 0);

    return { projects, tasks, hours };
  }

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            {t("today")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2">{headerLabel}</span>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            size="sm"
            variant={view === "week" ? "secondary" : "ghost"}
            onClick={() => { setView("week"); setAnchor(startOfWeek(new Date())); }}
            className="h-7 text-xs"
          >
            {t("week")}
          </Button>
          <Button
            size="sm"
            variant={view === "month" ? "secondary" : "ghost"}
            onClick={() => { setView("month"); setAnchor(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }}
            className="h-7 text-xs"
          >
            {t("month")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-2 min-h-[120px] space-y-1.5">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          "grid gap-2",
          view === "week" ? "grid-cols-7" : "grid-cols-7",
        )}>
          {/* Day name headers for month view */}
          {view === "month" && ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="text-xs font-medium text-muted-foreground text-center pb-1">{d}</div>
          ))}

          {/* Filler cells for month view */}
          {view === "month" && (() => {
            const firstDow = days[0]!.getDay(); // 0=Sun
            const filler = firstDow === 0 ? 6 : firstDow - 1;
            return Array.from({ length: filler }).map((_, i) => <div key={`f${i}`} />);
          })()}

          {days.map((day) => {
            const { projects, tasks, hours } = eventsForDay(day);
            const isToday = isSameDay(day, today);
            const hasEvents = projects.length + tasks.length > 0;

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "p-2 min-h-[80px]",
                  view === "week" && "min-h-[120px]",
                  isToday && "border-primary/50 bg-primary/5",
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "text-xs font-medium mb-1.5",
                  isToday ? "text-primary" : "text-muted-foreground",
                )}>
                  {day.getDate()}
                  {view === "week" && (
                    <span className="ml-1">
                      {day.toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {projects.slice(0, 2).map((p) => (
                    <Link
                      key={p.id}
                      href={`/${locale}/chantiers/${p.id}`}
                      className="block text-[10px] truncate bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded px-1 py-0.5 hover:opacity-80"
                    >
                      {p.title}
                    </Link>
                  ))}

                  {tasks.slice(0, 2).map((task) => {
                    const isOverdue = new Date(task.date) < today;
                    return (
                      <Link
                        key={task.id}
                        href={`/${locale}/chantiers/${task.projectId}/taches`}
                        className={cn(
                          "flex items-center gap-0.5 text-[10px] truncate rounded px-1 py-0.5 hover:opacity-80",
                          isOverdue
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                        )}
                      >
                        {isOverdue && <AlertCircle className="h-2.5 w-2.5 shrink-0" />}
                        {task.title}
                      </Link>
                    );
                  })}

                  {hours > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      {hours}h
                    </div>
                  )}

                  {projects.length + tasks.length > 4 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{projects.length + tasks.length - 4}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" />
          {t("projects")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30" />
          {t("tasks")}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" />
          {t("timeEntries")}
        </span>
      </div>
    </div>
  );
}
