import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Plus,
  HardHat,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProjectTable } from "../chantiers/_components/project-table";
import { AnimatedStatCard } from "./_components/animated-stat-card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations({ locale, namespace: "common" });
  const tProjects = await getTranslations({ locale, namespace: "projects" });

  const [statsData, projects] = await Promise.all([
    api.project.getDashboardStats(),
    api.project.list(),
  ]);


  const stats = [
    {
      label: tProjects("title"),
      value: statsData.totalProjects,
      icon: "FolderKanban" as const,
    },
    {
      label: tProjects("status.ACTIVE"),
      value: statsData.activeProjects,
      icon: "Zap" as const,
    },
    {
      label: tProjects("tabs.photos"),
      value: statsData.totalPhotos,
      icon: "Camera" as const,
    },
    {
      label: tProjects("tabs.time"),
      value: Math.round(statsData.totalHours),
      suffix: "h",
      icon: "Clock" as const,
    },
  ];

  const recentProjects = projects.slice(0, 5);


  return (
    <div className="space-y-8 animate-in fade-in duration-500 flex-1 overflow-auto p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            {t("dashboard.title")}
          </h1>
        </div>
        <Button asChild size="sm" className="shadow-md shadow-primary/20 shrink-0">
          <Link href={`/${locale}/chantiers/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {tProjects("new.title")}
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <AnimatedStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            suffix={"suffix" in stat ? stat.suffix : undefined}
            icon={stat.icon}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Projects section */}
      {projects.length > 0 ? (
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold tracking-tight">{t("dashboard.recentProjects")}</h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary text-xs gap-1">
              <Link href={`/${locale}/chantiers`}>
                {t("dashboard.viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <ProjectTable
            data={recentProjects}
            locale={locale}
            hideFilter
            hidePagination
          />
        </div>
      ) : (
        <Card className="border-dashed bg-muted/10 animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6 shadow-inner">
              <HardHat className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              {tProjects("empty.title")}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
              {tProjects("empty.description")}
            </p>
            <Button className="mt-8 px-8 h-11 shadow-md shadow-primary/20" asChild>
              <Link href={`/${locale}/chantiers/new`}>
                <Plus className="mr-2 h-5 w-5" />
                {tProjects("new.title")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
