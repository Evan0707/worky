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
  return { title: t("privacy.title") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPage title={t("privacy.title")} lastUpdate={t("privacy.lastUpdate")}>
      <LegalSection title={t("privacy.s1.title")}>
        <LegalParagraph>{t("privacy.s1.p1")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("privacy.s2.title")}>
        <LegalParagraph>{t("privacy.s2.p1")}</LegalParagraph>
        <LegalList
          items={[
            t("privacy.s2.d1"),
            t("privacy.s2.d2"),
            t("privacy.s2.d3"),
            t("privacy.s2.d4"),
            t("privacy.s2.d5"),
          ]}
        />
      </LegalSection>

      <LegalSection title={t("privacy.s3.title")}>
        <LegalParagraph>{t("privacy.s3.p1")}</LegalParagraph>
        <LegalList
          items={[
            t("privacy.s3.f1"),
            t("privacy.s3.f2"),
            t("privacy.s3.f3"),
            t("privacy.s3.f4"),
            t("privacy.s3.f5"),
          ]}
        />
      </LegalSection>

      <LegalSection title={t("privacy.s4.title")}>
        <LegalParagraph>{t("privacy.s4.p1")}</LegalParagraph>
        <LegalList
          items={[
            t("privacy.s4.b1"),
            t("privacy.s4.b2"),
            t("privacy.s4.b3"),
            t("privacy.s4.b4"),
          ]}
        />
      </LegalSection>

      <LegalSection title={t("privacy.s5.title")}>
        <LegalParagraph>{t("privacy.s5.p1")}</LegalParagraph>
        <LegalParagraph>{t("privacy.s5.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("privacy.s6.title")}>
        <LegalParagraph>{t("privacy.s6.p1")}</LegalParagraph>
        <LegalList
          items={[
            t("privacy.s6.r1"),
            t("privacy.s6.r2"),
            t("privacy.s6.r3"),
            t("privacy.s6.r4"),
            t("privacy.s6.r5"),
          ]}
        />
        <LegalParagraph>{t("privacy.s6.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("privacy.s7.title")}>
        <LegalParagraph>{t("privacy.s7.p1")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("privacy.s8.title")}>
        <LegalParagraph>{t("privacy.s8.p1")}</LegalParagraph>
        <LegalList
          items={[
            t("privacy.s8.r1"),
            t("privacy.s8.r2"),
            t("privacy.s8.r3"),
            t("privacy.s8.r4"),
            t("privacy.s8.r5"),
            t("privacy.s8.r6"),
          ]}
        />
        <LegalParagraph>{t("privacy.s8.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("privacy.s9.title")}>
        <LegalParagraph>{t("privacy.s9.p1")}</LegalParagraph>
        <LegalParagraph>{t("privacy.s9.p2")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("privacy.s10.title")}>
        <LegalParagraph>{t("privacy.s10.p1")}</LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
