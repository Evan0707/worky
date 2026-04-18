import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { ProjectTabs } from "./_components/project-tabs";
import { ChevronLeft, ChevronRight, HardHat } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { getArtisanContext } from "@/server/lib/team-context";
import { db } from "@/server/db";

const statusConfig: Record<string, { label_key: string; classes: string }> = {
  ACTIVE:   { label_key: "status.ACTIVE",   classes: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  PAUSED:   { label_key: "status.PAUSED",   classes: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  DONE:     { label_key: "status.DONE",     classes: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  ARCHIVED: { label_key: "status.ARCHIVED", classes: "bg-muted text-muted-foreground" },
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tProjects = await getTranslations({ locale, namespace: "projects" });

  let project;
  try {
    project = await api.project.getById({ id });
  } catch {
    notFound();
  }

  // Determine if team tab should be shown (OWNER with team, or ADMIN)
  let showTeamTab = false;
  const session = await auth();
  if (session?.user?.id) {
    const { artisanId, role } = await getArtisanContext(session.user.id, db);
    if (role === "ADMIN") {
      showTeamTab = true;
    } else if (role === null) {
      const team = await db.team.findUnique({ where: { ownerId: artisanId }, select: { id: true } });
      showTeamTab = !!team;
    }
  }

  const status = statusConfig[project.status] ?? statusConfig.ARCHIVED!;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Mobile back button */}
      <div className="sm:hidden">
        <Link
          href={`/${locale}/chantiers`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {tProjects("title")}
        </Link>
      </div>

      {/* Breadcrumb (desktop) */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/${locale}/chantiers`} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <HardHat className="h-3.5 w-3.5" />
          {tProjects("title")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", status.classes)}>
              {tProjects(status.label_key as Parameters<typeof tProjects>[0])}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {project.clientName} · {project.address}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ProjectTabs locale={locale} projectId={id} showTeamTab={showTeamTab} />

      <main className="mt-2">{children}</main>
    </div>
  );
}
