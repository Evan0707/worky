import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { ProjectTabs } from "./_components/project-tabs";
import { ChevronRight, HardHat } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  const status = statusConfig[project.status] ?? statusConfig.ARCHIVED!;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
      <ProjectTabs locale={locale} projectId={id} />

      <main className="mt-2">{children}</main>
    </div>
  );
}
