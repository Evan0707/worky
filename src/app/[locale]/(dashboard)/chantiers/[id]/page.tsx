import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { formatDate } from "@/lib/i18n-helpers";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Link as LinkIcon,
  PenTool,
  CheckCircle2,
} from "lucide-react";
import { ShareProjectButton } from "./_components/share-project-button";
import { AddressNavigationButton } from "./_components/address-navigation-button";
import { ClientSignatureDialog } from "./_components/client-signature-dialog";
import { NextStepsEditor } from "./_components/next-steps-editor";

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

  const initials = project.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const signature = project.clientActions.find((a) => a.type === "SIGNATURE");

  return (
    <div className="space-y-4">

      {/* ── Top strip — adresse + dates ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground/80">{project.address}</span>
        </div>
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {project.startDate ? formatDate(project.startDate, locale) : "—"}
              {" → "}
              {project.endDate ? formatDate(project.endDate, locale) : "—"}
            </span>
          </div>
        )}
        <AddressNavigationButton address={project.address} />
      </div>

      {/* ── Description (optional) ───────────────────────────────── */}
      {project.description && (
        <p className="px-1 text-sm text-foreground/70 leading-relaxed max-w-2xl">
          {project.description}
        </p>
      )}

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left — Next Steps (2/3) */}
        <div className="lg:col-span-2">
          <NextStepsEditor
            projectId={project.id}
            initialSteps={(project.nextSteps as { text: string; done: boolean }[] | null) ?? []}
            translations={{
              title: tProjects("nextSteps.title"),
              placeholder: tProjects("nextSteps.placeholder"),
              saveSuccess: tProjects("nextSteps.saveSuccess"),
            }}
          />
        </div>

        {/* Right sidebar (1/3) */}
        <div className="space-y-4">

          {/* Client */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {tProjects("overview.client")}
            </p>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border text-xs font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{project.clientName}</p>
                {project.clientEmail && (
                  <p className="text-xs text-muted-foreground truncate">{project.clientEmail}</p>
                )}
              </div>
            </div>
            {(project.clientEmail || project.clientPhone) && (
              <div className="flex flex-col gap-1.5 pt-2.5 border-t border-border/50">
                {project.clientEmail && (
                  <a
                    href={`mailto:${project.clientEmail}`}
                    className="inline-flex items-center gap-2 text-sm py-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{project.clientEmail}</span>
                  </a>
                )}
                {project.clientPhone && (
                  <a
                    href={`tel:${project.clientPhone}`}
                    className="inline-flex items-center gap-2 text-sm py-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{project.clientPhone}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-semibold">{tProjects("share.title")}</p>
            </div>
            <div className="bg-muted/60 rounded-lg px-3 py-2 border border-border/50">
              <code className="text-xs text-muted-foreground truncate block font-mono">
                {publicUrl}
              </code>
            </div>
            <ShareProjectButton url={publicUrl} projectId={project.id} />
          </div>

          {/* Signature */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <PenTool className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-semibold">{tProjects("clientAction.signatureTitle")}</p>
            </div>
            {signature ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tProjects("clientAction.alreadySigned")}
                </div>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-neutral-900 relative w-full h-32">
                  <Image
                    src={(signature.payload as { signature?: string } | null)?.signature ?? ""}
                    alt={tProjects("clientAction.signatureImageAlt")}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tProjects("clientAction.signatureDesc")}
                </p>
                <ClientSignatureDialog
                  projectId={project.id}
                  clientName={project.clientName}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
