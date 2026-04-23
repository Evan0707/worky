export type ArticleCategory = "regulation" | "tips" | "tools";

export type Article = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // YYYY-MM-DD
  readingTime: number; // minutes
  category: ArticleCategory;
  tags: string[];
  author: { name: string; role: string };
};

export const articles: Article[] = [
  {
    slug: "rediger-devis-batiment-mentions-obligatoires",
    title: "Rédiger un devis bâtiment : mentions obligatoires, structure et erreurs à éviter",
    description:
      "Le guide complet pour rédiger des devis BTP conformes, signés rapidement et juridiquement solides : mentions légales, assurance décennale, médiation, erreurs fréquentes.",
    publishedAt: "2026-04-23",
    readingTime: 10,
    category: "tips",
    tags: ["devis", "bâtiment", "mentions légales", "facturation"],
    author: { name: "Équipe OpenChantier", role: "Rédaction" },
  },
  {
    slug: "facture-electronique-artisans-2026",
    title: "Facture électronique obligatoire pour les artisans : tout comprendre",
    description:
      "Dates, formats acceptés, obligations légales et sanctions : le guide complet pour qu'un artisan soit prêt avant l'échéance de 2026.",
    publishedAt: "2026-04-20",
    readingTime: 8,
    category: "regulation",
    tags: ["facturation", "réglementation", "Factur-X", "2026"],
    author: { name: "Équipe OpenChantier", role: "Rédaction" },
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function formatPublishedAt(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
