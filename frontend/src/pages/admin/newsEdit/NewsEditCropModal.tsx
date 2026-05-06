import clsx from "clsx";
import Cropper from "react-easy-crop";
import type { Area } from "./helpers";

interface NewsEditCropModalProps {
  isOpen: boolean;
  cropSrc: string;
  crop: { x: number; y: number };
  zoom: number;
  setCrop: (value: { x: number; y: number }) => void;
  setZoom: (value: number) => void;
  onCropComplete: (_: unknown, pixels: Area) => void;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  canConfirm: boolean;
}

export function NewsEditCropModal(props: NewsEditCropModalProps) {
  const {
    isOpen,
    cropSrc,
    crop,
    zoom,
    setCrop,
    setZoom,
    onCropComplete,
    onClose,
    onConfirm,
    saving,
    canConfirm,
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">Recortar imagem de capa (16:9)</p>
            <p className="text-xs text-gray-500">Ajuste o enquadramento. A imagem final será usada como capa.</p>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm border rounded-xl hover:bg-gray-50">
            Fechar
          </button>
        </div>

        <div className="relative w-full bg-black" style={{ height: 420 }}>
          {cropSrc ? (
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-white/70 text-sm">Carregando imagem...</div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Zoom</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving || !canConfirm}
              className={clsx(
                "px-4 py-2 rounded-xl font-bold",
                saving || !canConfirm
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-regif-green text-white hover:bg-green-600"
              )}
            >
              {saving ? "Processando..." : "Usar esta capa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
