"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Camera, Clock, Package, Users } from "lucide-react";

interface ProjectTabsProps {
  locale: string;
  projectId: string;
  showTeamTab?: boolean;
}

export function ProjectTabs({ locale, projectId, showTeamTab = false }: ProjectTabsProps) {
  const t = useTranslations("projects.tabs");
  const pathname = usePathname();

  const baseUrl = `/${locale}/chantiers/${projectId}`;

  const tabs = [
    { name: t("overview"), href: baseUrl, exactMatch: true, icon: LayoutDashboard },
    { name: t("photos"), href: `${baseUrl}/photos`, exactMatch: false, icon: Camera },
    { name: t("time"), href: `${baseUrl}/temps`, exactMatch: false, icon: Clock },
    { name: t("materials"), href: `${baseUrl}/materiaux`, exactMatch: false, icon: Package },
    ...(showTeamTab ? [{ name: t("team"), href: `${baseUrl}/equipe`, exactMatch: false, icon: Users }] : []),
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit max-w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.exactMatch
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <tab.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
