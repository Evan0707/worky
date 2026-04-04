"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  siret: z.string().max(14).optional(),
  steuernummer: z.string().max(20).optional(),
  bceNumber: z.string().max(12).optional(),
  vatNumber: z.string().max(20).optional(),
  iban: z.string().max(34).optional(),
  vatScheme: z
    .enum(["STANDARD", "REDUCED", "MICRO_ENTREPRENEUR", "EXEMPT", "REVERSE_CHARGE"])
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BillingForm({
  initialData,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siret: initialData.siret ?? "",
      steuernummer: initialData.steuernummer ?? "",
      bceNumber: initialData.bceNumber ?? "",
      vatNumber: initialData.vatNumber ?? "",
      iban: initialData.iban ?? "",
      vatScheme:
        (initialData.vatScheme as FormValues["vatScheme"]) ?? "STANDARD",
    },
  });

  const updateMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.saved"));
      utils.user.getProfile.invalidate();
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message ?? t("toasts.error"));
    },
  });

  function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Billing & Legal section */}
        <Card className="shadow-none border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">{t("billing.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="vatScheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("billing.vatScheme")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STANDARD">
                        {t("vatSchemes.STANDARD")}
                      </SelectItem>
                      <SelectItem value="REDUCED">
                        {t("vatSchemes.REDUCED")}
                      </SelectItem>
                      <SelectItem value="MICRO_ENTREPRENEUR">
                        {t("vatSchemes.MICRO_ENTREPRENEUR")}
                      </SelectItem>
                      <SelectItem value="EXEMPT">
                        {t("vatSchemes.EXEMPT")}
                      </SelectItem>
                      <SelectItem value="REVERSE_CHARGE">
                        {t("vatSchemes.REVERSE_CHARGE")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="siret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("billing.siret")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={14}
                        className="h-10 bg-muted/30 focus-visible:bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("billing.vatNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-10 bg-muted/30 focus-visible:bg-background uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="steuernummer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("billing.steuernummer")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={20}
                        className="h-10 bg-muted/30 focus-visible:bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("billing.bceNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={12}
                        className="h-10 bg-muted/30 focus-visible:bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("billing.iban")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={34}
                      className="h-10 bg-muted/30 focus-visible:bg-background uppercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={updateMutation.isPending}
            className="min-w-[160px]"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("profile.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
