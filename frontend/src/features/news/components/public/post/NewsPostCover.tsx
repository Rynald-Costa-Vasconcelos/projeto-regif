// src/features/news/components/public/post/NewsPostCover.tsx
export function NewsPostCover({
  show,
  url,
  mediaUrl,
}: {
  show: boolean;
  url: string | null;
  mediaUrl: (u?: string | null) => string;
}) {
  if (!show || !url) return null;

  return (
    <div className="border-b border-gray-50 bg-black">
      <div className="max-w-6xl mx-auto">
        <img
          src={mediaUrl(url)}
          alt="Imagem de capa da notícia"
          className="w-full aspect-[16/8] md:aspect-video object-cover"
          loading="eager"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}
