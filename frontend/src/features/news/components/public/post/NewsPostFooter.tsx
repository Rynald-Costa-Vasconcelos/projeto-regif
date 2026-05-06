// src/features/news/components/public/post/NewsPostFooter.tsx
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function NewsPostFooter() {
  return (
    <div className="mt-12 pt-6 border-t text-sm text-gray-500 max-w-3xl mx-auto flex items-center justify-between gap-4">
      <Link
        to="/noticias"
        className="inline-flex items-center gap-2 font-bold text-regif-blue hover:underline"
      >
        <ArrowLeft size={16} /> Ver todas as notícias
      </Link>

      <a
        href="#top"
        className="text-gray-600 hover:text-regif-blue font-semibold"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Voltar ao topo
      </a>
    </div>
  );
}
