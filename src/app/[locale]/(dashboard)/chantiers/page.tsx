import { getTranslations } from "next-intl/server";
import { Plus, HardHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import Link from "next/link";
import { ProjectTable } from "./_components/project-table";

export default async function ChantiersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tProjects = await getTranslations({ locale, namespace: "projects" });

  const projects = await api.project.list();

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{tProjects("title")}</h1>
        </div>
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <HardHat className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">
              {tProjects("empty.title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-[400px]">
              {tProjects("empty.description")}
            </p>
            <Button className="mt-6" asChild>
              <Link href={`/${locale}/chantiers/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {tProjects("new.title")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{tProjects("title")}</h1>
        <Button asChild>
          <Link href={`/${locale}/chantiers/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {tProjects("new.title")}
          </Link>
        </Button>
      </div>

      <ProjectTable data={projects} locale={locale} fullHeight={true} />
    </div>
  );
}
