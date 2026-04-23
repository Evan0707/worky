import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug, formatPublishedAt } from "@/lib/blog";
import { Clock, ChevronRight } from "lucide-react";
import { ArticleContent as FactureElectroniqueContent } from "@/lib/blog/articles/facture-electronique-artisans-2026";
import { ArticleContent as RedigerDevisContent } from "@/lib/blog/articles/rediger-devis-batiment-mentions-obligatoires";

const ARTICLE_COMPONENTS: Record<string, React.ComponentType<{ locale: string }>> = {
  "facture-electronique-artisans-2026": FactureElectroniqueContent,
  "rediger-devis-batiment-mentions-obligatoires": RedigerDevisContent,
};

const CATEGORY_COLORS = {
  regulation: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  tips: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  tools: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const Content = ARTICLE_COMPONENTS[slug];
  if (!Content) notFound();

  return (
    <section className="bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-6">
        {/* Breadcrumb */}
        <nav className="mb-10 flex items-center gap-2 text-[12px] text-neutral-400">
          <Link href={`/${locale}/blog`} className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            Blog
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[article.category]}`}
          >
            {t(`categories.${article.category}`)}
          </span>
        </nav>

        {/* Article header */}
        <header className="mb-10">
          <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
            {article.title}
          </h1>
          <p className="mt-3 text-[15px] text-neutral-500 leading-relaxed">
            {article.description}
          </p>

          {/* Meta bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-neutral-400 border-t border-b border-black/[0.06] dark:border-white/[0.06] py-4">
            <span>{t("article.by", { name: article.author.name })}</span>
            <span>·</span>
            <span>{formatPublishedAt(article.publishedAt, locale)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("article.readingTime", { minutes: article.readingTime })}
            </span>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-neutral-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Article body */}
        <article>
          <Content locale={locale} />
        </article>

        {/* Back link */}
        <div className="mt-14 border-t border-black/[0.06] dark:border-white/[0.06] pt-8">
          <Link
            href={`/${locale}/blog`}
            className="text-[13px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {t("article.backToBlog")}
          </Link>
        </div>
      </div>
    </section>
  );
}
