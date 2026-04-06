import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import Link from "next/link";
import { ProjectTable } from "./_components/project-table";

export default async function ChantiersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tProjects = await getTranslations({ locale, namespace: "projects" });

  const projects = await api.project.list();

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

      <ProjectTable 
        data={projects} 
        locale={locale} 
        fullHeight={true} 
        actionButton={
          <Button className="mt-6" asChild>
            <Link href={`/${locale}/chantiers/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {tProjects("new.title")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
