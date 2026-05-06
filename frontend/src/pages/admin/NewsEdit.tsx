// src/pages/admin/NewsEdit.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Type,
  AlertCircle,
  Loader2,
  ServerCrash,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../../lib/api";
import type { AxiosError } from "axios";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlignExt from "@tiptap/extension-text-align";
import { NewsEditSidebar } from "./newsEdit/NewsEditSidebar";
import { NewsEditCropModal } from "./newsEdit/NewsEditCropModal";
import { NewsEditorToolbar } from "../../features/news/components/admin/editor/NewsEditorToolbar";
import { normalizeNewsContentHtml } from "../../features/news/utils";
import {
  API_ORIGIN,
  REQUEST_TIMEOUT_MS,
  apiGet,
  apiPatch,
  generateSlug,
  getCroppedBlob,
  getImageSize,
  humanizeAxiosError,
  mediaUrl,
  safeDomain,
  toApiError,
  type ApiError,
  type Area,
  type ErrorPayload,
  type NewsAssetDTO,
  type NewsCategoryDTO,
  type NewsLinkDTO,
  type NewsPostDTO,
  type PostStatus,
} from "./newsEdit/helpers";

export function NewsEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<ApiError | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);

  const [categories, setCategories] = useState<NewsCategoryDTO[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // ✅ novos toggles
  const [showFeaturedImage, setShowFeaturedImage] = useState(true);
  const [enableGallery, setEnableGallery] = useState(false);
  const [enableLinks, setEnableLinks] = useState(false);

  // ✅ assets / links
  const [coverAsset, setCoverAsset] = useState<NewsAssetDTO | null>(null);
  const [assets, setAssets] = useState<NewsAssetDTO[]>([]);
  const [links, setLinks] = useState<NewsLinkDTO[]>([]);

  // ✅ uploads
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverLocalPreview, setCoverLocalPreview] = useState<string>("");

  // ====== CROP DA CAPA ======
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryLocalPreviews, setGalleryLocalPreviews] = useState<string[]>([]);

  // TipTap
  const [loadedContentHtml, setLoadedContentHtml] = useState<string>("");
  const [didHydrateEditor, setDidHydrateEditor] = useState(false);

  // Cancela request pendente
  const abortRef = useRef<AbortController | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextAlignExt.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm max-w-none",
          "sm:prose-sm lg:prose",
          "min-h-[300px] p-4 focus:outline-none",
          "prose-p:leading-7 prose-p:text-gray-800",
          "prose-headings:text-regif-dark prose-headings:font-extrabold prose-headings:tracking-tight",
          "prose-a:text-regif-blue prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
          "prose-strong:text-gray-900",
          "prose-blockquote:border-l-regif-blue prose-blockquote:text-gray-700 prose-blockquote:not-italic",
          "prose-ul:my-4 prose-ol:my-4 prose-li:my-1"
        ),
      },
    },
  });

  // slug automático
  useEffect(() => {
    setSlug(generateSlug(title));
  }, [title]);

  // carrega notícia
  useEffect(() => {
    if (!id) {
      setPageLoading(false);
      setPageError({ message: "ID da notícia ausente na rota." });
      return;
    }

    fetchPost(id);
    fetchCategories();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchPost(postId: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setPageLoading(true);
      setPageError(null);
      setFormError(null);

      const res = await apiGet<NewsPostDTO>(`/news/${postId}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      const payload = res.data as NewsPostDTO | { data?: NewsPostDTO };
      const post: NewsPostDTO =
        payload && typeof payload === "object" && "data" in payload
          ? ((payload.data ?? {}) as NewsPostDTO)
          : (payload as NewsPostDTO);

      if (controller.signal.aborted) return;

      setTitle(post.title ?? "");
      setSlug(post.slug ?? generateSlug(post.title ?? ""));
      setExcerpt(post.excerpt ?? "");
      setStatus((post.status ?? "DRAFT") as PostStatus);
      setIsFeatured(Boolean(post.isFeatured));
      setCategoryId(post.categoryId ?? post.category?.id ?? "");

      setShowFeaturedImage(post.showFeaturedImage !== false);
      setEnableGallery(Boolean(post.enableGallery));
      setEnableLinks(Boolean(post.enableLinks));

      setCoverAsset(post.coverAsset ?? null);
      setAssets(post.assets ?? []);
      setLinks((post.links ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

      // reseta uploads locais ao trocar de post
      setCoverFile(null);
      setCoverLocalPreview("");
      setGalleryFiles([]);
      setGalleryLocalPreviews([]);

      // TipTap
      setLoadedContentHtml(normalizeNewsContentHtml(post.contentHtml) ?? "<p></p>");
      setDidHydrateEditor(false);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "CanceledError") return;
      if (!controller.signal.aborted) setPageError(toApiError(err));
    } finally {
      if (!controller.signal.aborted) setPageLoading(false);
    }
  }

  // hidrata editor
  useEffect(() => {
    if (!editor) return;
    if (didHydrateEditor) return;

    editor.commands.setContent(loadedContentHtml || "<p></p>", { emitUpdate: false });
    setDidHydrateEditor(true);
  }, [editor, loadedContentHtml, didHydrateEditor]);

  // ====== LINKS (editor simples) ======
  function addLink() {
    if (!enableLinks) setEnableLinks(true);
    setLinks((prev) => [
      ...prev,
      { url: "", title: "", description: "", order: prev.length },
    ]);
  }

  function removeLink(index: number) {
    setLinks((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((l, idx) => ({ ...l, order: idx }))
    );
  }

  function updateLink(index: number, patch: Partial<NewsLinkDTO>) {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  }

  // ====== UPLOADS (preview local) ======
  useEffect(() => {
    if (!coverFile) {
      setCoverLocalPreview("");
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!galleryFiles.length) {
      setGalleryLocalPreviews([]);
      return;
    }
    const urls = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryLocalPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryFiles]);

  const onCropComplete = (_: unknown, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  async function fetchCategories() {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      const res = await apiGet<NewsCategoryDTO[] | { data?: NewsCategoryDTO[] }>("/news/categories", {
        headers: { Accept: "application/json" },
      });

      const payload = res.data as NewsCategoryDTO[] | { data?: NewsCategoryDTO[] };
      const raw =
        payload && typeof payload === "object" && "data" in payload
          ? payload.data
          : payload;
      const list: NewsCategoryDTO[] = Array.isArray(raw) ? raw : [];

      setCategories(list);
    } catch (err: unknown) {
      setCategories([]);
      setCategoriesError(toApiError(err).message);
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function confirmCropCover() {
    try {
      setFormError(null);

      if (!cropSrc) {
        setFormError("Imagem de crop não carregada.");
        return;
      }
      if (!croppedAreaPixels) {
        setFormError("Selecione a área do recorte antes de confirmar.");
        return;
      }

      setSaving(true);

      // ✅ Sempre gera 1280x720
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels, { width: 1280, height: 720 });

      const file = new File([blob], `cover_${Date.now()}.jpg`, { type: "image/jpeg" });

      // coloca como capa (preview local vai atualizar pelo useEffect)
      setCoverFile(file);

      // fecha modal e limpa src (libera memória)
      URL.revokeObjectURL(cropSrc);
      setCropSrc("");
      setIsCropOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setFormError((err as { message?: string })?.message ?? "Falha ao recortar a imagem. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function doUploadCover(postId: string, file: File) {
    const { w, h } = await getImageSize(file);
    if (w < 1280 || h < 720) {
      throw new Error(`Imagem muito pequena (${w}x${h}). Mínimo: 1280x720 (16:9).`);
    }

    const fd = new FormData();
    fd.append("cover", file);

    await api.post(`/news/${postId}/cover`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  async function doUploadGallery(postId: string, files: File[]) {
    if (!files.length) return;

    const fd = new FormData();
    for (const f of files) fd.append("images", f); // ⚠️ mantenho "images" igual ao teu código

    await api.post(`/news/${postId}/gallery`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  async function deleteGalleryImage(assetId: string) {
    if (!id) return;

    const ok = window.confirm("Remover esta imagem da galeria?");
    if (!ok) return;

    try {
      setSaving(true);
      setFormError(null);

      await api.delete(`/news/${id}/gallery/${assetId}`, { timeout: REQUEST_TIMEOUT_MS });

      // otimista: remove do state sem precisar refetch
      setAssets((prev) =>
        prev
          .filter((a) => a.id !== assetId)
          .map((a, idx) => (a.role === "GALLERY" ? { ...a, order: idx } : a))
      );
    } catch (err: unknown) {
      const e = err as AxiosError<ErrorPayload>;
      setFormError(e.response?.data?.erro || "Erro ao remover imagem.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!id || !editor) return;

    // CAPTURA O CONTEÚDO REAL DO TIPTAP NO MOMENTO DO CLIQUE
    const currentHtml = editor.getHTML();
    const plainText = editor.getText().trim();

    // Validação local rápida antes de enviar
    if (title.trim().length < 5) {
      setFormError("O título deve ter pelo menos 5 caracteres.");
      return;
    }
    if (plainText.length < 10) {
      setFormError("O conteúdo é obrigatório (mínimo de 10 caracteres).");
      return;
    }

    setSaving(true);

    try {
      (document.activeElement as HTMLElement | null)?.blur();

      if (enableLinks) {
        const hasAnyUrl = links.some((l) => (l.url ?? "").trim().length > 0);
        if (!hasAnyUrl) {
          setFormError("Você ativou links, mas nenhuma URL foi preenchida.");
          setSaving(false);
          return;
        }
      }

      const cleanedLinks = enableLinks
        ? links
            .filter((l) => l.url.trim() !== "")
            .map((l, idx) => ({
              id: l.id,
              url: l.url.trim(),
              title: (l.title ?? "").trim() || null,
              description: (l.description ?? "").trim() || null,
              order: idx,
            }))
        : [];

      if (enableLinks) {
        const invalidLink = cleanedLinks.find((l) => {
          try {
            const parsed = new URL(l.url);
            return !/^https?:$/i.test(parsed.protocol);
          } catch {
            return true;
          }
        });

        if (invalidLink) {
          setFormError(`URL inválida em links relacionados: ${invalidLink.url}`);
          setSaving(false);
          return;
        }
      }

      const payload = {
        title: title.trim(),
        contentHtml: currentHtml,
        status,
        isFeatured,
        excerpt: excerpt.trim() || null,
        categoryId: categoryId.trim() ? categoryId.trim() : null,
        showFeaturedImage,
        enableGallery,
        enableLinks,
        links: cleanedLinks,
      };

      // 1) salva dados textuais
      await apiPatch(`/news/${id}`, payload);

      // 2) se tem capa selecionada localmente, envia
      if (coverFile) {
        await doUploadCover(id, coverFile);
        setCoverFile(null);
        setCoverLocalPreview(""); // opcional
      }

      // 3) se galeria está ativa e tem arquivos selecionados, envia
      if (enableGallery && galleryFiles.length) {
        await doUploadGallery(id, galleryFiles);
        setGalleryFiles([]);
        setGalleryLocalPreviews([]); // opcional mas recomendado
      }

      // 4) refetch (pra garantir estado consistente)
      await fetchPost(id);

      // 5) agora sim navega
      navigate(`/admin/news`);
    } catch (err) {
      const e = err as AxiosError<ErrorPayload>;
      // se o erro vier dos uploads (throw new Error), cai aqui também:
      setFormError(e.response ? humanizeAxiosError(e) : (err as { message?: string })?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }

  }

  const gallery = useMemo(() => {
    return (assets ?? [])
      .filter((a) => a.role === "GALLERY")
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [assets]);

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto py-20">
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-regif-blue mb-4" size={40} />
          <p className="text-gray-500 font-medium tracking-tight">Carregando notícia...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-4">
        <div className="bg-white rounded-2xl border-2 border-red-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-red-50 p-6 flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-red-600">
              <ServerCrash size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900">Falha ao carregar</h3>
              <p className="text-red-700 text-sm mt-1">{pageError.message}</p>
              <p className="text-[10px] text-red-700/70 mt-2 font-mono break-all">
                {pageError.url ? `Endpoint: ${pageError.url}` : null}
              </p>
            </div>
            <button
              onClick={() => id && fetchPost(id)}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>

        <Link
          to="/admin/news"
          className="inline-flex items-center gap-2 text-regif-blue font-bold hover:underline"
        >
          <ArrowLeft size={18} /> Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/news")}
            className="p-2 text-gray-400 hover:text-regif-blue hover:bg-gray-100 rounded-xl"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-regif-dark">Editar Notícia</h1>
            <p className="text-sm text-gray-500">
              Atualize título, conteúdo e mídia da publicação.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={clsx(
            "px-6 py-2.5 bg-regif-green text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2",
            saving ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Salvando...
            </>
          ) : (
            <>
              <Save size={18} /> Salvar
            </>
          )}
        </button>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle className="mt-0.5" size={18} />
          <div className="text-sm">
            <p className="font-bold">Atenção</p>
            <p className="text-red-700">{formError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== COLUNA ESQUERDA ===== */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Type size={16} /> Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 outline-none font-semibold"
                required
              />
              <p className="text-[10px] text-gray-400 font-mono">Link: /noticias/{slug}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Subtítulo/Resumo (Excerpt)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl h-20 resize-none text-sm"
              />
            </div>
          </div>

          {/* Toolbar TipTap */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <NewsEditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* ===== COLUNA DIREITA ===== */}
        <NewsEditSidebar
          isFeatured={isFeatured}
          setIsFeatured={setIsFeatured}
          showFeaturedImage={showFeaturedImage}
          setShowFeaturedImage={setShowFeaturedImage}
          enableGallery={enableGallery}
          setEnableGallery={setEnableGallery}
          enableLinks={enableLinks}
          setEnableLinks={setEnableLinks}
          status={status}
          setStatus={setStatus}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          categories={categories}
          coverLocalPreview={coverLocalPreview}
          coverAsset={coverAsset}
          mediaUrl={mediaUrl}
          onPickCover={async (e) => {
            const f = e.target.files?.[0] ?? null;
            e.currentTarget.value = "";
            if (!f) return;
            setFormError(null);
            const { w, h } = await getImageSize(f);
            const is16by9 = Math.abs(w / h - 16 / 9) < 0.02;
            if (w >= 1280 && h >= 720 && is16by9) {
              setCoverFile(f);
              return;
            }
            const src = URL.createObjectURL(f);
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(src);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            setCroppedAreaPixels(null);
            setIsCropOpen(true);
          }}
          galleryLocalPreviews={galleryLocalPreviews}
          gallery={gallery}
          saving={saving}
          onGalleryFilesChange={setGalleryFiles}
          onDeleteGalleryImage={(assetId) => void deleteGalleryImage(assetId)}
          links={links}
          addLink={addLink}
          removeLink={removeLink}
          updateLink={updateLink}
          safeDomain={safeDomain}
          apiOrigin={API_ORIGIN}
        />
      </div>
      <NewsEditCropModal
        isOpen={isCropOpen}
        cropSrc={cropSrc}
        crop={crop}
        zoom={zoom}
        setCrop={setCrop}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
        onClose={() => {
          if (cropSrc) URL.revokeObjectURL(cropSrc);
          setCropSrc("");
          setIsCropOpen(false);
        }}
        onConfirm={() => void confirmCropCover()}
        saving={saving}
        canConfirm={Boolean(croppedAreaPixels)}
      />
    </form>
  );
}

