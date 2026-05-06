import { ImageIcon, Trash2 } from "lucide-react";
import { useNewsMedia } from "../../../hooks/useNewsMedia";

export function NewsEditorCover({ media }: { media: ReturnType<typeof useNewsMedia> }) {
  const { cover } = media;

  return (
    <details open className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <summary className="cursor-pointer px-6 py-4 flex items-center justify-between hover:bg-gray-50 font-bold text-gray-800 text-sm">
        Imagem de Capa (16:9)
      </summary>
      <div className="px-6 pb-6 space-y-4">
        <div className="aspect-video rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 overflow-hidden relative">
          {cover.preview ? (
            <img src={cover.preview} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon size={32} />
              <p className="text-xs mt-2">Sem capa</p>
            </div>
          )}
        </div>
        
        <input
          type="file"
          accept="image/*"
          className="block w-full text-xs"
          onChange={(e) => {
            if (e.target.files?.[0]) {
               media.cover.select(e.target.files[0]);
               e.target.value = "";
            }
          }}
        />
        
        {cover.file && (
          <button type="button" onClick={media.cover.clear} className="text-xs text-red-600 flex items-center gap-1">
            <Trash2 size={14} /> Remover capa
          </button>
        )}
      </div>
    </details>
  );
}