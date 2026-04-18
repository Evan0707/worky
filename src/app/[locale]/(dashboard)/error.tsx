"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive/60" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("error.title")}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{t("error.description")}</p>
      </div>
      <Button onClick={reset} variant="outline">
        {t("error.retry")}
      </Button>
    </div>
  );
}
