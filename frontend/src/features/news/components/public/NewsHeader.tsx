// src/features/news/components/public/NewsHeader.tsx
export function NewsHeader() {
  return (
    <div>
      <div className="text-xs font-black tracking-[0.18em] text-slate-500">ARQUIVO</div>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
        Arquivo completo de notícias
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Pesquise por título, filtre por categoria e data, e navegue por páginas — pronto pra centenas de posts.
      </p>
    </div>
  );
}
