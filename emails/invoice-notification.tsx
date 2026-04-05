import { Button, Preview, Section, Text, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";

type Locale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

interface InvoiceNotificationEmailProps {
  clientName: string;
  artisanName: string;
  invoiceNumber: string;
  totalTTC: string;
  dueDate: string;
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
    labelInvoice: string;
    labelAmount: string;
    labelDue: string;
    button: string;
    footer: string;
  }
> = {
  "fr-FR": {
    preview: "Vous avez reçu une facture",
    heading: "Votre facture est disponible",
    body: "Bonjour {clientName}, {artisanName} vous a envoyé une facture. Vous pouvez la consulter et la télécharger en cliquant sur le bouton ci-dessous.",
    labelInvoice: "Facture n°",
    labelAmount: "Montant TTC",
    labelDue: "Échéance",
    button: "Voir la facture",
    footer: "Facture envoyée depuis",
  },
  "en-GB": {
    preview: "You have received an invoice",
    heading: "Your invoice is ready",
    body: "Hello {clientName}, {artisanName} has sent you an invoice. You can view and download it by clicking the button below.",
    labelInvoice: "Invoice n°",
    labelAmount: "Total incl. VAT",
    labelDue: "Due date",
    button: "View invoice",
    footer: "Invoice sent from",
  },
  "de-DE": {
    preview: "Sie haben eine Rechnung erhalten",
    heading: "Ihre Rechnung ist bereit",
    body: "Hallo {clientName}, {artisanName} hat Ihnen eine Rechnung gesendet. Sie können sie über den folgenden Button ansehen und herunterladen.",
    labelInvoice: "Rechnung Nr.",
    labelAmount: "Gesamtbetrag inkl. MwSt.",
    labelDue: "Fälligkeitsdatum",
    button: "Rechnung anzeigen",
    footer: "Rechnung gesendet von",
  },
  "es-ES": {
    preview: "Ha recibido una factura",
    heading: "Su factura está lista",
    body: "Hola {clientName}, {artisanName} le ha enviado una factura. Puede verla y descargarla haciendo clic en el botón de abajo.",
    labelInvoice: "Factura n.°",
    labelAmount: "Total con IVA",
    labelDue: "Vencimiento",
    button: "Ver factura",
    footer: "Factura enviada desde",
  },
};

export function InvoiceNotificationEmail({
  clientName,
  artisanName,
  invoiceNumber,
  totalTTC,
  dueDate,
  invoiceUrl,
  host,
  locale = "fr-FR",
}: InvoiceNotificationEmailProps) {
  const t = translations[locale] ?? translations["fr-FR"];
  const lang = locale.split("-")[0];

  const bodyText = t.body
    .replace("{clientName}", clientName)
    .replace("{artisanName}", artisanName);

  return (
    <EmailLayout lang={lang} host={host} footerText={t.footer}>
      <Preview>{t.preview}</Preview>

      <Text style={styles.heading}>{t.heading}</Text>
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
            <Text style={styles.summaryLabelText}>{t.labelDue}</Text>
          </Column>
          <Column style={styles.summaryValue}>
            <Text style={styles.summaryValueText}>{dueDate}</Text>
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

export default InvoiceNotificationEmail;

const styles = {
  heading: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0a0a0a",
    margin: "0 0 12px",
    lineHeight: "1.3",
  },
  body: {
    fontSize: "15px",
    color: "#444",
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  summaryBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #e8e8e8",
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
    backgroundColor: "#0a0a0a",
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
