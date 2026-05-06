// src/features/news/components/public/post/NewsPostLoading.tsx
import { Loader2 } from "lucide-react";

export function NewsPostLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
      <Loader2 className="animate-spin text-regif-blue mb-4" size={40} />
      <p className="text-gray-500 font-medium tracking-tight">Carregando matéria...</p>
    </div>
  );
}
