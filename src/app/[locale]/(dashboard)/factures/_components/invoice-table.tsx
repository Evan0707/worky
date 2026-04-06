"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency, formatDate } from "@/lib/i18n-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MoreHorizontal, Trash2, Send, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type InvoiceRow = RouterOutputs["invoice"]["list"][number];

// Controlled delete dialog — needed because trigger is inside DropdownMenu
function InvoiceActionsCell({ invoice }: { invoice: InvoiceRow }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();
  const t = useTranslations("common");
  const tInvoices = useTranslations("invoices");

  const deleteMutation = api.invoice.delete.useMutation({
    onSuccess: () => {
      toast.success(tInvoices("toasts.deleted"));
      utils.invoice.list.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendToPDPMutation = api.invoice.sendToPDP.useMutation({
    onSuccess: () => {
      toast.success("Facture envoyée avec succès via PDP");
      utils.invoice.list.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendReminderMutation = api.invoice.sendReminder.useMutation({
    onSuccess: () => toast.success(tInvoices("reminder.sent")),
    onError: (err) => toast.error(err.message),
  });

  const generateFacturX = async () => {
    toast.loading(t("status.loading"), { id: "facturx" });
    try {
      const res = await fetch("/api/invoice/facturx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      const { pdfBase64 } = await res.json();
      const a = document.createElement("a");
      a.href = `data:application/pdf;base64,${pdfBase64}`;
      a.download = `${invoice.number}.pdf`;
      a.click();
      toast.success(tInvoices("toasts.generated"), { id: "facturx" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur", { id: "facturx" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {invoice.status === "DRAFT" && (
            <DropdownMenuItem
              onClick={() =>
                toast.promise(sendToPDPMutation.mutateAsync({ id: invoice.id }), {
                  loading: "Envoi à la PDP en cours...",
                  success: "Facture expédiée !",
                  error: "Erreur lors de l'envoi PDP",
                })
              }
              disabled={sendToPDPMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4 text-primary" />
              Envoyer (PDP)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={generateFacturX}>
            <FileText className="mr-2 h-4 w-4" />
            {tInvoices("actions.generate")}
          </DropdownMenuItem>
          {["SENT", "OVERDUE"].includes(invoice.status) && invoice.type === "INVOICE" && (
            <DropdownMenuItem
              onClick={() => sendReminderMutation.mutate({ id: invoice.id })}
              disabled={sendReminderMutation.isPending}
            >
              <Bell className="mr-2 h-4 w-4 text-orange-500" />
              {tInvoices("actions.sendReminder")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("buttons.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tInvoices("form.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {invoice.number}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => deleteMutation.mutate({ id: invoice.id })}
            >
              {t("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function InvoiceTable({ data, locale, fullHeight = false, actionButton }: { data: InvoiceRow[]; locale: string; fullHeight?: boolean; actionButton?: React.ReactNode }) {
  const t = useTranslations("common");
  const tInvoices = useTranslations("invoices");

  const columns: ColumnDef<InvoiceRow>[] = [
    {
      accessorKey: "number",
      header: tInvoices("fields.number"),
      cell: ({ row }) => (
        <span className="font-medium text-primary cursor-pointer hover:underline">
          {row.getValue("number")}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: tInvoices("fields.type"),
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant="outline" className="bg-muted">
            {type === "INVOICE" ? tInvoices("type.INVOICE") : tInvoices("type.QUOTE")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "project.name",
      header: t("nav.projects"),
    },
    {
      accessorKey: "status",
      header: tInvoices("fields.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        switch (status) {
          case "DRAFT": variant = "secondary"; break;
          case "SENT": variant = "default"; break;
          case "ACCEPTED":
          case "PAID": variant = "default"; break;
          case "REFUSED":
          case "OVERDUE": variant = "destructive"; break;
        }
        const translatedStatus = tInvoices(`status.${status}` as Parameters<typeof tInvoices>[0]) || status;
        return <Badge variant={variant}>{translatedStatus}</Badge>;
      },
    },
    {
      accessorKey: "totalTTC",
      header: tInvoices("fields.totalTTC"),
      cell: ({ row }) => {
        const amount = row.getValue("totalTTC") as number;
        const currency = row.original.currency;
        return <div className="font-medium">{formatCurrency(amount, currency, locale)}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: tInvoices("fields.issuedAt"),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return formatDate(date, locale);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <InvoiceActionsCell invoice={row.original} />,
    },
  ];

  return <DataTable columns={columns} data={data} fullHeight={fullHeight} actionButton={actionButton} />;
}
