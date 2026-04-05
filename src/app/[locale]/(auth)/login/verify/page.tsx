import { Card, CardContent } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function VerifyRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.verify" });

  return (
    <Card className="w-full max-w-md mx-auto shadow-none sm:shadow-lg border-none sm:border">
      <CardContent className="pt-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("description")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}