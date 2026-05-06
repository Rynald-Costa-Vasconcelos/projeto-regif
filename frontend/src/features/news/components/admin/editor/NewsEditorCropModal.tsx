import Cropper from "react-easy-crop";
import clsx from "clsx";
import { useNewsMedia } from "../../../hooks/useNewsMedia";

interface Props {
  media: ReturnType<typeof useNewsMedia>;
}

export function NewsEditorCropModal({ media }: Props) {
  const { crop } = media;
  if (!crop.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between">
          <p className="font-bold text-gray-800">Recortar Imagem (16:9)</p>
          <button type="button" onClick={crop.close} className="px-3 py-2 text-sm border rounded-xl hover:bg-gray-50">Fechar</button>
        </div>
        <div className="relative w-full bg-black h-[420px]">
          {crop.src && (
            <Cropper
              image={crop.src}
              crop={crop.data}
              zoom={crop.zoom}
              aspect={16 / 9}
              onCropChange={crop.setCrop}
              onZoomChange={crop.setZoom}
              onCropComplete={(_, px) => crop.setArea(px)}
            />
          )}
        </div>
        <div className="p-4 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <span className="text-xs">Zoom</span>
             <input type="range" min={1} max={3} step={0.01} value={crop.zoom} onChange={(e) => crop.setZoom(Number(e.target.value))} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={crop.close} className="px-4 py-2 rounded-xl border">Cancelar</button>
            <button 
              type="button" 
              onClick={crop.confirm} 
              disabled={!crop.isReady || media.isUploading}
              className={clsx("px-4 py-2 rounded-xl font-bold bg-regif-green text-white", (!crop.isReady || media.isUploading) && "opacity-50")}
            >
              {media.isUploading ? "Processando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}