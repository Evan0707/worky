import { PhotosView } from "./_components/photos-view";

export default async function ProjectPhotosPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Photos</h2>
      <PhotosView projectId={id} locale={locale} />
    </div>
  );
}
