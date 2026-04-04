import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Locale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

interface OTPEmailProps {
  url: string;
  host: string;
  locale?: Locale;
}

const translations: Record<Locale, {
  preview: string;
  heading: string;
  body: string;
  button: string;
  ignore: string;
  footer: string;
}> = {
  "fr-FR": {
    preview: "Cliquez pour vous connecter à OpenChantierkr",
    heading: "Connexion à votre compte",
    body: "Cliquez sur le bouton ci-dessous pour vous connecter à OpenChantierkr. Ce lien est valable 24 heures et ne peut être utilisé qu'une seule fois.",
    button: "Se connecter à OpenChantierkr",
    ignore: "Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email en toute sécurité.",
    footer: "Lien de connexion envoyé depuis",
  },
  "en-GB": {
    preview: "Click to sign in to OpenChantierkr",
    heading: "Sign in to your account",
    body: "Click the button below to sign in to OpenChantierkr. This link is valid for 24 hours and can only be used once.",
    button: "Sign in to OpenChantierkr",
    ignore: "If you did not request this link, you can safely ignore this email.",
    footer: "Sign-in link sent from",
  },
  "de-DE": {
    preview: "Klicken Sie hier, um sich bei OpenChantierkr anzumelden",
    heading: "Anmeldung bei Ihrem Konto",
    body: "Klicken Sie auf die Schaltfläche unten, um sich bei OpenChantierkr anzumelden. Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.",
    button: "Bei OpenChantierkr anmelden",
    ignore: "Wenn Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.",
    footer: "Anmelde-Link gesendet von",
  },
  "es-ES": {
    preview: "Haga clic para iniciar sesión en OpenChantierkr",
    heading: "Iniciar sesión en su cuenta",
    body: "Haga clic en el botón de abajo para iniciar sesión en OpenChantierkr. Este enlace es válido durante 24 horas y solo puede usarse una vez.",
    button: "Iniciar sesión en OpenChantierkr",
    ignore: "Si no ha solicitado este enlace, puede ignorar este correo electrónico.",
    footer: "Enlace de inicio de sesión enviado desde",
  },
};

export function OTPEmail({ url, host, locale = "fr-FR" }: OTPEmailProps) {
  const t = translations[locale] ?? translations["fr-FR"];

  return (
    <Html lang={locale.split("-")[0]}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>OpenChantierkr</Heading>
          <Heading style={h2}>{t.heading}</Heading>
          <Text style={text}>{t.body}</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              {t.button}
            </Button>
          </Section>
          <Text style={text}>{t.ignore}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            {t.footer}{" "}
            <Link href={`https://${host}`} style={link}>
              {host}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OTPEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1A4F8A",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 24px",
};

const text = {
  color: "#444",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1A4F8A",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "1.5",
};

const link = {
  color: "#1A4F8A",
};

