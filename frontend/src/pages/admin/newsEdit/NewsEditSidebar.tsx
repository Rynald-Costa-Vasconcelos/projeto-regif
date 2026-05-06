import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { NewsAssetDTO, NewsCategoryDTO, NewsLinkDTO, PostStatus } from "./helpers";

interface NewsEditSidebarProps {
  isFeatured: boolean;
  setIsFeatured: (value: boolean) => void;
  showFeaturedImage: boolean;
  setShowFeaturedImage: (value: boolean) => void;
  enableGallery: boolean;
  setEnableGallery: (value: boolean) => void;
  enableLinks: boolean;
  setEnableLinks: (value: boolean) => void;
  status: PostStatus;
  setStatus: (value: PostStatus) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  categoriesLoading: boolean;
  categoriesError: string | null;
  categories: NewsCategoryDTO[];
  coverLocalPreview: string;
  coverAsset: NewsAssetDTO | null;
  mediaUrl: (url?: string | null) => string;
  onPickCover: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  galleryLocalPreviews: string[];
  gallery: NewsAssetDTO[];
  saving: boolean;
  onGalleryFilesChange: (files: File[]) => void;
  onDeleteGalleryImage: (assetId: string) => void;
  links: NewsLinkDTO[];
  addLink: () => void;
  removeLink: (index: number) => void;
  updateLink: (index: number, patch: Partial<NewsLinkDTO>) => void;
  safeDomain: (url: string) => string;
  apiOrigin: string;
}

export function NewsEditSidebar(props: NewsEditSidebarProps) {
  const {
    isFeatured,
    setIsFeatured,
    showFeaturedImage,
    setShowFeaturedImage,
    enableGallery,
    setEnableGallery,
    enableLinks,
    setEnableLinks,
    status,
    setStatus,
    categoryId,
    setCategoryId,
    categoriesLoading,
    categoriesError,
    categories,
    coverLocalPreview,
    coverAsset,
    mediaUrl,
    onPickCover,
    galleryLocalPreviews,
    gallery,
    saving,
    onGalleryFilesChange,
    onDeleteGalleryImage,
    links,
    addLink,
    removeLink,
    updateLink,
    safeDomain,
    apiOrigin,
  } = props;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <label className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-5 h-5 rounded text-regif-blue"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold">Matéria de Capa</span>
            <span className="text-[10px] text-gray-400">Destaque principal na Home</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={showFeaturedImage}
            onChange={(e) => setShowFeaturedImage(e.target.checked)}
            className="w-5 h-5 rounded text-regif-blue"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold">Mostrar imagem de destaque</span>
            <span className="text-[10px] text-gray-400">Se OFF, a capa fica só como “capa” interna</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={enableGallery}
            onChange={(e) => setEnableGallery(e.target.checked)}
            className="w-5 h-5 rounded text-regif-blue"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold">Ativar galeria</span>
            <span className="text-[10px] text-gray-400">Permite anexar múltiplas imagens no final</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={enableLinks}
            onChange={(e) => setEnableLinks(e.target.checked)}
            className="w-5 h-5 rounded text-regif-blue"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold">Ativar links relacionados</span>
            <span className="text-[10px] text-gray-400">Cards com título/descrição opcionais</span>
          </div>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full p-3 bg-gray-50 border rounded-xl text-sm"
          >
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="HIDDEN">Oculto</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categoriesLoading}
            className="w-full p-3 bg-gray-50 border rounded-xl text-sm disabled:opacity-60"
          >
            <option value="">{categoriesLoading ? "Carregando..." : "Sem categoria"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categoriesError ? (
            <p className="text-[10px] text-red-600">{categoriesError}</p>
          ) : (
            <p className="text-[10px] text-gray-400">
              Categoria usa o <b>ID</b> de <code>NewsCategory</code>.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">Imagem de capa/destaque (16:9)</h3>
        </div>
        <div className="aspect-video rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 overflow-hidden">
          {coverLocalPreview ? (
            <img src={coverLocalPreview} className="w-full h-full object-cover" alt="Preview capa" />
          ) : coverAsset?.url ? (
            <img src={mediaUrl(coverAsset.url)} className="w-full h-full object-cover" alt="Capa atual" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon size={32} />
              <p className="text-xs mt-2">Sem capa</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void onPickCover(e)}
          className="block w-full text-xs"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">Galeria</h3>
        </div>
        {!enableGallery ? (
          <div className="text-[11px] text-gray-500 bg-gray-50 border rounded-xl p-3">
            Galeria desativada. Ative acima para anexar imagens.
          </div>
        ) : (
          <>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.currentTarget.value = "";
                onGalleryFilesChange(files);
              }}
              className="block w-full text-xs"
            />
            {galleryLocalPreviews.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-600 mb-2">Pré-visualização (a enviar):</p>
                <div className="grid grid-cols-3 gap-2">
                  {galleryLocalPreviews.map((src, idx) => (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border bg-gray-50">
                      <img src={src} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {gallery.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-600 mb-2">Já anexadas:</p>
                <div className="grid grid-cols-3 gap-2">
                  {gallery.slice(0, 6).map((img) => (
                    <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border bg-gray-50">
                      <img src={mediaUrl(img.thumbUrl || img.url)} className="w-full h-full object-cover" alt="Galeria" />
                      <button
                        type="button"
                        onClick={() => onDeleteGalleryImage(img.id)}
                        disabled={saving}
                        className="absolute top-2 right-2 w-9 h-9 rounded-xl bg-white/90 border hover:bg-white grid place-items-center"
                        title="Remover"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
                {gallery.length > 6 && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Mostrando 6 de {gallery.length}. (A prévia completa você vê na página Preview)
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">Links relacionados</h3>
          <button
            type="button"
            onClick={addLink}
            disabled={!enableLinks}
            className={clsx(
              "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border",
              !enableLinks ? "opacity-60 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"
            )}
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
        {!enableLinks ? (
          <div className="text-[11px] text-gray-500 bg-gray-50 border rounded-xl p-3">
            Links desativados. Ative acima para adicionar.
          </div>
        ) : (
          <div className="space-y-3">
            {links.length === 0 ? (
              <p className="text-[11px] text-gray-500">Nenhum link adicionado.</p>
            ) : (
              links.map((l, idx) => (
                <div key={idx} className="border rounded-2xl p-3 bg-gray-50">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">URL</label>
                      <input
                        value={l.url}
                        onChange={(e) => updateLink(idx, { url: e.target.value })}
                        placeholder="https://..."
                        className="w-full mt-1 px-3 py-2 rounded-xl border bg-white text-xs"
                        required={enableLinks}
                      />
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Título (opcional)</label>
                          <input
                            value={l.title ?? ""}
                            onChange={(e) => updateLink(idx, { title: e.target.value })}
                            placeholder={safeDomain(l.url || "")}
                            className="w-full mt-1 px-3 py-2 rounded-xl border bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Descrição (opcional)</label>
                          <input
                            value={l.description ?? ""}
                            onChange={(e) => updateLink(idx, { description: e.target.value })}
                            placeholder="Texto curto..."
                            className="w-full mt-1 px-3 py-2 rounded-xl border bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="shrink-0 w-10 h-10 rounded-xl border bg-white hover:bg-gray-100 grid place-items-center"
                      title="Remover"
                    >
                      <Trash2 size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="text-[10px] text-gray-400 font-mono">
        <p>Debug:</p>
        <pre className="whitespace-pre-wrap break-all">
          {JSON.stringify(
            {
              apiOrigin,
              coverAsset: coverAsset?.url ?? null,
              showFeaturedImage,
              enableGallery,
              galleryCount: gallery.length,
              enableLinks,
              linksCount: links.length,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
