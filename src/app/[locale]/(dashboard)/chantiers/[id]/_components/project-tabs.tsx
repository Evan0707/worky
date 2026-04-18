"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Camera, Clock, Package, Users, StickyNote, CheckSquare, MessageCircle, ShieldCheck } from "lucide-react";

interface ProjectTabsProps {
  locale: string;
  projectId: string;
  showTeamTab?: boolean;
}

export function ProjectTabs({ locale, projectId, showTeamTab = false }: ProjectTabsProps) {
  const t = useTranslations("projects.tabs");
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const baseUrl = `/${locale}/chantiers/${projectId}`;

  const tabs = [
    { name: t("overview"), href: baseUrl, exactMatch: true, icon: LayoutDashboard },
    { name: t("notes"), href: `${baseUrl}/notes`, exactMatch: false, icon: StickyNote },
    { name: t("tasks"), href: `${baseUrl}/taches`, exactMatch: false, icon: CheckSquare },
    { name: t("photos"), href: `${baseUrl}/photos`, exactMatch: false, icon: Camera },
    { name: t("time"), href: `${baseUrl}/temps`, exactMatch: false, icon: Clock },
    { name: t("materials"), href: `${baseUrl}/materiaux`, exactMatch: false, icon: Package },
    { name: t("messages"), href: `${baseUrl}/messages`, exactMatch: false, icon: MessageCircle },
    { name: t("safety"), href: `${baseUrl}/securite`, exactMatch: false, icon: ShieldCheck },
    ...(showTeamTab ? [{ name: t("team"), href: `${baseUrl}/equipe`, exactMatch: false, icon: Users }] : []),
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, []);

  return (
    <div className="relative max-w-full">
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={t("overview")}
        className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit max-w-full overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.exactMatch
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <tab.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="hidden sm:inline">{tab.name}</span>
            </Link>
          );
        })}
      </div>
      {/* Fade indicator when more tabs are available */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 rounded-r-xl bg-gradient-to-l from-background/80 to-transparent" />
      )}
    </div>
  );
}
