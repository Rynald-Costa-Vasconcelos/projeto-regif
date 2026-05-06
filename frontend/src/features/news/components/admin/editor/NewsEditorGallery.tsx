import { Trash2, ImageIcon } from "lucide-react";
import type { useNewsMedia } from "../../../hooks/useNewsMedia"; // Import type para o Hook return

interface Props {
  media: ReturnType<typeof useNewsMedia>;
  enableGallery: boolean;
  setEnableGallery: (v: boolean) => void;
}

export function NewsEditorGallery({ media, enableGallery, setEnableGallery }: Props) {
  const { gallery } = media;

  return (
    <details className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <summary className="cursor-pointer select-none list-none px-6 py-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-sm">Galeria</span>
          <span className="text-[10px] text-gray-400">Imagens extras no final da notícia</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400">{enableGallery ? "Ativa" : "Desativada"}</span>
        </div>
      </summary>

      <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
        {!enableGallery ? (
          <div className="text-[11px] text-gray-500 bg-gray-50 border rounded-xl p-3 flex justify-between items-center">
            <span>Galeria desativada.</span>
            <button 
              type="button" 
              onClick={() => setEnableGallery(true)}
              className="text-regif-blue font-bold hover:underline"
            >
              Ativar agora
            </button>
          </div>
        ) : (
          <>
            <input
              ref={gallery.inputRef}
              type="file"
              multiple
              accept="image/*"
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-regif-blue/10 file:text-regif-blue hover:file:bg-regif-blue/20"
              onChange={(e) => {
                if (e.target.files) {
                    gallery.select(Array.from(e.target.files)).catch(err => alert(err.message));
                }
              }}
            />

            {gallery.previews.length > 0 ? (
              <div className="space-y-2">
                 <p className="text-[10px] text-gray-400 uppercase font-bold">Preview ({gallery.previews.length} imagens)</p>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {gallery.previews.map((src, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden border bg-gray-50 relative group">
                        <img src={src} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                      </div>
                    ))}
                 </div>
                 <button
                    type="button"
                    onClick={gallery.clear}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 mt-2"
                 >
                    <Trash2 size={14} /> Limpar tudo
                 </button>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50 text-gray-400">
                    <ImageIcon size={24} className="mb-2 opacity-50" />
                    <p className="text-xs">Nenhuma imagem selecionada</p>
                </div>
            )}
          </>
        )}
      </div>
    </details>
  );
}