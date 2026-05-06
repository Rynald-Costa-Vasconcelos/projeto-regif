// src/features/news/components/public/post/NewsPostContent.tsx
import clsx from "clsx";
import { normalizeNewsContentHtml } from "../../../utils";

export function NewsPostContent({ html }: { html?: string | null }) {
  const normalizedHtml = normalizeNewsContentHtml(html);

  if (normalizedHtml) {
    return (
      <div className="max-w-3xl mx-auto min-w-0">
        <div
          className={clsx(
            "prose prose-base md:prose-lg max-w-none",
            "[overflow-wrap:anywhere]",
            "prose-p:[overflow-wrap:anywhere] prose-li:[overflow-wrap:anywhere] prose-a:[overflow-wrap:anywhere]",
            "prose-code:[overflow-wrap:anywhere] prose-pre:whitespace-pre-wrap prose-pre:[overflow-wrap:anywhere]",
            "prose-p:leading-8 prose-p:text-gray-800",
            "prose-strong:text-gray-900",
            "prose-em:text-gray-800",
            "prose-headings:text-regif-dark prose-headings:font-extrabold prose-headings:tracking-tight",
            "prose-h2:mt-10 prose-h2:mb-3 prose-h3:mt-8 prose-h3:mb-2",
            "prose-a:text-regif-blue prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
            "prose-ul:my-6 prose-ol:my-6 prose-li:my-1",
            "prose-blockquote:border-l-regif-blue prose-blockquote:text-gray-700 prose-blockquote:not-italic",
            "prose-hr:border-gray-200"
          )}
          dangerouslySetInnerHTML={{ __html: normalizedHtml }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-gray-800 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
      Conteúdo ainda não disponível.
    </div>
  );
}
