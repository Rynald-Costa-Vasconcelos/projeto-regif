// src/features/news/hooks/useNewsPost.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { api } from "../../../lib/api";
import { getPublicNewsBySlug } from "../api/news.api";
import type { NewsAsset, NewsLink, PublicNewsDetail } from "../types";

type ApiError = {
  message: string;
  code?: string;
  status?: number;
  url?: string;
};

const API_ORIGIN = String(api.defaults.baseURL ?? "").replace(/\/api\/?$/, "");

function mediaUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return u;
}

function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<unknown>;
  const status = e.response?.status;
  const baseURL = (e.config?.baseURL ?? api.defaults.baseURL ?? "").toString();
  const url = e.config?.url ? `${baseURL}${e.config.url}` : baseURL || undefined;

  let message = e.message || "Erro inesperado";
  const code = e.code;

  if (code === "ECONNABORTED") message = "Tempo limite excedido ao consultar a API.";
  if (status === 401) message = "Acesso negado (sem autenticação).";
  if (status === 403) message = "Você não tem permissão para acessar esta notícia.";
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

export function useNewsPost(slug?: string) {
  const [data, setData] = useState<PublicNewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ usa a API centralizada
        // Observação: timeout não é suportado via fetch AbortSignal do axios v1 em todas as configs,
        // então mantemos o comportamento atual com `api` no core.
        const post = await getPublicNewsBySlug(slug, { signal: controller.signal });

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
  }, [slug]);

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

  function prev() {
    setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length);
  }
  function next() {
    setActiveIndex((i) => (i + 1) % gallery.length);
  }

  return {
    data,
    loading,
    error,

    gallery,
    links,
    activeIndex,
    setActiveIndex,
    activeImage,
    prev,
    next,

    mediaUrl,
    safeDomain,
  };
}
