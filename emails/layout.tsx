import React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";

interface EmailLayoutProps {
  preview?: string;
  lang?: string;
  children: React.ReactNode;
  footerText?: string;
  host?: string;
}

export function EmailLayout({
  lang = "fr",
  children,
  footerText,
  host,
}: EmailLayoutProps) {
  return (
    <Html lang={lang}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Body style={styles.body}>
        <Container style={styles.wrapper}>

          {/* Logo */}
          <Section style={styles.logoSection}>
            <Text style={styles.logoText}>
              <span style={styles.logoMark}>●</span>{" "}OpenChantier
            </Text>
          </Section>

          {/* Card */}
          <Section style={styles.card}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Hr style={styles.footerHr} />
            <Text style={styles.footerText}>
              {footerText && <>{footerText} </>}
              {host && (
                <Link href={`https://${host}`} style={styles.footerLink}>
                  {host}
                </Link>
              )}
            </Text>
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} OpenChantier · Tous droits réservés
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  body: {
    backgroundColor: "#f5f5f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: "0",
    padding: "40px 16px",
  },
  wrapper: {
    maxWidth: "540px",
    margin: "0 auto",
  },
  logoSection: {
    marginBottom: "24px",
    paddingLeft: "4px",
  },
  logoMark: {
    color: "#0a0a0a",
    marginRight: "4px",
  } as React.CSSProperties,
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0a0a0a",
    margin: "0",
    lineHeight: "1",
    letterSpacing: "-0.3px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e8e8e8",
    padding: "40px 36px",
  },
  footer: {
    marginTop: "24px",
  },
  footerHr: {
    borderColor: "#e8e8e8",
    margin: "0 0 16px",
  },
  footerText: {
    color: "#999",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 4px",
  },
  footerLink: {
    color: "#666",
    textDecoration: "underline",
  },
  footerCopy: {
    color: "#bbb",
    fontSize: "11px",
    margin: "0",
  },
};
