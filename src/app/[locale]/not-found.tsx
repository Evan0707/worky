import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { HardHat } from "lucide-react";
import Link from "next/link";

export default async function NotFound() {
  let t: Awaited<ReturnType<typeof getTranslations>>;
  try {
    t = await getTranslations("common");
  } catch {
    // Fallback si le locale n'est pas disponible
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
        <div className="rounded-2xl bg-muted/60 p-6">
          <HardHat className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">404</h1>
          <p className="text-muted-foreground">Page introuvable</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      {/* Illustration minimaliste — panneau de chantier */}
      <div className="relative">
        <div className="rounded-2xl bg-amber-500/10 p-6 border-2 border-amber-500/20">
          <HardHat className="h-12 w-12 text-amber-600/70" />
        </div>
        <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-white text-sm font-bold shadow">
          ?
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-lg font-medium">{t("notFound.title")}</p>
        <p className="text-sm text-muted-foreground">{t("notFound.description")}</p>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">{t("notFound.backHome")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}
