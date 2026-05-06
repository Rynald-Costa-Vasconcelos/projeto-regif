import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Coins,
  FileText,
  ImageIcon,
  Loader2,
  Megaphone,
  Package,
} from "lucide-react";
import clsx from "clsx";

import {
  createAdminShopProduct,
  deleteAdminShopMediaTmp,
  getAdminShopProduct,
  listAdminShopCategories,
  SHOP_PRODUCT_IMAGE_CROP_PX,
  updateAdminShopProduct,
  uploadAdminShopCoverTmp,
  uploadAdminShopGalleryTmp,
  type ShopAdminProduct,
  type ShopAdminProductPayload,
  type ShopProductStatus,
  type ShopPublicCategory,
} from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";
import type { Area } from "./newsEdit/helpers";
import { getCroppedBlob, getImageSize, mediaUrl } from "./newsEdit/helpers";
import { ShopSquareCropModal } from "./ShopSquareCropModal";

type GalleryTmpRow = { tmpId: string; thumbUrl: string };

const fieldInputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20";

const fieldLabelClass = "block text-xs font-bold uppercase tracking-wide text-gray-500";

const panelClass =
  "rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-sm shadow-gray-200/40";

const imagesPanelClass =
  "rounded-2xl border-2 border-regif-blue/25 bg-white p-5 sm:p-8 shadow-md ring-1 ring-regif-blue/10";

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof FileText;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-bold text-regif-dark tracking-tight">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-regif-blue/10 text-regif-blue">
        <Icon size={18} strokeWidth={2} />
      </span>
      {children}
    </h2>
  );
}

export function ShopProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<ShopPublicCategory[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ShopProductStatus>("DRAFT");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("29.90");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");

  /** Imagens já salvas (edição). */
  const [publishedImages, setPublishedImages] = useState<ShopAdminProduct["images"]>([]);
  /** tmpId da capa após upload (novo ou troca). */
  const [coverTmpId, setCoverTmpId] = useState<string | null>(null);
  /** Prévia da capa (temp ou publicada). */
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  /** Novas fotos da galeria (tmp). */
  const [galleryAdds, setGalleryAdds] = useState<GalleryTmpRow[]>([]);
  /** Imagens publicadas marcadas para exclusão ao salvar (só edição). */
  const [pendingDeleteImageIds, setPendingDeleteImageIds] = useState<string[]>([]);

  const [cropFor, setCropFor] = useState<"cover" | "gallery" | null>(null);
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [cropSaving, setCropSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await listAdminShopCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p: ShopAdminProduct = await getAdminShopProduct(id!);
        if (cancelled) return;
        setTitle(p.title);
        setExcerpt(p.excerpt ?? "");
        setDescription(p.description ?? "");
        setStatus(p.status);
        setCategoryId(p.category?.id ?? "");
        setPrice(String(p.price ?? "0").replace(".", ","));
        setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice).replace(".", ",") : "");
        setStockQuantity(String(p.stockQuantity ?? 0));
        setPublishedImages(p.images ?? []);
        setCoverPreviewUrl(null);
        setCoverTmpId(null);
        setGalleryAdds([]);
        setPendingDeleteImageIds([]);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(toApiError(e).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const categoryGroups = useMemo(() => {
    const roots = categories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return roots.map((root) => ({
      root,
      children: categories
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    }));
  }, [categories]);

  const openCropModal = (file: File, kind: "cover" | "gallery") => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const src = URL.createObjectURL(file);
    setCropSrc(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
    setCropFor(kind);
  };

  const closeCropModal = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc("");
    setCropFor(null);
    setCroppedPixels(null);
  };

  const onPickCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    setError(null);
    try {
      const { w, h } = await getImageSize(f);
      if (w < 400 || h < 400) {
        setError("Imagem muito pequena para a lojinha. Use pelo menos 400×400 px.");
        return;
      }
      openCropModal(f, "cover");
    } catch {
      setError("Não foi possível ler a imagem. Tente outro arquivo.");
    }
  };

  const onPickGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    setError(null);
    try {
      const { w, h } = await getImageSize(f);
      if (w < 400 || h < 400) {
        setError("Imagem muito pequena. Mínimo 400×400 px.");
        return;
      }
      openCropModal(f, "gallery");
    } catch {
      setError("Não foi possível ler a imagem. Tente outro arquivo.");
    }
  };

  const confirmCrop = async () => {
    if (!cropSrc || !croppedPixels || !cropFor) {
      setError("Ajuste o recorte antes de confirmar.");
      return;
    }
    setCropSaving(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedPixels, {
        width: SHOP_PRODUCT_IMAGE_CROP_PX,
        height: SHOP_PRODUCT_IMAGE_CROP_PX,
      });
      const outFile = new File([blob], `shop_${Date.now()}.jpg`, { type: "image/jpeg" });

      if (cropFor === "cover") {
        if (coverTmpId) {
          await deleteAdminShopMediaTmp(coverTmpId).catch(() => {});
        }
        const r = await uploadAdminShopCoverTmp(outFile);
        setCoverTmpId(r.tmpId);
        setCoverPreviewUrl(mediaUrl(r.thumbUrl));
      } else {
        const r = await uploadAdminShopGalleryTmp([outFile]);
        const item = r.items[0];
        if (item) {
          setGalleryAdds((prev) => [...prev, { tmpId: item.tmpId, thumbUrl: item.thumbUrl }]);
        }
      }

      URL.revokeObjectURL(cropSrc);
      setCropSrc("");
      setCropFor(null);
      setCroppedPixels(null);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setCropSaving(false);
    }
  };

  const removeGalleryAdd = async (tmpId: string) => {
    try {
      await deleteAdminShopMediaTmp(tmpId);
    } catch {
      /* ignore */
    }
    setGalleryAdds((prev) => prev.filter((x) => x.tmpId !== tmpId));
  };

  const removePendingCover = async () => {
    if (!coverTmpId) return;
    try {
      await deleteAdminShopMediaTmp(coverTmpId);
    } catch {
      /* ignore */
    }
    setCoverTmpId(null);
    setCoverPreviewUrl(null);
  };

  const buildPayload = (): ShopAdminProductPayload | Partial<ShopAdminProductPayload> => {
    const base = {
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      description: description.trim() || null,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      categoryId: categoryId || null,
      price: price.trim().replace(",", "."),
      compareAtPrice: compareAtPrice.trim() ? compareAtPrice.trim().replace(",", ".") : null,
      stockQuantity: Math.max(0, Math.floor(Number(stockQuantity.replace(",", ".")) || 0)),
    };

    if (isNew) {
      return {
        ...base,
        coverTmpId: coverTmpId!,
        galleryTmpIds: galleryAdds.map((g) => g.tmpId),
      };
    }

    const patch: Partial<ShopAdminProductPayload> = { ...base };
    if (coverTmpId) patch.coverTmpId = coverTmpId;
    if (galleryAdds.length) patch.galleryTmpIds = galleryAdds.map((g) => g.tmpId);
    if (pendingDeleteImageIds.length) patch.deleteImageIds = [...new Set(pendingDeleteImageIds)];
    return patch;
  };

  const stillPublishedImages = publishedImages.filter((i) => !pendingDeleteImageIds.includes(i.id));

  const togglePendingDeleteImage = (imageId: string) => {
    setPendingDeleteImageIds((prev) => {
      if (prev.includes(imageId)) {
        setError(null);
        return prev.filter((x) => x !== imageId);
      }
      const next = [...prev, imageId];
      const still = publishedImages.filter((i) => !next.includes(i.id));
      if (still.length === 0 && !coverTmpId) {
        setError("Para remover todas as fotos publicadas, envie antes uma nova capa (upload).");
        return prev;
      }
      setError(null);
      return next;
    });
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (isNew && !coverTmpId) {
      setError("A capa do produto é obrigatória. Envie e recorte uma imagem quadrada.");
      setSaving(false);
      return;
    }
    if (!isNew && stillPublishedImages.length === 0 && !coverTmpId) {
      setError("Envie uma nova capa ou desfaça exclusões até restar ao menos uma imagem publicada.");
      setSaving(false);
      return;
    }
    try {
      const payload = buildPayload();
      if (isNew) {
        const created = await createAdminShopProduct(payload as ShopAdminProductPayload);
        navigate(`/admin/shop/products/${created.id}`, { replace: true });
      } else {
        await updateAdminShopProduct(id!, payload);
        navigate("/admin/shop");
      }
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gray-50/80 text-regif-blue">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  const primaryStill =
    stillPublishedImages.length > 0
      ? (stillPublishedImages.find((i) => i.isPrimary) ?? stillPublishedImages[0])
      : null;
  const coverBoxSrc =
    coverTmpId && coverPreviewUrl ? coverPreviewUrl : primaryStill ? mediaUrl(primaryStill.thumbUrl || primaryStill.url) : null;

  const formId = "shop-product-form";

  return (
    <>
    <form
      id={formId}
      onSubmit={onSave}
      className="w-full max-w-full space-y-6 pb-20 animate-in fade-in duration-300 md:space-y-8"
    >
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/admin/shop"
            className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-regif-blue"
            title="Voltar para a lojinha"
          >
            <ArrowLeft size={24} strokeWidth={2} aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-regif-dark">{isNew ? "Novo produto" : "Editar produto"}</h1>
            <p className="text-sm text-gray-500">
              {isNew
                ? "Cadastre fotos, texto e preços para exibir na loja pública."
                : "Atualize dados, imagens e estoque do produto na lojinha."}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={clsx(
            "inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-regif-green px-6 text-sm font-bold text-white shadow-lg transition-all md:w-auto",
            saving ? "cursor-not-allowed opacity-70" : "hover:bg-green-600 hover:shadow-green-900/15"
          )}
        >
          {saving ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : null}
          {saving ? "Salvando…" : isNew ? "Criar produto" : "Salvar alterações"}
        </button>
      </div>

      {error && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8">
        <section className={clsx(panelClass, "space-y-5")}>
          <SectionTitle icon={FileText}>Conteúdo do produto</SectionTitle>
          <p className="-mt-1 text-xs text-gray-500">Nome, resumo e descrição exibidos na loja pública.</p>

          <div>
            <label className={fieldLabelClass} htmlFor="shop-p-title">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="shop-p-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldInputClass}
              placeholder="Ex.: Camisa oficial REGIF"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
              O slug da URL é gerado automaticamente a partir do título e atualiza se você mudar o nome.
            </p>
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="shop-p-excerpt">
              Resumo
            </label>
            <input
              id="shop-p-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className={fieldInputClass}
              placeholder="Uma linha que aparece na listagem da loja"
            />
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="shop-p-desc">
              Descrição
            </label>
            <textarea
              id="shop-p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              className={clsx(fieldInputClass, "min-h-[220px] resize-y leading-relaxed")}
              placeholder="Detalhes do produto, materiais, tamanhos, observações de envio…"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
              Texto simples. Quebras de linha são preservadas na página do produto.
            </p>
          </div>
        </section>

        <section className={clsx(imagesPanelClass, "space-y-6")}>
          <div className="flex flex-col gap-2 border-b border-regif-blue/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle icon={ImageIcon}>Fotos do produto</SectionTitle>
            <span className="text-xs font-semibold uppercase tracking-wide text-regif-blue">Capa obrigatória na criação</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            A capa aparece nos cards da loja. Use imagem nítida; o recorte é quadrado 1:1 e o sistema exporta em{" "}
            {SHOP_PRODUCT_IMAGE_CROP_PX}×{SHOP_PRODUCT_IMAGE_CROP_PX}px. Arquivo original com pelo menos 400×400 px.
          </p>

          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickCoverFile} />

          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-10">
            <div className="flex flex-col items-center justify-center lg:items-stretch">
              <div className="aspect-square w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner sm:max-w-md lg:max-w-none">
                {coverBoxSrc ? (
                  <img src={coverBoxSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 px-6 text-center sm:min-h-[240px]">
                    <Package className="text-gray-300" size={40} strokeWidth={1.5} aria-hidden />
                    <span className="text-sm font-medium text-gray-500">Nenhuma capa selecionada</span>
                    <span className="text-xs text-gray-400">Clique no botão ao lado para enviar</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-regif-blue text-sm font-bold text-white shadow-md transition hover:bg-blue-800"
              >
                {isNew ? "Escolher imagem e recortar capa" : "Trocar capa (recorte)"}
              </button>
              {coverTmpId ? (
                <button
                  type="button"
                  onClick={() => void removePendingCover()}
                  className="text-center text-sm font-semibold text-red-600 underline decoration-red-200 underline-offset-2 hover:text-red-800"
                >
                  {isNew ? "Remover capa enviada" : "Descartar nova capa"}
                </button>
              ) : null}
              <p className="text-xs leading-relaxed text-gray-500">
                Na edição, se remover todas as fotos já publicadas, envie uma nova capa antes de salvar.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold text-regif-dark">Galeria adicional</h3>
              <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                Opcional
              </span>
            </div>
            <p className="mb-4 text-sm text-gray-600">Mais fotos na página do produto; cada uma usa o mesmo recorte quadrado.</p>
            <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickGalleryFile} />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-800 transition hover:border-regif-blue/35 hover:bg-white sm:w-auto sm:px-6"
            >
              + Adicionar foto à galeria
            </button>

            {!isNew && publishedImages.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-gray-700">Imagens já na loja</p>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const remainingCount = publishedImages.filter((x) => !pendingDeleteImageIds.includes(x.id)).length;
                    return publishedImages.map((im) => {
                      const marked = pendingDeleteImageIds.includes(im.id);
                      const blockRemoveAll = remainingCount === 1 && !marked && !coverTmpId;
                      return (
                        <div
                          key={im.id}
                          className={clsx(
                            "relative w-[6.5rem] overflow-hidden rounded-xl border bg-white shadow-sm sm:w-28",
                            marked ? "border-red-200 opacity-55" : "border-gray-200"
                          )}
                        >
                          <div className="aspect-square w-full overflow-hidden">
                            <img
                              src={mediaUrl(im.thumbUrl || im.url)}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          {im.isPrimary && (
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-regif-blue px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                              Capa
                            </span>
                          )}
                          <div className="border-t border-gray-100">
                            <button
                              type="button"
                              disabled={blockRemoveAll}
                              title={
                                blockRemoveAll
                                  ? "Envie uma nova capa antes de remover a única imagem"
                                  : marked
                                    ? "Desfazer exclusão"
                                    : "Marcar para excluir ao salvar"
                              }
                              onClick={() => togglePendingDeleteImage(im.id)}
                              className={clsx(
                                "w-full py-1.5 text-[11px] font-bold",
                                marked ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-red-50 text-red-700 hover:bg-red-100",
                                "disabled:cursor-not-allowed disabled:opacity-40"
                              )}
                            >
                              {marked ? "Desfazer" : "Excluir"}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {galleryAdds.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-gray-700">Novas fotos (gravadas ao salvar)</p>
                <div className="flex flex-wrap gap-3">
                  {galleryAdds.map((g) => (
                    <div
                      key={g.tmpId}
                      className="relative h-28 w-28 overflow-hidden rounded-xl border-2 border-regif-green/40 shadow-sm sm:h-32 sm:w-32"
                    >
                      <img src={mediaUrl(g.thumbUrl)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        title="Remover"
                        onClick={() => void removeGalleryAdd(g.tmpId)}
                        className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-bl-lg bg-black/65 text-base font-bold text-white transition hover:bg-black/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={clsx(panelClass, "space-y-4")}>
          <SectionTitle icon={Megaphone}>Publicação</SectionTitle>
          <div>
            <label className={fieldLabelClass} htmlFor="shop-p-status">
              Status
            </label>
            <select
              id="shop-p-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ShopProductStatus)}
              className={fieldInputClass}
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="shop-p-cat">
              Categoria
            </label>
            <select
              id="shop-p-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldInputClass}
            >
              <option value="">— Nenhuma —</option>
              {categoryGroups.map(({ root, children }) => (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>Toda a seção ({root.name})</option>
                  {children.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">Subcategoria ou seção inteira do catálogo REGIF.</p>
          </div>
        </section>

        <section className={clsx(panelClass, "space-y-4")}>
          <SectionTitle icon={Coins}>Preço e estoque</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className={fieldLabelClass} htmlFor="shop-p-price">
                Preço (BRL) <span className="text-red-500">*</span>
              </label>
              <input
                id="shop-p-price"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={fieldInputClass}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="sm:col-span-1">
              <label className={fieldLabelClass} htmlFor="shop-p-compare">
                Preço “de” <span className="font-normal normal-case text-gray-400">(opcional)</span>
              </label>
              <input
                id="shop-p-compare"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="ex.: 39,90"
                className={fieldInputClass}
                inputMode="decimal"
              />
            </div>
            <div className="sm:col-span-1">
              <label className={fieldLabelClass} htmlFor="shop-p-stock">
                Estoque
              </label>
              <input
                id="shop-p-stock"
                type="number"
                min={0}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className={fieldInputClass}
              />
              <p className="mt-1 text-xs text-gray-500">Unidades à venda.</p>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-gray-500">
          {isNew ? "Depois de criar, você continua nesta página para ajustes finos." : "Ao salvar, você retorna à listagem da lojinha."}
        </p>
      </div>
    </form>

    <ShopSquareCropModal
      isOpen={cropFor !== null}
      cropSrc={cropSrc}
      crop={crop}
      zoom={zoom}
      setCrop={setCrop}
      setZoom={setZoom}
      onCropComplete={(_: unknown, pixels: Area) => setCroppedPixels(pixels)}
      onClose={closeCropModal}
      onConfirm={() => void confirmCrop()}
      saving={cropSaving}
      canConfirm={Boolean(croppedPixels)}
      isCover={cropFor === "cover"}
    />
    </>
  );
}
