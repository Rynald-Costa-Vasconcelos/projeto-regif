// src/pages/admin/NewsPreview.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { AxiosError } from "axios";
import {
  ArrowLeft,
  Loader2,
  ServerCrash,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import { normalizeNewsContentHtml } from "../../features/news/utils";

type NewsStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
type AssetRole = "COVER" | "GALLERY";

interface NewsAsset {
  id: string;
  url: string;
  thumbUrl?: string | null;
  caption?: string | null;
  role: AssetRole;
  order: number;
}

interface NewsLink {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  order: number;
}

interface NewsDetail {
  id: string;
  title: string;
  excerpt?: string | null;
  contentHtml?: string | null;

  status: NewsStatus;
  views: number;
  createdAt: string;

  showFeaturedImage?: boolean;
  enableGallery?: boolean;
  enableLinks?: boolean;

  author: { name: string; avatarUrl?: string | null };
  category?: { name: string } | null;

  coverAsset?: NewsAsset | null;
  assets?: NewsAsset[];
  links?: NewsLink[];
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  url?: string;
}
type ApiErrorPayload = { message?: string; erro?: string; mensagem?: string };

const REQUEST_TIMEOUT_MS = 10000;

function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<ApiErrorPayload>;
  const status = e.response?.status;
  const baseURL = (e.config?.baseURL ?? api.defaults.baseURL ?? "").toString();
  const url = e.config?.url ? `${baseURL}${e.config.url}` : baseURL || undefined;

  let message = e.message || "Erro inesperado";
  const code = e.code;

  if (code === "ECONNABORTED") message = "Tempo limite excedido ao consultar a API.";
  if (status === 401) message = "Sessão expirada ou token ausente. Faça login novamente.";
  if (status === 403) message = "Você não tem permissão para visualizar esta notícia.";
  if (status === 404) message = "Notícia não encontrada.";

  return { message, code, status, url };
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * ✅ Converte URLs relativas do backend ("/uploads/...") em URLs absolutas
 * baseado no api.defaults.baseURL (ex: http://localhost:3000/api -> http://localhost:3000)
 */
const API_ORIGIN = String(api.defaults.baseURL ?? "").replace(/\/api\/?$/, "");

function mediaUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return u;
}

export function NewsPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/news/${id}`, {
          timeout: REQUEST_TIMEOUT_MS,
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        const payload = res.data as { data?: NewsDetail } | NewsDetail;
        const post: NewsDetail | null =
          payload && typeof payload === "object" && "data" in payload
            ? payload.data ?? null
            : (payload as NewsDetail);

        if (!controller.signal.aborted) {
          setData(post);
          setActiveIndex(0);
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "CanceledError") return;
        if (!controller.signal.aborted) setError(toApiError(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  const gallery = useMemo(() => {
    const assets = (data?.assets ?? []) as NewsAsset[];
    return assets
      .filter((a) => a.role === "GALLERY")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [data]);

  const links = useMemo(() => {
    const ls = (data?.links ?? []) as NewsLink[];
    return ls.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [data]);

  const activeImage = gallery[activeIndex];
  const normalizedContentHtml = normalizeNewsContentHtml(data?.contentHtml);

  function prev() {
    setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length);
  }
  function next() {
    setActiveIndex((i) => (i + 1) % gallery.length);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-regif-dark">Visualizar Notícia</h1>
          <p className="text-gray-500 text-sm">
            Pré-visualização da matéria dentro do painel administrativo.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-regif-blue hover:bg-blue-50 transition-all"
          title="Voltar"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Loader2 className="animate-spin text-regif-blue mb-4" size={40} />
          <p className="text-gray-500 font-medium tracking-tight">Carregando matéria...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border-2 border-red-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-red-50 p-6 flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-red-600">
              <ServerCrash size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-red-900">Falha ao carregar</h3>
              <p className="text-red-700 text-sm mt-1 [overflow-wrap:anywhere]">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-700 font-medium">Sem dados para exibir.</p>
        </div>
      ) : (
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-50">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] text-regif-blue font-bold uppercase">
                {data.category?.name || "Sem Categoria"}
              </span>

              <span
                className={clsx(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                  data.status === "PUBLISHED"
                    ? "bg-green-50 text-green-600 border-green-100"
                    : data.status === "HIDDEN"
                      ? "bg-gray-50 text-gray-500 border-gray-100"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                )}
              >
                {data.status === "PUBLISHED"
                  ? "Publicado"
                  : data.status === "HIDDEN"
                    ? "Oculto"
                    : "Rascunho"}
              </span>

              <span className="ml-auto text-gray-500 text-sm inline-flex items-center gap-1.5">
                <Eye size={16} className="text-gray-400" />
                {data.views}
              </span>
            </div>

            {/* ✅ evita vazamento (palavras gigantes / sem espaço) */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-regif-dark leading-tight [overflow-wrap:anywhere]">
              {data.title}
            </h2>

            {data.excerpt?.trim() && (
              <p className="mt-3 text-gray-600 text-sm leading-relaxed [overflow-wrap:anywhere]">
                {data.excerpt}
              </p>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {new Date(data.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <span className="ml-2">• por {data.author?.name ?? "Autor"}</span>

              <span className="ml-2 text-[10px] text-gray-400">
                • destaque: {data.showFeaturedImage ? "ON" : "OFF"} • galeria:{" "}
                {data.enableGallery ? "ON" : "OFF"} • links: {data.enableLinks ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* ✅ imagem de destaque (capa), se showFeaturedImage */}
          {data.showFeaturedImage !== false && data.coverAsset?.url && (
            <div className="border-b border-gray-50 bg-black">
              <div className="max-w-5xl mx-auto">
                <img
                  src={mediaUrl(data.coverAsset.url)}
                  alt="Capa"
                  className="w-full aspect-video object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* ✅ CONTEÚDO (elegante): container de leitura + prose refinado */}
            {normalizedContentHtml ? (
              <div className="max-w-3xl mx-auto min-w-0">
                <div
                  className={clsx(
                    "prose prose-lg max-w-none",
                    // ✅ anti-vazamento dentro do HTML renderizado
                    "[overflow-wrap:anywhere]",
                    "prose-p:[overflow-wrap:anywhere] prose-li:[overflow-wrap:anywhere] prose-a:[overflow-wrap:anywhere]",
                    "prose-code:[overflow-wrap:anywhere] prose-pre:whitespace-pre-wrap prose-pre:[overflow-wrap:anywhere]",

                    // Tipografia geral
                    "prose-p:leading-8 prose-p:text-gray-800",
                    "prose-strong:text-gray-900",
                    "prose-em:text-gray-800",
                    // Headings
                    "prose-headings:text-regif-dark prose-headings:font-extrabold prose-headings:tracking-tight",
                    "prose-h2:mt-10 prose-h2:mb-3 prose-h3:mt-8 prose-h3:mb-2",
                    // Links
                    "prose-a:text-regif-blue prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
                    // Listas
                    "prose-ul:my-6 prose-ol:my-6 prose-li:my-1",
                    // Blockquote
                    "prose-blockquote:border-l-regif-blue prose-blockquote:text-gray-700 prose-blockquote:not-italic",
                    // HR
                    "prose-hr:border-gray-200"
                  )}
                  dangerouslySetInnerHTML={{ __html: normalizedContentHtml }}
                />
              </div>
            ) : (
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                Conteúdo ainda não disponível (ou o campo <b>contentHtml</b> não está vindo da API).
              </div>
            )}

            {/* ✅ GALERIA */}
            {data.enableGallery && gallery.length > 0 && (
              <section className="mt-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-regif-dark">
                    Galeria ({gallery.length})
                  </h3>

                  {gallery.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={prev}
                        className="p-2 rounded-xl border hover:bg-gray-50"
                        aria-label="Anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        className="p-2 rounded-xl border hover:bg-gray-50"
                        aria-label="Próxima"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {activeImage && (
                  <div className="rounded-2xl overflow-hidden border bg-gray-50">
                    <img
                      src={mediaUrl(activeImage.url)}
                      alt={`Imagem ${activeIndex + 1}`}
                      className="w-full aspect-video object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='16'%3EImagem n%C3%A3o carregou%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    {(activeImage.caption || null) && (
                      <div className="p-3 text-xs text-gray-600 border-t bg-white [overflow-wrap:anywhere]">
                        {activeImage.caption}
                      </div>
                    )}
                  </div>
                )}

                {gallery.length > 1 && (
                  <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {gallery.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={clsx(
                          "aspect-video rounded-xl overflow-hidden border bg-gray-100",
                          idx === activeIndex
                            ? "ring-2 ring-regif-blue"
                            : "opacity-80 hover:opacity-100"
                        )}
                        title={`Imagem ${idx + 1}`}
                      >
                        <img
                          src={mediaUrl(img.thumbUrl || img.url)}
                          alt={`Thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ✅ LINKS */}
            {data.enableLinks && links.length > 0 && (
              <section className="mt-10">
                <h3 className="text-sm font-extrabold text-regif-dark mb-3">
                  Links relacionados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {links.map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group p-4 rounded-2xl border bg-white hover:bg-gray-50 transition-all flex gap-3 min-w-0"
                      title={l.url}
                    >
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-regif-blue/10 text-regif-blue flex items-center justify-center">
                        <ExternalLink size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 group-hover:text-regif-blue truncate">
                          {l.title?.trim() || safeDomain(l.url)}
                        </p>
                        {l.description?.trim() ? (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 [overflow-wrap:anywhere]">
                            {l.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-500 mt-1 truncate">{l.url}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2 truncate">
                          {safeDomain(l.url)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-10 text-[10px] text-gray-400 font-mono">
              <p>Debug:</p>
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(
                  {
                    apiOrigin: API_ORIGIN,
                    cover: data.coverAsset?.url ?? null,
                    showFeaturedImage: data.showFeaturedImage ?? true,
                    galleryCount: gallery.length,
                    firstGalleryUrl: gallery[0]?.url ?? null,
                    linksCount: links.length,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
