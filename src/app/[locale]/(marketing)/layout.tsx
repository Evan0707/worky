import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "./_components/navbar";
import { Logo } from "./_components/logo";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar locale={locale} />
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Logo className="h-5 w-5"  />
                <span className="text-[15px] font-semibold tracking-tight text-white">
                  OpenChantier
                </span>
              </div>
              <p className="text-[14px] text-neutral-500 max-w-sm leading-relaxed">
                {t("footer.description")}
              </p>
            </div>

            {/* Product links */}
            <div>
              <h4 className="text-[13px] font-semibold text-neutral-400 mb-4">
                {t("footer.product")}
              </h4>
              <ul className="space-y-3 text-[14px]">
                <li>
                  <a href="#features" className="text-neutral-500 hover:text-white transition-colors">
                    {t("nav.features")}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-neutral-500 hover:text-white transition-colors">
                    {t("nav.pricing")}
                  </a>
                </li>
                <li>
                  <Link href={`/${locale}/blog`} className="text-neutral-500 hover:text-white transition-colors">
                    {t("nav.blog")}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/login`} className="text-neutral-500 hover:text-white transition-colors">
                    {t("nav.login")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h4 className="text-[13px] font-semibold text-neutral-400 mb-4">
                {t("footer.legal")}
              </h4>
              <ul className="space-y-3 text-[14px]">
                <li>
                  <Link href={`/${locale}/terms`} className="text-neutral-500 hover:text-white transition-colors">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/privacy`} className="text-neutral-500 hover:text-white transition-colors">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/legal`} className="text-neutral-500 hover:text-white transition-colors">
                    {t("footer.legalNotice")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-8">
            <p className="text-[13px] text-neutral-600">
              &copy; {new Date().getFullYear()} OpenChantier. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
