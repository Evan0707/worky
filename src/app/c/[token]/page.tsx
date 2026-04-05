import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { api } from "@/trpc/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/i18n-helpers";
import { MapPin, Calendar, Camera, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientTracker } from "./_components/client-tracker";

// Server component pour la route publique du chantier
export default async function ClientProjectView({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  
  const reqHeaders = await headers();
  const acceptLanguage = reqHeaders.get("accept-language") || "";
  const browserLocale = acceptLanguage.includes("en") ? "en-GB" : acceptLanguage.includes("de") ? "de-DE" : acceptLanguage.includes("es") ? "es-ES" : "fr-FR";

  let project;
  let tError;
  try {
    const errorTranslations = (await import(`@/i18n/locales/${browserLocale}/projects.json`)).default;
    tError = errorTranslations.publicView;
    project = await api.project.getByToken({ token });
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-md text-center p-8 shadow-sm animate-scale-in">
          <div className="mx-auto h-16 w-16 mb-4 rounded-2xl icon-orange flex items-center justify-center">
            <MapPin className="h-8 w-8 opacity-60" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight mb-2">
            {tError?.invalidLinkTitle || "Lien invalide ou expiré"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {tError?.invalidLinkDesc || "Ce chantier n'est plus partagé. Veuillez contacter votre artisan pour obtenir un nouveau lien."}
          </p>
        </Card>
      </div>
    );
  }

  const defaultLocale = browserLocale;
  const translations = (await import(`@/i18n/locales/${defaultLocale}/projects.json`)).default;
  const t = translations.publicView;

  const statusConfig = {
    ACTIVE: { label: translations.statusBadge.ACTIVE, classes: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-none animate-pulse" },
    PAUSED: { label: translations.statusBadge.PAUSED, classes: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-none" },
    DONE:   { label: translations.statusBadge.DONE, classes: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-none" },
    ARCHIVED: { label: translations.statusBadge.ARCHIVED, classes: "bg-muted text-muted-foreground border-none" }
  };
  
  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ARCHIVED;
  const logo = project.artisan.logoUrl || project.artisan.image;

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <ClientTracker token={token} />
      <header className="bg-background/80 backdrop-blur-xl border-b sticky top-0 z-10 px-4 md:px-6 h-16 flex items-center shadow-sm">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={logo} 
                alt="Logo" 
                className="h-8 w-8 rounded-lg object-cover border border-primary/15 shadow-sm" 
              />
            ) : (
              <div className="h-8 w-8 rounded-lg icon-primary flex items-center justify-center font-bold text-sm">
                {project.artisan.companyName ? project.artisan.companyName[0] : project.artisan.name?.[0]}
              </div>
            )}
            <span className="font-semibold text-sm tracking-tight">{project.artisan.companyName || project.artisan.name}</span>
          </div>
          <Badge className={cn("px-2.5 py-0.5", status.classes)} variant="outline">
            {status.label}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 mt-6">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg icon-blue flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium text-foreground/80">{project.address}</span>
            </div>
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg icon-green flex items-center justify-center shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground/80">
                  {project.startDate ? formatDate(project.startDate, defaultLocale) : translations.overview.undefined}
                  {" - "}
                  {project.endDate ? formatDate(project.endDate, defaultLocale) : translations.overview.undefined}
                </span>
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <div className="animate-slide-up animate-stagger-1 text-sm text-foreground/80 bg-muted/40 p-5 rounded-2xl leading-relaxed border border-border/50">
            {project.description}
          </div>
        )}

        <div className="space-y-5 animate-slide-up animate-stagger-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl icon-violet flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </div>
            {translations.tabs.photos} ({project._count.photos})
          </h2>

          {project.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.photos.map((photo: any) => (
                <div key={photo.id} className="relative aspect-square group overflow-hidden rounded-2xl bg-muted border border-border/50 shadow-sm animate-scale-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.note || "Photo"}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                    <p className="text-white text-[11px] font-medium tracking-wide uppercase">
                      {formatDate(photo.takenAt, defaultLocale)}
                    </p>
                    {photo.note && (
                      <p className="text-white/90 text-sm mt-0.5 truncate font-medium">{photo.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/20 shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 rounded-2xl icon-violet flex items-center justify-center mb-4 opacity-50">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">{t.noPhotosTitle}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {t.noPhotosDesc}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="text-center py-12 text-sm text-muted-foreground animate-slide-up animate-stagger-3">
        {t.poweredBy}
      </footer>
    </div>
  );
}
