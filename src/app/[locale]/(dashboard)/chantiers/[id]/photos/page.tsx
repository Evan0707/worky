import { getTranslations } from "next-intl/server";
import { PhotosView } from "./_components/photos-view";

export default async function ProjectPhotosPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t("subpages.photos")}</h2>
      <PhotosView projectId={id} locale={locale} />
    </div>
  );
}
