import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  LegalPage,
  LegalSection,
  LegalParagraph,
} from "../_components/legal-layout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("legalNotice.title") };
}

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPage
      title={t("legalNotice.title")}
      lastUpdate={t("legalNotice.lastUpdate")}
    >
      <LegalSection title={t("legalNotice.s1.title")}>
        <LegalParagraph>{t("legalNotice.s1.p1")}</LegalParagraph>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 space-y-1 text-[14px] text-neutral-500">
          <p className="font-medium text-white">
            {t("legalNotice.s1.company")}
          </p>
          <p>{t("legalNotice.s1.address")}</p>
          <p>{t("legalNotice.s1.email")}</p>
          <p>{t("legalNotice.s1.director")}</p>
        </div>
      </LegalSection>

      <LegalSection title={t("legalNotice.s2.title")}>
        <LegalParagraph>{t("legalNotice.s2.p1")}</LegalParagraph>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 space-y-1 text-[14px] text-neutral-500">
          <p className="font-medium text-white">
            {t("legalNotice.s2.host")}
          </p>
          <p>{t("legalNotice.s2.hostAddress")}</p>
          <p>{t("legalNotice.s2.hostSite")}</p>
          <p className="pt-2">{t("legalNotice.s2.dbHost")}</p>
        </div>
      </LegalSection>

      <LegalSection title={t("legalNotice.s3.title")}>
        <LegalParagraph>{t("legalNotice.s3.p1")}</LegalParagraph>
        <LegalParagraph>{t("legalNotice.s3.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("legalNotice.s4.title")}>
        <LegalParagraph>{t("legalNotice.s4.p1")}</LegalParagraph>
        <LegalParagraph>{t("legalNotice.s4.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("legalNotice.s5.title")}>
        <LegalParagraph>{t("legalNotice.s5.p1")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("legalNotice.s6.title")}>
        <LegalParagraph>{t("legalNotice.s6.p1")}</LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
