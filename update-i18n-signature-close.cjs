const fs = require('fs');
const path = require('path');

const locales = ['fr-FR', 'en-GB', 'de-DE', 'es-ES'];

const updates = {
  'fr-FR': {
    signatureDialog: {
      closeProjectLabel: "Clôturer le chantier (Terminé)",
      closeProjectDesc: "Marquer le chantier comme terminé une fois signé pour libérer vos quotas.",
      successWithClose: "Signature enregistrée et chantier terminé !"
    }
  },
  'en-GB': {
    signatureDialog: {
      closeProjectLabel: "Finish project (Done)",
      closeProjectDesc: "Mark the project as complete once signed to free up your quotas.",
      successWithClose: "Signature saved and project completed!"
    }
  },
  'de-DE': {
    signatureDialog: {
      closeProjectLabel: "Projekt abschließen (Erledigt)",
      closeProjectDesc: "Markieren Sie das Projekt nach der Unterzeichnung als abgeschlossen, um Ihre Kontingente freizugeben.",
      successWithClose: "Unterschrift gespeichert und Projekt abgeschlossen!"
    }
  },
  'es-ES': {
    signatureDialog: {
      closeProjectLabel: "Finalizar obra (Terminado)",
      closeProjectDesc: "Marcar la obra como terminada una vez firmada para liberar sus cuotas.",
      successWithClose: "¡Firma registrada y obra finalizada!"
    }
  }
};

for (const lang of locales) {
  const filePath = path.join(__dirname, `src/i18n/locales/${lang}/projects.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (data.signatureDialog) {
      Object.assign(data.signatureDialog, updates[lang].signatureDialog);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang} projects.json for close action`);
  }
}
