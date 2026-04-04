const fs = require('fs');
const path = require('path');

const locales = ['fr-FR', 'en-GB', 'de-DE', 'es-ES'];

const onboardingTexts = {
  'fr-FR': {
    title: "Bienvenue sur Qoworkr",
    subtitle: "Parlons de vous et de votre activité",
    steps: {
      "1": { title: "Vos informations", desc: "Qui êtes-vous ?" },
      "2": { title: "Votre entreprise", desc: "Comment s'appelle l'artisanat ?" },
      "3": { title: "Votre métier", desc: "Votre spécialité ?" }
    },
    fields: {
      firstName: "Prénom",
      lastName: "Nom",
      companyName: "Nom de l'entreprise",
      industry: "Secteur d'activité (ex: Plomberie, Menuiserie...)",
      industryPlaceholder: "Plombier, Électricien, Maçon...",
    },
    buttons: {
      next: "Suivant",
      back: "Retour",
      finish: "Terminer et accéder à mon tableau de bord"
    },
    success: "Votre profil a été configuré avec succès."
  },
  'en-GB': {
    title: "Welcome to Qoworkr",
    subtitle: "Let's talk about you and your business",
    steps: {
      "1": { title: "Personal Info", desc: "Who are you?" },
      "2": { title: "Your Company", desc: "What's the name of your business?" },
      "3": { title: "Your Trade", desc: "What's your specialty?" }
    },
    fields: {
      firstName: "First Name",
      lastName: "Last Name",
      companyName: "Company Name",
      industry: "Industry (e.g., Plumbing, Carpentry...)",
      industryPlaceholder: "Plumber, Electrician, Mason...",
    },
    buttons: {
      next: "Next",
      back: "Back",
      finish: "Finish & go to dashboard"
    },
    success: "Your profile has been set up successfully."
  },
  'de-DE': {
    title: "Willkommen bei Qoworkr",
    subtitle: "Lassen Sie uns über Sie und Ihr Unternehmen sprechen",
    steps: {
      "1": { title: "Personenbezogene Daten", desc: "Wer sind Sie?" },
      "2": { title: "Ihr Unternehmen", desc: "Wie heißt Ihr Unternehmen?" },
      "3": { title: "Ihre Branche", desc: "Was ist Ihre Spezialität?" }
    },
    fields: {
      firstName: "Vorname",
      lastName: "Nachname",
      companyName: "Firmenname",
      industry: "Branche (z.B. Klempnerei, Zimmerei...)",
      industryPlaceholder: "Klempner, Elektriker, Maurer...",
    },
    buttons: {
      next: "Weiter",
      back: "Zurück",
      finish: "Fertigstellen & zum Dashboard"
    },
    success: "Ihr Profil wurde erfolgreich eingerichtet."
  },
  'es-ES': {
    title: "Bienvenido a Qoworkr",
    subtitle: "Hablemos de ti y de tu empresa",
    steps: {
      "1": { title: "Información personal", desc: "¿Quién eres?" },
      "2": { title: "Tu empresa", desc: "¿Cómo se llama tu negocio?" },
      "3": { title: "Tu sector", desc: "¿Cuál es tu especialidad?" }
    },
    fields: {
      firstName: "Nombre",
      lastName: "Apellidos",
      companyName: "Nombre de la empresa",
      industry: "Sector (ej. Fontanería, Carpintería...)",
      industryPlaceholder: "Fontanero, Electricista, Albañil...",
    },
    buttons: {
      next: "Siguiente",
      back: "Atrás",
      finish: "Finalizar e ir al panel"
    },
    success: "Tu perfil ha sido configurado con éxito."
  }
};

for (const lang of locales) {
  const filePath = path.join(__dirname, `src/i18n/locales/${lang}/auth.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!data.onboarding) {
      data.onboarding = onboardingTexts[lang];
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Updated ${lang}`);
    }
  }
}
