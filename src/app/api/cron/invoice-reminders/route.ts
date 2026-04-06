import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { InvoiceReminderEmail } from "../../../../../emails/invoice-reminder";
import { formatCurrency, formatDate } from "@/lib/i18n-helpers";
import { env } from "@/env";

// Vercel Cron: runs daily at 08:00 UTC (see vercel.json)
// Sends automatic reminders for invoices that are:
//   - SENT and 7 days past dueAt with no reminder yet
//   - SENT and 14+ days past dueAt (second reminder)
//   - OVERDUE with no reminder in the last 7 days

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  // In dev you can call it manually with ADMIN_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? env.ADMIN_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { sent: 0, skipped: 0, errors: 0 };

  // Find all SENT or OVERDUE invoices with a dueAt in the past and a clientEmail
  const invoices = await db.invoice.findMany({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
      type: "INVOICE",
      dueAt: { lt: now },
      project: { clientEmail: { not: null } },
    },
    include: {
      project: {
        select: { clientName: true, clientEmail: true, artisanId: true },
      },
    },
  });

  for (const invoice of invoices) {
    if (!invoice.project.clientEmail) { results.skipped++; continue; }

    const daysOverdue = Math.floor((now.getTime() - invoice.dueAt!.getTime()) / 86_400_000);

    // Determine if we should send: day 7, day 14, day 21, then weekly
    const shouldSendOnDay = [7, 14, 21].includes(daysOverdue) || (daysOverdue > 21 && daysOverdue % 7 === 0);
    if (!shouldSendOnDay) { results.skipped++; continue; }

    // Check we haven't already sent a reminder today
    const alreadySentToday = invoice.remindersSentAt.some(
      (d) => Math.abs(d.getTime() - now.getTime()) < 86_400_000
    );
    if (alreadySentToday) { results.skipped++; continue; }

    try {
      const artisan = await db.user.findUnique({
        where: { id: invoice.project.artisanId },
        select: { name: true, email: true, locale: true, currency: true },
      });

      const locale = (invoice.locale ?? artisan?.locale ?? "fr-FR") as "fr-FR" | "en-GB" | "de-DE" | "es-ES";
      const host = new URL(env.NEXT_PUBLIC_APP_URL).host;
      const totalTTC = formatCurrency(invoice.totalTTC, invoice.currency, locale);
      const dueDate = invoice.dueAt ? formatDate(invoice.dueAt, locale) : "";

      const subjectTemplates: Record<string, string> = {
        "fr-FR": `Rappel : facture ${invoice.number} en attente de règlement`,
        "en-GB": `Reminder: invoice ${invoice.number} awaiting payment`,
        "de-DE": `Erinnerung: Rechnung ${invoice.number} wartet auf Bezahlung`,
        "es-ES": `Recordatorio: factura ${invoice.number} pendiente de pago`,
      };

      const html = await render(
        InvoiceReminderEmail({
          clientName: invoice.project.clientName ?? "Client",
          artisanName: artisan?.name ?? artisan?.email ?? "OpenChantier",
          invoiceNumber: invoice.number,
          totalTTC,
          dueDate,
          daysOverdue,
          invoiceUrl: `${env.NEXT_PUBLIC_APP_URL}/${locale}/factures`,
          host,
          locale,
        })
      );

      await resend.emails.send({
        from: env.AUTH_EMAIL_FROM,
        to: invoice.project.clientEmail,
        subject: subjectTemplates[locale] ?? subjectTemplates["fr-FR"]!,
        html,
      });

      // Mark status as OVERDUE if past 7 days
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          remindersSentAt: { push: now },
          ...(daysOverdue >= 7 && invoice.status === "SENT" ? { status: "OVERDUE" } : {}),
        },
      });

      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results, checkedAt: now.toISOString() });
}
