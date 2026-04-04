import { getTranslations } from "next-intl/server";
import { CreateProjectForm } from "./_components/create-project-form";

export default async function NewChantierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tProjects = await getTranslations({ locale, namespace: "projects" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{tProjects("new.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tProjects("new.subtitle")}
        </p>
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <CreateProjectForm locale={locale} />
      </div>
    </div>
  );
}
