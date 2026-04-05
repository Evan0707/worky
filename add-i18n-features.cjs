const fs = require('fs');
const path = require('path');

const locales = ['fr-FR', 'en-GB', 'de-DE', 'es-ES'];

const translations = {
  'fr-FR': {
    navigation: {
      openWith: "Y aller",
      mobileNav: "Y aller"
    },
    clientAction: {
      signatureTitle: "Validation client sur place",
      signatureDesc: "Faites signer votre client directement sur votre écran pour valider une étape.",
      alreadySigned: "Déjà signé",
      signatureImageAlt: "Signature du client"
    },
    signatureDialog: {
      button: "Faire signer le client",
      title: "Signature de {clientName}",
      desc: "Veuillez signer ci-dessous avec votre doigt ou un stylet pour valider.",
      clear: "Effacer",
      submit: "Valider la signature",
      success: "Signature enregistrée avec succès",
      errorGen: "Erreur lors de l'enregistrement",
      errorEmpty: "Veuillez signer avant de valider"
    }
  },
  'en-GB': {
    navigation: {
      openWith: "Get Directions",
      mobileNav: "Go"
    },
    clientAction: {
      signatureTitle: "On-site Client Validation",
      signatureDesc: "Have your client sign directly on your screen to validate a step.",
      alreadySigned: "Already Signed",
      signatureImageAlt: "Client Signature"
    },
    signatureDialog: {
      button: "Request Client Signature",
      title: "Signature of {clientName}",
      desc: "Please sign below with your finger or a stylus to validate.",
      clear: "Clear",
      submit: "Confirm Signature",
      success: "Signature saved successfully",
      errorGen: "Error saving signature",
      errorEmpty: "Please sign before validating"
    }
  },
  'de-DE': {
    navigation: {
      openWith: "Route planen",
      mobileNav: "Los"
    },
    clientAction: {
      signatureTitle: "Kundenvalidierung vor Ort",
      signatureDesc: "Lassen Sie Ihren Kunden direkt auf Ihrem Bildschirm unterschreiben, um einen Schritt zu validieren.",
      alreadySigned: "Bereits unterschrieben",
      signatureImageAlt: "Kundenunterschrift"
    },
    signatureDialog: {
      button: "Kunden unterschreiben lassen",
      title: "Unterschrift von {clientName}",
      desc: "Bitte unterschreiben Sie unten mit Ihrem Finger oder einem Stift, um zu bestätigen.",
      clear: "Löschen",
      submit: "Unterschrift bestätigen",
      success: "Unterschrift erfolgreich gespeichert",
      errorGen: "Fehler beim Speichern der Unterschrift",
      errorEmpty: "Bitte vor der Bestätigung unterschreiben"
    }
  },
  'es-ES': {
    navigation: {
      openWith: "Cómo llegar",
      mobileNav: "Ir"
    },
    clientAction: {
      signatureTitle: "Validación del cliente en el lugar",
      signatureDesc: "Haga que su cliente firme directamente en su pantalla para validar un paso.",
      alreadySigned: "Ya firmado",
      signatureImageAlt: "Firma del cliente"
    },
    signatureDialog: {
      button: "Solicitar firma del cliente",
      title: "Firma de {clientName}",
      desc: "Firme a continuación con su dedo o un lápiz óptico para validar.",
      clear: "Borrar",
      submit: "Confirmar firma",
      success: "Firma registrada con éxito",
      errorGen: "Error al guardar la firma",
      errorEmpty: "Por favor firme antes de validar"
    }
  }
};

for (const lang of locales) {
  const filePath = path.join(__dirname, `src/i18n/locales/${lang}/projects.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Add missing blocks
    if (!data.navigation) data.navigation = translations[lang].navigation;
    if (!data.clientAction) data.clientAction = translations[lang].clientAction;
    if (!data.signatureDialog) data.signatureDialog = translations[lang].signatureDialog;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang} projects.json`);
  }
}
