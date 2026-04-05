import { Button, Preview, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

type Locale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

interface ClientShareEmailProps {
  clientName: string;
  artisanName: string;
  projectName: string;
  shareUrl: string;
  host: string;
  locale?: Locale;
}

const translations: Record<
  Locale,
  {
    preview: string;
    heading: string;
    body: string;
    detail: string;
    button: string;
    footer: string;
  }
> = {
  "fr-FR": {
    preview: "Suivi de votre chantier disponible",
    heading: "Votre espace chantier est prêt",
    body: "{artisanName} vous invite à suivre l'avancement de votre projet « {projectName} ».",
    detail:
      "Consultez les photos, les étapes réalisées et les documents associés à tout moment, depuis ce lien personnel.",
    button: "Accéder à mon chantier",
    footer: "Lien partagé depuis",
  },
  "en-GB": {
    preview: "Your project tracking page is ready",
    heading: "Your project space is ready",
    body: "{artisanName} invites you to follow the progress of your project '{projectName}'.",
    detail:
      "View photos, completed steps, and related documents at any time from this personal link.",
    button: "View my project",
    footer: "Link shared from",
  },
  "de-DE": {
    preview: "Ihr Baustellen-Tracking ist bereit",
    heading: "Ihr Projektbereich ist bereit",
    body: "{artisanName} lÃ¤dt Sie ein, den Fortschritt Ihres Projekts '{projectName}' zu verfolgen.",
    detail:
      "Sehen Sie Fotos, abgeschlossene Schritte und zugehörige Dokumente jederzeit über diesen persönlichen Link.",
    button: "Zu meinem Projekt",
    footer: "Link gesendet von",
  },
  "es-ES": {
    preview: "Su seguimiento de obra está listo",
    heading: "Su espacio de obra está listo",
    body: "{artisanName} le invita a seguir el avance de su proyecto «{projectName}».",
    detail:
      "Consulte fotos, etapas realizadas y documentos relacionados en cualquier momento desde este enlace personal.",
    button: "Acceder a mi obra",
    footer: "Enlace compartido desde",
  },
};

export function ClientShareEmail({
  clientName,
  artisanName,
  projectName,
  shareUrl,
  host,
  locale = "fr-FR",
}: ClientShareEmailProps) {
  const t = translations[locale] ?? translations["fr-FR"];
  const lang = locale.split("-")[0];

  const bodyText = t.body
    .replace("{artisanName}", artisanName)
    .replace("{projectName}", projectName);

  return (
    <EmailLayout lang={lang} host={host} footerText={t.footer}>
      <Preview>{t.preview}</Preview>

      <Text style={styles.greeting}>Bonjour {clientName},</Text>
      <Text style={styles.heading}>{t.heading}</Text>
      <Text style={styles.body}>{bodyText}</Text>
      <Text style={styles.detail}>{t.detail}</Text>

      <Section style={styles.buttonContainer}>
        <Button style={styles.button} href={shareUrl}>
          {t.button}
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default ClientShareEmail;

const styles = {
  greeting: {
    fontSize: "15px",
    color: "#666",
    margin: "0 0 4px",
    lineHeight: "1.5",
  },
  heading: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0a0a0a",
    margin: "0 0 12px",
    lineHeight: "1.3",
  },
  body: {
    fontSize: "15px",
    color: "#333",
    lineHeight: "1.6",
    margin: "0 0 12px",
  },
  detail: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
    margin: "0 0 28px",
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
