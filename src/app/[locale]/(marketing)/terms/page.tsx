import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  LegalPage,
  LegalSection,
  LegalParagraph,
  LegalList,
} from "../_components/legal-layout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("terms.title") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPage title={t("terms.title")} lastUpdate={t("terms.lastUpdate")}>
      <LegalSection title={t("terms.s1.title")}>
        <LegalParagraph>{t("terms.s1.p1")}</LegalParagraph>
        <LegalParagraph>{t("terms.s1.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s2.title")}>
        <LegalParagraph>{t("terms.s2.p1")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s3.title")}>
        <LegalParagraph>{t("terms.s3.p1")}</LegalParagraph>
        <LegalParagraph>{t("terms.s3.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s4.title")}>
        <LegalParagraph>{t("terms.s4.p1")}</LegalParagraph>
        <LegalList
          items={[
            t("terms.s4.f1"),
            t("terms.s4.f2"),
            t("terms.s4.f3"),
            t("terms.s4.f4"),
            t("terms.s4.f5"),
            t("terms.s4.f6"),
          ]}
        />
        <LegalParagraph>{t("terms.s4.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s5.title")}>
        <LegalParagraph>{t("terms.s5.p1")}</LegalParagraph>
        <LegalList items={[t("terms.s5.free"), t("terms.s5.pro")]} />
        <LegalParagraph>{t("terms.s5.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s6.title")}>
        <LegalParagraph>{t("terms.s6.p1")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s7.title")}>
        <LegalParagraph>{t("terms.s7.p1")}</LegalParagraph>
        <LegalParagraph>{t("terms.s7.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s8.title")}>
        <LegalParagraph>{t("terms.s8.p1")}</LegalParagraph>
        <LegalParagraph>{t("terms.s8.p2")}</LegalParagraph>
        <LegalParagraph>{t("terms.s8.p3")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s9.title")}>
        <LegalParagraph>{t("terms.s9.p1")}</LegalParagraph>
        <LegalParagraph>{t("terms.s9.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("terms.s10.title")}>
        <LegalParagraph>{t("terms.s10.p1")}</LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
