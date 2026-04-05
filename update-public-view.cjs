const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'c', '[token]', 'page.tsx');

const pageContent = `import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/i18n-helpers";
import { db } from "@/server/db";
import { 
  Building2, 
  MapPin, 
  Clock, 
  ImageOff, 
  CheckCircle2, 
  Circle 
} from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 1. Fetch project with limited public fields (CDC requirement)
  const project = await db.project.findUnique({
    where: { shareToken: token },
    include: {
      artisan: {
        select: {
          companyName: true,
          logoUrl: true,
        },
      },
      photos: {
        where: { isShared: true },
        orderBy: { takenAt: "desc" },
      },
      invoices: {
        where: { status: { not: "DRAFT" } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 2. Determine locale from browser Accept-Language header or project DB fallback
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  
  const browserLocale = acceptLanguage.includes("en") 
    ? "en-GB" 
    : acceptLanguage.includes("de") 
    ? "de-DE" 
    : acceptLanguage.includes("es") 
    ? "es-ES" 
    : "fr-FR";

  const locale = project?.clientLocale || browserLocale;

  // 3. Load dictionary
  let translations;
  try {
    translations = (await import(\`@/i18n/locales/\${locale}/projects.json\`)).default;
  } catch (err) {
    // Fallback if the specific JSON isn't available
    translations = (await import(\`@/i18n/locales/fr-FR/projects.json\`)).default;
  }

  // 4. Handle invalid/archived link
  if (!project || project.status === "ARCHIVED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30 p-4">
        <h1 className="text-2xl font-bold mb-2">
          {translations.publicView?.invalidLinkTitle || "Lien invalide ou expiré"}
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          {translations.publicView?.invalidLinkDesc || "Ce chantier n'est plus partagé ou le lien n'est plus valide."}
        </p>
      </div>
    );
  }

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; bg: string; text: string }> = {
      ACTIVE: { 
        label: translations.statusBadge?.ACTIVE || "En cours", 
        bg: "bg-blue-100", 
        text: "text-blue-700" 
      },
      PAUSED: { 
        label: translations.statusBadge?.PAUSED || "En pause", 
        bg: "bg-amber-100", 
        text: "text-amber-700" 
      },
      DONE: { 
        label: translations.statusBadge?.DONE || "Terminé", 
        bg: "bg-emerald-100", 
        text: "text-emerald-700" 
      },
    };
    
    const s = statuses[status] || statuses.ACTIVE;
    return (
      <span className={\`px-3 py-1 rounded-full text-sm font-medium \${s.bg} \${s.text}\`}>
        {s.label}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <header className="bg-white border-b px-4 py-4 md:px-8 mb-8 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {project.artisan.logoUrl ? (
              <div className="relative w-10 h-10 rounded-md overflow-hidden border shadow-sm">
                <Image 
                  src={project.artisan.logoUrl} 
                  alt={project.artisan.companyName || "Logo"} 
                  fill 
                  className="object-cover" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border shadow-sm">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold leading-tight">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.artisan.companyName}</p>
            </div>
          </div>
          <div className="hidden sm:block">{getStatusBadge(project.status)}</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        <div className="sm:hidden mb-6">{getStatusBadge(project.status)}</div>

        {/* Overview */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {project.address || translations.overview?.undefined || "Non défini"}
                  </p>
                  <p className="text-sm text-muted-foreground">{project.city}</p>
                </div>
              </div>
              {project.startDate && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm">
                    {formatDate(project.startDate, locale)}
                    {project.estimatedEndDate && \` - \${formatDate(project.estimatedEndDate, locale)}\`}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-4 flex flex-col justify-center">
              <p className="text-sm font-medium mb-2">
                {translations.publicView?.totalProgress || "Avancement total"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all" 
                    style={{ width: \`\${project.progress}%\` }} 
                  />
                </div>
                <span className="text-sm font-bold min-w-[3rem] text-right">{project.progress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {project.nextSteps && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {translations.nextSteps?.title || translations.publicView?.nextStepsTitle || "Prochaines étapes"}
            </h2>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-sm">{project.nextSteps}</p>
            </div>
          </div>
        )}

        {/* Gallery */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageOff className="w-5 h-5" />
            {translations.tabs?.photos || "Galerie Photos"}
          </h2>
          
          {project.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border">
                  <Image 
                    src={photo.url} 
                    alt="Photo" 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105" 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <ImageOff className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium">
                {translations.publicView?.noPhotosTitle || "Aucune photo partagée"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {translations.publicView?.noPhotosDesc || "L'artisan n'a pas encore partagé de photos."}
              </p>
            </div>
          )}
        </div>

        {/* Invoices */}
        {project.invoices.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {translations.publicView?.documentsTitle || "Documents & Facturation"}
            </h2>
            <div className="grid gap-3">
              {project.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(inv.createdAt, locale)}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-bold">
                      {formatCurrency(inv.totalInclVat, "EUR", locale)}
                    </span>
                    {inv.status === "PAID" ? (
                      <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {translations.publicView?.paid || "Payé"}
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        <Circle className="w-3 h-3" />
                        {translations.publicView?.unpaid || "À régler"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center mt-16 text-sm text-muted-foreground pb-8">
        <p>{translations.publicView?.poweredBy || "Propulsé par OpenChantier"}</p>
      </footer>
    </div>
  );
}
`;

fs.writeFileSync(filePath, pageContent, 'utf-8');
console.log('Successfully updated src/app/c/[token]/page.tsx with Accept-Language headers and dynamic translations.');
