import { Link as RouterLink } from "react-router-dom";
import { Save, ArrowLeft, Loader2, AlertCircle, Type } from "lucide-react";
import clsx from "clsx";
import { EditorContent } from "@tiptap/react";

// Imports Modulares
import { useNewsEditor } from "../../hooks/useNewsEditor";
import { NewsEditorToolbar } from "../../components/admin/editor/NewsEditorToolbar";
import { NewsEditorSidebar } from "../../components/admin/editor/NewsEditorSidebar";
import { NewsEditorCover } from "../../components/admin/editor/NewsEditorCover";
import { NewsEditorCropModal } from "../../components/admin/editor/NewsEditorCropModal";
import { NewsEditorGallery } from "../../components/admin/editor/NewsEditorGallery";
import { NewsEditorLinks } from "../../components/admin/editor/NewsEditorLinks";

export function NewsEditor() {
  const { form, toggles, editor, media, links, handleSave } = useNewsEditor();
  const isBusy = form.saving || media.isUploading;

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      
      {/* Modal de Crop (só aparece se necessário) */}
      <NewsEditorCropModal media={media} />

      {/* === HEADER === */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <RouterLink to="/admin/news" className="p-2 text-gray-400 hover:text-regif-blue hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </RouterLink>
          <div>
            <h1 className="text-2xl font-bold text-regif-dark">Nova Notícia</h1>
            <p className="text-sm text-gray-500">Editor de conteúdo e mídia.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className={clsx(
            "px-6 py-2.5 bg-regif-green text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2",
            isBusy ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600 transform hover:scale-105"
          )}
        >
          {isBusy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {form.saving ? "Salvando..." : media.isUploading ? "Enviando mídia..." : "Salvar"}
        </button>
      </div>

      {/* === ERROS === */}
      {form.error && (
        <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div className="text-sm">
            <p className="font-bold">Não foi possível salvar</p>
            <p className="text-red-700">{form.error}</p>
          </div>
        </div>
      )}

      {/* === GRID LAYOUT === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA PRINCIPAL (Conteúdo) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Inputs Básicos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Type size={16} /> Título
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => form.setTitle(e.target.value)}
                placeholder="Digite o título da manchete..."
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 outline-none font-bold text-lg text-gray-800 placeholder:font-normal"
                required
              />
              <p className="text-[10px] text-gray-400 font-mono pl-1">Slug: /noticias/{form.slug || "..."}</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Resumo (Excerpt)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => form.setExcerpt(e.target.value)}
                placeholder="Breve descrição que aparece nos cards..."
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl h-24 resize-none text-sm focus:ring-2 focus:ring-regif-blue/20 outline-none"
              />
            </div>
          </div>

          {/* Editor Rico */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
            <NewsEditorToolbar editor={editor} />
            <div className="flex-1 bg-white cursor-text" onClick={() => editor?.chain().focus().run()}>
               <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL (Configurações & Mídia) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
          
          <NewsEditorSidebar 
            status={form.status} setStatus={form.setStatus}
            categoryId={form.categoryId} setCategoryId={form.setCategoryId}
            categories={form.categories}
            toggles={{
              isFeatured: form.isFeatured, setIsFeatured: form.setIsFeatured,
              showFeaturedImage: toggles.showFeaturedImage, setShowFeaturedImage: toggles.setShowFeaturedImage,
              enableGallery: toggles.enableGallery, setEnableGallery: toggles.setEnableGallery,
              enableLinks: toggles.enableLinks, setEnableLinks: toggles.setEnableLinks
            }}
          />

          <NewsEditorCover media={media} />

          <NewsEditorGallery 
            media={media} 
            enableGallery={toggles.enableGallery}
            setEnableGallery={toggles.setEnableGallery}
          />
          
          <NewsEditorLinks 
            links={links.items} 
            actions={links} // o hook retorna { add, remove, update } misturado no objeto
            enableLinks={toggles.enableLinks}
            setEnableLinks={toggles.setEnableLinks}
          />

        </div>
      </div>
    </form>
  );
}