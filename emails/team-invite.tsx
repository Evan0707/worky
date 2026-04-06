import { Button, Preview, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface TeamInviteEmailProps {
  teamName: string;
  inviterName: string;
  role: "ADMIN" | "MEMBER";
  inviteUrl: string;
  expiryDays: number;
  host: string;
  locale?: "fr-FR" | "en-GB" | "de-DE" | "es-ES";
}

type Locale = "fr-FR" | "en-GB" | "de-DE" | "es-ES";

const translations: Record<
  Locale,
  {
    preview: string;
    heading: string;
    body: string;
    roleAdmin: string;
    roleMember: string;
    button: string;
    expiry: string;
    ignore: string;
    footer: string;
  }
> = {
  "fr-FR": {
    preview: "Vous avez été invité à rejoindre une équipe OpenChantier",
    heading: "Invitation à rejoindre une équipe",
    body: "{inviterName} vous invite à rejoindre l'équipe {teamName} en tant que {role}.",
    roleAdmin: "Administrateur",
    roleMember: "Membre",
    button: "Rejoindre l'équipe",
    expiry: "Ce lien est valable {days} jours.",
    ignore:
      "Si vous n'attendiez pas cette invitation, ignorez cet email en toute sécurité.",
    footer: "Invitation envoyée depuis",
  },
  "en-GB": {
    preview: "You've been invited to join a OpenChantier team",
    heading: "Team invitation",
    body: "{inviterName} is inviting you to join the team {teamName} as {role}.",
    roleAdmin: "Administrator",
    roleMember: "Member",
    button: "Join the team",
    expiry: "This link is valid for {days} days.",
    ignore:
      "If you were not expecting this invitation, you can safely ignore this email.",
    footer: "Invitation sent from",
  },
  "de-DE": {
    preview: "Sie wurden zu einem OpenChantier-Team eingeladen",
    heading: "Einladung zu einem Team",
    body: "{inviterName} lädt Sie ein, dem Team {teamName} als {role} beizutreten.",
    roleAdmin: "Administrator",
    roleMember: "Mitglied",
    button: "Team beitreten",
    expiry: "Dieser Link ist {days} Tage lang gültig.",
    ignore:
      "Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.",
    footer: "Einladung gesendet von",
  },
  "es-ES": {
    preview: "Ha sido invitado a unirse a un equipo de OpenChantier",
    heading: "Invitación a unirse a un equipo",
    body: "{inviterName} le invita a unirse al equipo {teamName} como {role}.",
    roleAdmin: "Administrador",
    roleMember: "Miembro",
    button: "Unirse al equipo",
    expiry: "Este enlace es válido durante {days} días.",
    ignore:
      "Si no esperaba esta invitación, puede ignorar este correo electrónico.",
    footer: "Invitación enviada desde",
  },
};

export function TeamInviteEmail({
  teamName,
  inviterName,
  role,
  inviteUrl,
  expiryDays,
  host,
  locale = "fr-FR",
}: TeamInviteEmailProps) {
  const t = translations[locale] ?? translations["fr-FR"];
  const lang = locale.split("-")[0];
  const roleLabel = role === "ADMIN" ? t.roleAdmin : t.roleMember;

  const bodyText = t.body
    .replace("{inviterName}", inviterName)
    .replace("{teamName}", teamName)
    .replace("{role}", roleLabel);

  const expiryText = t.expiry.replace("{days}", String(expiryDays));

  return (
    <EmailLayout lang={lang} host={host} footerText={t.footer}>
      <Preview>{t.preview}</Preview>

      <Text style={styles.heading}>{t.heading}</Text>
      <Text style={styles.body}>{bodyText}</Text>

      <Section style={styles.buttonContainer}>
        <Button style={styles.button} href={inviteUrl}>
          {t.button}
        </Button>
      </Section>

      <Text style={styles.expiry}>{expiryText}</Text>
      <Text style={styles.ignore}>{t.ignore}</Text>
    </EmailLayout>
  );
}

export default TeamInviteEmail;

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
    color: "#333",
    lineHeight: "1.6",
    margin: "0 0 28px",
  },
  buttonContainer: {
    margin: "0 0 24px",
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
  expiry: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 8px",
  },
  ignore: {
    fontSize: "13px",
    color: "#999",
    margin: "0",
  },
};
