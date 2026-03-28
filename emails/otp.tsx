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

interface OTPEmailProps {
  url: string;
  host: string;
}

export function OTPEmail({ url, host }: OTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre lien de connexion ChantierPro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ChantierPro</Heading>
          <Heading style={h2}>Connexion à votre compte</Heading>
          <Text style={text}>
            Cliquez sur le bouton ci-dessous pour vous connecter à ChantierPro.
            Ce lien est valable 24 heures et ne peut être utilisé qu&apos;une
            seule fois.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Se connecter à ChantierPro
            </Button>
          </Section>
          <Text style={text}>
            Si vous n&apos;avez pas demandé ce lien, vous pouvez ignorer cet
            email en toute sécurité.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Ce lien de connexion a été envoyé depuis {host}. Si vous avez des
            questions, contactez-nous à{" "}
            <Link href="mailto:support@chantierpro.fr" style={link}>
              support@chantierpro.fr
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
