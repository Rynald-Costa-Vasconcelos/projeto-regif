import { useState, useEffect, type FormEvent } from "react"; // ✅ type FormEvent
import type { AxiosError } from "axios";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlignExt from "@tiptap/extension-text-align";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import { useNewsMedia } from "./useNewsMedia";
import { newsApi } from "../api/news.api";
import { generateSlug, humanizeAxiosError } from "../utils";
import type { NewsCategoryDTO, NewsLinkDTO, PostStatus } from "../types"; // ✅ import type

export function useNewsEditor() {
  const navigate = useNavigate();
  const media = useNewsMedia();

  // Form States
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);

  // Toggles
  const [showFeaturedImage, setShowFeaturedImage] = useState(true);
  const [enableGallery, setEnableGallery] = useState(false);
  const [enableLinks, setEnableLinks] = useState(false);

  // Data
  const [categories, setCategories] = useState<NewsCategoryDTO[]>([]);
  const [links, setLinks] = useState<NewsLinkDTO[]>([]);
  
  // UI States
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Editor Tiptap
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
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm max-w-none min-h-[340px] p-4 focus:outline-none",
          "prose-headings:text-regif-dark prose-headings:font-extrabold",
          "prose-a:text-regif-blue prose-a:no-underline hover:prose-a:underline"
        ),
      },
    },
  });

  // Effects
  useEffect(() => setSlug(generateSlug(title)), [title]);

  useEffect(() => {
    const controller = new AbortController();
    setCategoriesLoading(true);
    newsApi.fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => {}) // ignora erro de cancelamento
      .finally(() => setCategoriesLoading(false));
    return () => controller.abort();
  }, []);

  // ✅ HANDLERS DE TOGGLE COM LIMPEZA SEGURA
  // (Substitui os useEffects que causavam loops com o objeto `media`)
  
  const handleToggleFeaturedImage = (checked: boolean) => {
    setShowFeaturedImage(checked);
    if (!checked) {
       media.cover.clear(); // Limpa imperativamente
    }
  };

  const handleToggleGallery = (checked: boolean) => {
    setEnableGallery(checked);
    if (!checked) {
       media.gallery.clear(); // Limpa imperativamente
    }
  };

  const handleToggleLinks = (checked: boolean) => {
    setEnableLinks(checked);
    // Se quiser limpar links ao desativar, descomente abaixo:
    // if (!checked) setLinks([]);
  };

  // Links Actions
  const linksActions = {
    add: () => setLinks(prev => [...prev, { url: "", title: "", description: "", order: prev.length }]),
    remove: (index: number) => setLinks(prev => prev.filter((_, i) => i !== index).map((l, idx) => ({ ...l, order: idx }))),
    update: (index: number, patch: Partial<NewsLinkDTO>) => setLinks(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l))),
  };

  // Submit
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editor) return;
    const contentHtml = editor.getHTML();
    const plainText = editor.getText().trim();

    if (title.trim().length < 5) return setFormError("Título muito curto (mínimo 5).");
    if (plainText.length < 10) return setFormError("Conteúdo obrigatório (mínimo 10).");
    if (showFeaturedImage && !media.cover.tmpId) return setFormError("Capa obrigatória quando 'Mostrar imagem' está ativo.");
    if (enableGallery && !media.gallery.tmpIds.length) return setFormError("Galeria vazia.");

    setSaving(true);
    try {
      const cleanedLinks = enableLinks
        ? links
            .filter((l) => l.url.trim())
            .map((l, i) => ({
              ...l,
              url: l.url.trim(),
              title: l.title?.trim() || null,
              description: l.description?.trim() || null,
              order: i,
            }))
        : [];

      if (enableLinks) {
        if (!cleanedLinks.length) {
          setFormError("Links ativados, mas nenhum link válido foi preenchido.");
          setSaving(false);
          return;
        }

        const firstInvalid = cleanedLinks.find((l) => {
          try {
            const parsed = new URL(l.url);
            return !/^https?:$/i.test(parsed.protocol);
          } catch {
            return true;
          }
        });
        if (firstInvalid) {
          setFormError(`URL inválida em links relacionados: ${firstInvalid.url}`);
          setSaving(false);
          return;
        }
      }
      
      await newsApi.createNews({
        title: title.trim(),
        contentHtml,
        status,
        excerpt: excerpt.trim() || undefined,
        categoryId: categoryId || null,
        isFeatured,
        showFeaturedImage,
        enableGallery,
        enableLinks,
        links: cleanedLinks,
        coverTmpId: media.cover.tmpId,
        galleryTmpIds: enableGallery ? media.gallery.tmpIds : [],
      });
      
      navigate("/admin/news");
    } catch (err: unknown) {
      console.error(err);
      setFormError(humanizeAxiosError(err as AxiosError<{ erro?: string; message?: string }>));
    } finally {
      setSaving(false);
    }
  };

  return {
    form: {
      title, setTitle, slug, excerpt, setExcerpt, categoryId, setCategoryId, status, setStatus,
      isFeatured, setIsFeatured, error: formError, setFormError, saving,
      categories, categoriesLoading
    },
    toggles: {
      // Passamos os novos handlers seguros
      showFeaturedImage, setShowFeaturedImage: handleToggleFeaturedImage,
      enableGallery, setEnableGallery: handleToggleGallery,
      enableLinks, setEnableLinks: handleToggleLinks
    },
    editor,
    media,
    links: { items: links, ...linksActions },
    handleSave,
  };
}