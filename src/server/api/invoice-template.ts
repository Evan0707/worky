import React from "react";
import { formatCurrency, formatDate } from "@/lib/i18n-helpers";

// A basic HTML invoice template optimized for WeasyPrint
export function renderInvoiceHtml(
  invoice: any,
  artisan: any,
  project: any,
  locale: string
) {
  const { lines, totalHT, totalTVA, totalTTC, currency, number, type } = invoice;

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
          color: #1A4F8A; /* Primary brand color */
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
          <strong>Client</strong><br/>
          ${project.clientName}<br/>
          ${project.address}
        </div>
      </div>

      <div class="invoice-title">
        ${type === "INVOICE" ? "Facture" : "Devis"} ${number}
      </div>

      <div class="invoice-meta">
        <div>
          <strong>Date d'émission</strong><br/>
          ${formatDate(new Date(), locale)}
        </div>
        <div>
          <strong>Chantier</strong><br/>
          ${project.name}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Désignation</th>
            <th class="text-right">Qté</th>
            <th class="text-right">Prix Unitaire HT</th>
            <th class="text-right">TVA</th>
            <th class="text-right">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((line: any) => `
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
            <td>Total HT</td>
            <td class="text-right">${formatCurrency(totalHT, currency, locale)}</td>
          </tr>
          <tr>
            <td>TVA</td>
            <td class="text-right">${formatCurrency(totalTVA, currency, locale)}</td>
          </tr>
          <tr>
            <td class="grand-total">Total TTC</td>
            <td class="grand-total text-right">${formatCurrency(totalTTC, currency, locale)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>Merci pour votre confiance.</p>
        <p>Règlement par virement bancaire : IBAN ${artisan.iban || "Non renseigné"}</p>
      </div>
    </body>
    </html>
  `;
}
