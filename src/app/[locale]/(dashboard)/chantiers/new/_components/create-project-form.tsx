"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateProjectForm({ locale }: { locale: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const router = useRouter();

  // On valide uniquement les champs minimums (pas de date de fin par défaut)
  const formSchema = z.object({
    name: z.string().min(1, "Requis").max(200),
    address: z.string().min(1, "Requis").max(500),
    clientName: z.string().min(1, "Requis").max(200),
    clientPhone: z.string().optional(),
    clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),
    description: z.string().max(2000).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      description: "",
    },
  });

  const utils = api.useUtils();
  const createMutation = api.project.create.useMutation({
    onSuccess: (data) => {
      toast.success(t("toasts.created"));
      utils.project.list.invalidate();
      router.push(`/${locale}/chantiers/${data.id}`);
    },
    onError: (error) => {
      // Afficher l'erreur tRPC si on dépasse la limite FREE par exemple
      toast.error(error.message || tCommon("errors.unexpected"));
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Si l'email est vide, ne pas envoyer de string vide pour passer la validation backend
    createMutation.mutate({
      ...values,
      clientEmail: values.clientEmail || undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t("fields.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.name")} {...field} className="bg-muted/30 focus-visible:bg-background h-10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t("fields.address")}</FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.address")} {...field} className="bg-muted/30 focus-visible:bg-background h-10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-5 pt-2">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">{t("fields.clientName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("placeholders.clientName")} {...field} className="bg-muted/30 focus-visible:bg-background h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">{t("fields.clientPhone")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("placeholders.clientPhone")} {...field} className="bg-muted/30 focus-visible:bg-background h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t("fields.clientEmail")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t("placeholders.clientEmail")} {...field} className="bg-muted/30 focus-visible:bg-background h-10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end">
          <Button 
            type="submit" 
            disabled={createMutation.isPending}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("new.title")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
