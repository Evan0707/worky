import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { articles, formatPublishedAt } from "@/lib/blog";
import { Clock, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      type: "website",
    },
  };
}

const CATEGORY_COLORS = {
  regulation: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  tips: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  tools: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <section className="bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 tracking-wider uppercase mb-5">
            {t("listing.badge")}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            {t("listing.title")}
          </h1>
          <p className="mt-4 text-[15px] text-neutral-500 max-w-xl mx-auto leading-relaxed">
            {t("listing.subtitle")}
          </p>
        </div>

        {/* Articles grid */}
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-16 text-center">
            <p className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">{t("empty.title")}</p>
            <p className="mt-2 text-[13px] text-neutral-500">{t("empty.description")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/blog/${article.slug}`}
                className="group relative rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:shadow-sm dark:hover:bg-white/[0.04]"
              >
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[article.category]}`}
                >
                  {t(`categories.${article.category}`)}
                </span>

                <h2 className="mt-4 text-[17px] font-semibold leading-snug text-neutral-900 dark:text-white group-hover:opacity-80 transition-opacity">
                  {article.title}
                </h2>

                <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed line-clamp-3">
                  {article.description}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[12px] text-neutral-400">
                    <span>{formatPublishedAt(article.publishedAt, locale)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t("article.readingTime", { minutes: article.readingTime })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
