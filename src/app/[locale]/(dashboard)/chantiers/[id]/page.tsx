import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/i18n-helpers";
import { Mail, Phone, MapPin, Calendar, Link as LinkIcon, User } from "lucide-react";
import { ShareProjectButton } from "./_components/share-project-button";

export default async function ProjectOverviewPage({
  params,
}: {
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

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${project.shareToken}`;

  // Generate initials for client avatar
  const initials = project.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-5">
        {/* General Info */}
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">{tProjects("overview.generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {project.description && (
              <div className="text-sm text-foreground/80 bg-muted/40 p-4 rounded-xl leading-relaxed border border-border/50">
                {project.description}
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-sm">
                <div className="h-7 w-7 rounded-lg icon-blue flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="text-foreground/90 pt-0.5">{project.address}</span>
              </div>

              {(project.startDate || project.endDate) && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-7 w-7 rounded-lg icon-green flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-foreground/90 pt-0.5">
                    {project.startDate ? formatDate(project.startDate, locale) : tProjects("overview.undefined")}
                    {" → "}
                    {project.endDate ? formatDate(project.endDate, locale) : tProjects("overview.undefined")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Card */}
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">{tProjects("overview.client")}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-center gap-3 mb-4">
              {/* Avatar with initials */}
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{project.clientName}</p>
                {project.clientEmail && (
                  <p className="text-xs text-muted-foreground">{project.clientEmail}</p>
                )}
              </div>
            </div>

            {(project.clientEmail || project.clientPhone) && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                {project.clientEmail && (
                  <a
                    href={`mailto:${project.clientEmail}`}
                    className="flex items-center gap-3 text-sm rounded-lg p-2 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg icon-blue flex items-center justify-center shrink-0">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground transition-colors">{project.clientEmail}</span>
                  </a>
                )}
                {project.clientPhone && (
                  <a
                    href={`tel:${project.clientPhone}`}
                    className="flex items-center gap-3 text-sm rounded-lg p-2 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg icon-green flex items-center justify-center shrink-0">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground transition-colors">{project.clientPhone}</span>
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Card */}
      <div>
        <Card className="shadow-none border-primary/15 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg icon-primary flex items-center justify-center">
                <LinkIcon className="h-3.5 w-3.5" />
              </div>
              {tProjects("share.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tProjects("share.description")}
            </p>

            <div className="bg-muted/60 rounded-xl p-3 flex items-center justify-between gap-3 border border-border/50 group cursor-text select-all">
              <code className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {publicUrl}
              </code>
            </div>

            <ShareProjectButton url={publicUrl} projectId={project.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
