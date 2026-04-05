import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ErrorPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ error?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth.error" });

  return (
    <Card className="w-full max-w-md mx-auto shadow-none sm:shadow-lg border-none sm:border border-destructive/20">
      <CardContent className="pt-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-destructive">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
            {error ? error : t("defaultError")}
          </p>

          <Button asChild className="w-full mt-4" variant="outline">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}