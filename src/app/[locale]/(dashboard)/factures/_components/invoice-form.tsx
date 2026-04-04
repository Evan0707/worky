"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/i18n-helpers";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  projectId: z.string().min(1, "Veuillez sélectionner un chantier"),
  type: z.enum(["QUOTE", "INVOICE"]),
  lines: z
    .array(
      z.object({
        label: z.string().min(1, "La désignation est requise"),
        quantity: z.coerce.number().min(0.01),
        unitPrice: z.coerce.number().min(0), // in EUR
        vatRate: z.coerce.number().min(0),
      })
    )
    .min(1, "Ajoutez au moins une ligne"),
});

type FormValues = z.infer<typeof formSchema>;

export function InvoiceForm({ projects, locale }: { projects: any[]; locale: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const t = useTranslations("invoices");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      type: "INVOICE",
      lines: [{ label: "", quantity: 1, unitPrice: 0, vatRate: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  const generateMutation = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.created"));
      utils.invoice.list.invalidate();
      router.push(`/${locale}/factures`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Convert unitPrice from EUR float to cents integer
    const linesInCents = values.lines.map((l) => ({
      ...l,
      unitPrice: Math.round(l.unitPrice * 100),
    }));

    generateMutation.mutate({
      ...values,
      lines: linesInCents,
    });
  };

  const watchLines = form.watch("lines");
  
  // Calculate Totals live
  let totalHT = 0;
  let totalTVA = 0;
  watchLines.forEach((line) => {
    const ht = line.quantity * (line.unitPrice || 0);
    const tva = ht * ((line.vatRate || 0) / 100);
    totalHT += ht;
    totalTVA += tva;
  });

  const totalTTC = totalHT + totalTVA;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.project")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={t("form.selectProject")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.clientName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.docType")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INVOICE">{t("type.INVOICE")}</SelectItem>
                    <SelectItem value="QUOTE">{t("type.QUOTE")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="border-primary/10 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{t("form.lines")} ({fields.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ label: "", quantity: 1, unitPrice: 0, vatRate: 20 })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> {t("form.addLine")}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
                <div className="col-span-12 md:col-span-5">{t("form.designation")}</div>
                <div className="col-span-12 md:col-span-2">{t("form.quantity")}</div>
                <div className="col-span-12 md:col-span-2">{t("form.priceHT")}</div>
                <div className="col-span-12 md:col-span-2">{t("form.vatRate")}</div>
                <div className="col-span-12 md:col-span-1"></div>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-4 items-start bg-muted/20 p-4 md:p-2 rounded-lg"
                >
                  <div className="col-span-12 md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t("form.placeholderLabel")} {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.vatRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end md:mt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t pt-6 flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("fields.totalHT")}</span>
                  <span>{formatCurrency(totalHT * 100, "EUR", locale)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("fields.totalTVA")}</span>
                  <span>{formatCurrency(totalTVA * 100, "EUR", locale)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>{t("fields.totalTTC")}</span>
                  <span className="text-primary">{formatCurrency(totalTTC * 100, "EUR", locale)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={generateMutation.isPending}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" size="lg" disabled={generateMutation.isPending}>
            {generateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("form.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
