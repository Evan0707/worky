import { formatCurrency, formatDate } from "@/lib/i18n-helpers";

type InvoiceLocale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

const invoiceStrings: Record<
  InvoiceLocale,
  {
    invoice: string;
    quote: string;
    issueDate: string;
    project: string;
    designation: string;
    qty: string;
    unitPriceHT: string;
    vat: string;
    totalHT: string;
    totalHTLabel: string;
    vatLabel: string;
    totalTTC: string;
    thanks: string;
    bankTransfer: string;
    client: string;
  }
> = {
  "fr-FR": {
    invoice: "Facture",
    quote: "Devis",
    issueDate: "Date d'émission",
    project: "Chantier",
    designation: "Désignation",
    qty: "Qté",
    unitPriceHT: "Prix Unitaire HT",
    vat: "TVA",
    totalHT: "Total HT",
    totalHTLabel: "Total HT",
    vatLabel: "TVA",
    totalTTC: "Total TTC",
    thanks: "Merci pour votre confiance.",
    bankTransfer: "Règlement par virement bancaire : IBAN",
    client: "Client",
  },
  "en-GB": {
    invoice: "Invoice",
    quote: "Quote",
    issueDate: "Issue date",
    project: "Project",
    designation: "Description",
    qty: "Qty",
    unitPriceHT: "Unit price (excl. VAT)",
    vat: "VAT",
    totalHT: "Total (excl. VAT)",
    totalHTLabel: "Subtotal",
    vatLabel: "VAT",
    totalTTC: "Total (incl. VAT)",
    thanks: "Thank you for your business.",
    bankTransfer: "Payment by bank transfer: IBAN",
    client: "Client",
  },
  "de-DE": {
    invoice: "Rechnung",
    quote: "Angebot",
    issueDate: "Ausstellungsdatum",
    project: "Baustelle",
    designation: "Beschreibung",
    qty: "Menge",
    unitPriceHT: "Einzelpreis (netto)",
    vat: "MwSt.",
    totalHT: "Nettobetrag",
    totalHTLabel: "Nettobetrag",
    vatLabel: "MwSt.",
    totalTTC: "Bruttobetrag",
    thanks: "Vielen Dank für Ihr Vertrauen.",
    bankTransfer: "Zahlung per Banküberweisung: IBAN",
    client: "Kunde",
  },
  "es-ES": {
    invoice: "Factura",
    quote: "Presupuesto",
    issueDate: "Fecha de emisión",
    project: "Obra",
    designation: "Descripción",
    qty: "Cant.",
    unitPriceHT: "Precio unitario (sin IVA)",
    vat: "IVA",
    totalHT: "Total sin IVA",
    totalHTLabel: "Base imponible",
    vatLabel: "IVA",
    totalTTC: "Total con IVA",
    thanks: "Gracias por su confianza.",
    bankTransfer: "Pago por transferencia bancaria: IBAN",
    client: "Cliente",
  },
};

interface InvoiceLine {
  label: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface InvoiceData {
  lines: InvoiceLine[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  currency: string;
  number: string;
  type: string;
  issuedAt?: Date | null;
}

interface ArtisanData {
  name?: string | null;
  email?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
  iban?: string | null;
  logoUrl?: string | null;
  currency?: string;
  locale?: string;
}

interface ProjectData {
  name: string;
  address: string;
  clientName: string;
}

// A basic HTML invoice template optimized for WeasyPrint
export function renderInvoiceHtml(
  invoice: InvoiceData,
  artisan: ArtisanData,
  project: ProjectData,
  locale: string
) {
  const { lines, totalHT, totalTVA, totalTTC, currency, number, type } = invoice;
  const s = invoiceStrings[(locale as InvoiceLocale)] ?? invoiceStrings["fr-FR"];

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .artisan-info {
          font-size: 16px;
        }
        .artisan-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #0a0a0a;
        }
        .client-info {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          width: 300px;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          margin: 40px 0 20px 0;
          text-transform: uppercase;
          color: #0f172a;
        }
        .invoice-meta {
          display: flex;
          gap: 40px;
          margin-bottom: 40px;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 600;
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #cbd5e1;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        .text-right {
          text-align: right;
        }
        .totals-container {
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
        }
        .totals-table td {
          border: none;
          padding: 8px 12px;
        }
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #0f172a;
          border-top: 2px solid #0f172a !important;
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 60px;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="artisan-info">
          <div class="artisan-name">${artisan.companyName || artisan.name}</div>
          <div>${artisan.companyAddress || ""}</div>
          <div>SIRET: ${artisan.siret || ""}</div>
          <div>TVA: ${artisan.vatNumber || ""}</div>
        </div>
        <div class="client-info">
          <strong>${s.client}</strong><br/>
          ${project.clientName}<br/>
          ${project.address}
        </div>
      </div>

      <div class="invoice-title">
        ${type === "INVOICE" ? s.invoice : s.quote} ${number}
      </div>

      <div class="invoice-meta">
        <div>
          <strong>${s.issueDate}</strong><br/>
          ${formatDate(new Date(), locale)}
        </div>
        <div>
          <strong>${s.project}</strong><br/>
          ${project.name}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${s.designation}</th>
            <th class="text-right">${s.qty}</th>
            <th class="text-right">${s.unitPriceHT}</th>
            <th class="text-right">${s.vat}</th>
            <th class="text-right">${s.totalHT}</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((line) => `
            <tr>
              <td>${line.label}</td>
              <td class="text-right">${line.quantity}</td>
              <td class="text-right">${formatCurrency(line.unitPrice, currency, locale)}</td>
              <td class="text-right">${line.vatRate}%</td>
              <td class="text-right">${formatCurrency(Math.round(line.quantity * line.unitPrice), currency, locale)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-container">
        <table class="totals-table">
          <tr>
            <td>${s.totalHTLabel}</td>
            <td class="text-right">${formatCurrency(totalHT, currency, locale)}</td>
          </tr>
          <tr>
            <td>${s.vatLabel}</td>
            <td class="text-right">${formatCurrency(totalTVA, currency, locale)}</td>
          </tr>
          <tr>
            <td class="grand-total">${s.totalTTC}</td>
            <td class="grand-total text-right">${formatCurrency(totalTTC, currency, locale)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>${s.thanks}</p>
        <p>${s.bankTransfer} ${artisan.iban || "—"}</p>
      </div>
    </body>
    </html>
  `;
}
