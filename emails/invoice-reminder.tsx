import { Button, Preview, Section, Text, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";

type Locale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

interface InvoiceReminderEmailProps {
  clientName: string;
  artisanName: string;
  invoiceNumber: string;
  totalTTC: string;
  dueDate: string;
  daysOverdue?: number;
  invoiceUrl: string;
  host: string;
  locale?: Locale;
}

const translations: Record<
  Locale,
  {
    preview: string;
    heading: string;
    body: string;
    bodyOverdue: string;
    labelInvoice: string;
    labelAmount: string;
    labelDue: string;
    labelOverdue: string;
    button: string;
    footer: string;
  }
> = {
  "fr-FR": {
    preview: "Rappel : votre facture est en attente de règlement",
    heading: "Rappel de paiement",
    body: "Bonjour {clientName}, sauf erreur de votre part, la facture n° {invoiceNumber} émise par {artisanName} est toujours en attente de règlement.",
    bodyOverdue: "Bonjour {clientName}, la facture n° {invoiceNumber} émise par {artisanName} est arrivée à échéance il y a {daysOverdue} jour(s). Merci de procéder au règlement dans les meilleurs délais.",
    labelInvoice: "Facture n°",
    labelAmount: "Montant TTC",
    labelDue: "Échéance",
    labelOverdue: "Retard",
    button: "Voir la facture",
    footer: "Rappel envoyé depuis",
  },
  "en-GB": {
    preview: "Reminder: your invoice is awaiting payment",
    heading: "Payment reminder",
    body: "Hello {clientName}, unless this has already been settled, invoice n° {invoiceNumber} issued by {artisanName} is still awaiting payment.",
    bodyOverdue: "Hello {clientName}, invoice n° {invoiceNumber} issued by {artisanName} is now {daysOverdue} day(s) overdue. Please arrange payment at your earliest convenience.",
    labelInvoice: "Invoice n°",
    labelAmount: "Total incl. VAT",
    labelDue: "Due date",
    labelOverdue: "Overdue by",
    button: "View invoice",
    footer: "Reminder sent from",
  },
  "de-DE": {
    preview: "Erinnerung: Ihre Rechnung wartet auf Bezahlung",
    heading: "Zahlungserinnerung",
    body: "Hallo {clientName}, sofern die Zahlung noch nicht erfolgt ist, steht die Rechnung Nr. {invoiceNumber} von {artisanName} noch aus.",
    bodyOverdue: "Hallo {clientName}, die Rechnung Nr. {invoiceNumber} von {artisanName} ist seit {daysOverdue} Tag(en) überfällig. Bitte veranlassen Sie die Zahlung so bald wie möglich.",
    labelInvoice: "Rechnung Nr.",
    labelAmount: "Gesamtbetrag inkl. MwSt.",
    labelDue: "Fälligkeitsdatum",
    labelOverdue: "Verzug",
    button: "Rechnung anzeigen",
    footer: "Erinnerung gesendet von",
  },
  "es-ES": {
    preview: "Recordatorio: su factura está pendiente de pago",
    heading: "Recordatorio de pago",
    body: "Hola {clientName}, salvo que ya haya efectuado el pago, la factura n.° {invoiceNumber} emitida por {artisanName} sigue pendiente de abono.",
    bodyOverdue: "Hola {clientName}, la factura n.° {invoiceNumber} emitida por {artisanName} lleva {daysOverdue} día(s) de retraso. Le rogamos que realice el pago a la mayor brevedad.",
    labelInvoice: "Factura n.°",
    labelAmount: "Total con IVA",
    labelDue: "Vencimiento",
    labelOverdue: "Retraso",
    button: "Ver factura",
    footer: "Recordatorio enviado desde",
  },
};

export function InvoiceReminderEmail({
  clientName,
  artisanName,
  invoiceNumber,
  totalTTC,
  dueDate,
  daysOverdue,
  invoiceUrl,
  host,
  locale = "fr-FR",
}: InvoiceReminderEmailProps) {
  const t = translations[locale] ?? translations["fr-FR"];
  const lang = locale.split("-")[0];
  const isOverdue = daysOverdue !== undefined && daysOverdue > 0;

  const bodyTemplate = isOverdue ? t.bodyOverdue : t.body;
  const bodyText = bodyTemplate
    .replace("{clientName}", clientName)
    .replace("{invoiceNumber}", invoiceNumber)
    .replace("{artisanName}", artisanName)
    .replace("{daysOverdue}", String(daysOverdue ?? 0));

  return (
    <EmailLayout lang={lang} host={host} footerText={t.footer}>
      <Preview>{t.preview}</Preview>

      {/* Urgency badge */}
      <Section style={styles.badgeContainer}>
        <Text style={styles.badge}>⚠ {t.heading}</Text>
      </Section>

      <Text style={styles.body}>{bodyText}</Text>

      {/* Summary block */}
      <Section style={styles.summaryBox}>
        <Row style={styles.summaryRow}>
          <Column style={styles.summaryLabel}>
            <Text style={styles.summaryLabelText}>{t.labelInvoice}</Text>
          </Column>
          <Column style={styles.summaryValue}>
            <Text style={styles.summaryValueText}>{invoiceNumber}</Text>
          </Column>
        </Row>
        <Row style={styles.summaryRow}>
          <Column style={styles.summaryLabel}>
            <Text style={styles.summaryLabelText}>{t.labelAmount}</Text>
          </Column>
          <Column style={styles.summaryValue}>
            <Text style={{ ...styles.summaryValueText, fontWeight: "700" }}>{totalTTC}</Text>
          </Column>
        </Row>
        <Row style={styles.summaryRow}>
          <Column style={styles.summaryLabel}>
            <Text style={styles.summaryLabelText}>{isOverdue ? t.labelOverdue : t.labelDue}</Text>
          </Column>
          <Column style={styles.summaryValue}>
            <Text style={{
              ...styles.summaryValueText,
              color: isOverdue ? "#dc2626" : "#0a0a0a",
              fontWeight: isOverdue ? "700" : "400",
            }}>
              {isOverdue ? `${daysOverdue} j.` : dueDate}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={styles.buttonContainer}>
        <Button style={styles.button} href={invoiceUrl}>
          {t.button}
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default InvoiceReminderEmail;

const styles = {
  badgeContainer: {
    marginBottom: "16px",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "6px",
    color: "#c2410c",
    fontSize: "13px",
    fontWeight: "600",
    padding: "6px 12px",
    margin: "0",
  },
  body: {
    fontSize: "15px",
    color: "#444",
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  summaryBox: {
    backgroundColor: "#fff7ed",
    borderRadius: "8px",
    border: "1px solid #fed7aa",
    padding: "16px 20px",
    marginBottom: "28px",
  },
  summaryRow: {
    marginBottom: "8px",
  },
  summaryLabel: {
    width: "50%",
  },
  summaryValue: {
    width: "50%",
  },
  summaryLabelText: {
    fontSize: "13px",
    color: "#999",
    margin: "0",
    lineHeight: "1.4",
  },
  summaryValueText: {
    fontSize: "14px",
    color: "#0a0a0a",
    margin: "0",
    lineHeight: "1.4",
    textAlign: "right" as const,
  },
  buttonContainer: {
    margin: "0",
  },
  button: {
    backgroundColor: "#c2410c",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
    padding: "13px 28px",
    letterSpacing: "-0.1px",
  },
};
