import { Button, Preview, Section, Text } from "@react-email/components";
import { EmailLayout, styles as layoutStyles } from "./layout";

type Locale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

interface OTPEmailProps {
  url: string;
  host: string;
  locale?: Locale;
}

const translations: Record<
  Locale,
  {
    preview: string;
    heading: string;
    body: string;
    button: string;
    ignore: string;
    footer: string;
  }
> = {
  "fr-FR": {
    preview: "Votre lien de connexion Worky",
    heading: "Connexion à votre compte",
    body: "Cliquez sur le bouton ci-dessous pour vous connecter à Worky. Ce lien est valable 24 heures et ne peut être utilisé qu'une seule fois.",
    button: "Se connecter",
    ignore:
      "Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email en toute sécurité.",
    footer: "Lien de connexion envoyé depuis",
  },
  "en-GB": {
    preview: "Your Worky sign-in link",
    heading: "Sign in to your account",
    body: "Click the button below to sign in to Worky. This link is valid for 24 hours and can only be used once.",
    button: "Sign in",
    ignore: "If you did not request this link, you can safely ignore this email.",
    footer: "Sign-in link sent from",
  },
  "de-DE": {
    preview: "Ihr Worky-Anmeldelink",
    heading: "Anmeldung bei Ihrem Konto",
    body: "Klicken Sie auf die Schaltfläche unten, um sich bei Worky anzumelden. Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.",
    button: "Anmelden",
    ignore:
      "Wenn Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.",
    footer: "Anmelde-Link gesendet von",
  },
  "es-ES": {
    preview: "Su enlace de acceso a Worky",
    heading: "Iniciar sesión en su cuenta",
    body: "Haga clic en el botón de abajo para iniciar sesión en Worky. Este enlace es válido durante 24 horas y solo puede usarse una vez.",
    button: "Iniciar sesión",
    ignore:
      "Si no ha solicitado este enlace, puede ignorar este correo electrónico.",
    footer: "Enlace de inicio de sesión enviado desde",
  },
};

export function OTPEmail({ url, host, locale = "fr-FR" }: OTPEmailProps) {
  const t = translations[locale] ?? translations["fr-FR"];
  const lang = locale.split("-")[0];

  return (
    <EmailLayout lang={lang} host={host} footerText={t.footer}>
      <Preview>{t.preview}</Preview>

      <Text style={styles.heading}>{t.heading}</Text>
      <Text style={styles.body}>{t.body}</Text>

      <Section style={styles.buttonContainer}>
        <Button style={styles.button} href={url}>
          {t.button}
        </Button>
      </Section>

      <Text style={styles.ignore}>{t.ignore}</Text>
    </EmailLayout>
  );
}

export default OTPEmail;

const styles = {
  heading: {
    ...layoutStyles.footerCopy,
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
    margin: "0 0 28px",
  },
  buttonContainer: {
    margin: "0 0 28px",
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
  ignore: {
    fontSize: "13px",
    color: "#999",
    lineHeight: "1.5",
    margin: "0",
  },
};
