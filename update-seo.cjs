const fs = require('fs');
const path = require('path');

const locales = ['fr-FR', 'en-GB', 'de-DE', 'es-ES'];

const seoTranslations = {
  'fr-FR': {
    title: 'Qoworkr — Logiciel de gestion de chantier pour artisans du BTP',
    description: 'Qoworkr est l\'application tout-en-un des artisans du bâtiment : gestion de chantier, prise de photos, suivi des heures (pointage), devis et facturation en ligne.',
    keywords: 'artisan, BTP, gestion de chantier, logiciel, SaaS, facturation, pointage, suivi travaux, application mobile'
  },
  'en-GB': {
    title: 'Qoworkr — Construction Management Software for Tradespeople',
    description: 'Qoworkr is the all-in-one app for construction teams: project management, site photos, time tracking, online quoting and invoicing.',
    keywords: 'contractor, construction, project management, software, SaaS, invoicing, time tracking, job site, mobile app'
  },
  'de-DE': {
    title: 'Qoworkr — Baustellenmanagement-Software für Handwerker',
    description: 'Qoworkr ist die All-in-One-App für Bau-Teams: Baustellenmanagement, Projektfotos, Zeiterfassung (Stundenzettel), Online-Angebote und Rechnungen.',
    keywords: 'Handwerker, Bau, Baustellenmanagement, Software, SaaS, Rechnungsstellung, Zeiterfassung, Baustelle, mobile App'
  },
  'es-ES': {
    title: 'Qoworkr — Software de gestión de obras para obreros y contratistas',
    description: 'Qoworkr es la aplicación todo en uno para equipos de construcción: gestión de proyectos, fotos de obra, seguimiento del tiempo, presupuestos y facturación.',
    keywords: 'contratista, construcción, gestión de proyectos, software, SaaS, facturación, control de horas, obra, aplicación móvil'
  }
};

locales.forEach(loc => {
  const p = path.join('src', 'i18n', 'locales', loc, 'landing.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    data.seo = seoTranslations[loc];
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Updated ' + loc);
  }
});
