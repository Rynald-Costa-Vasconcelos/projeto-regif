import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  ZoomOut,
  ZoomIn,
  RotateCcw,
  Expand,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export type PdfSource =
  | File
  | string
  | ArrayBuffer
  | Uint8Array
  | null
  | undefined;

type FitMode = "width" | "page";

export type PdfViewerProps = {
  file: PdfSource;

  className?: string;
  headerClassName?: string;
  bodyClassName?: string;

  initialPage?: number;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;

  initialRotation?: 0 | 90 | 180 | 270;
  showToolbar?: boolean;
  showOpenInNewTab?: boolean;
  showDownload?: boolean;

  renderTextLayer?: boolean;
  renderAnnotationLayer?: boolean;

  maxWidth?: number;
  fitMode?: FitMode;
  responsive?: boolean;

  onLoadSuccess?: (info: { numPages: number }) => void;
  onError?: (message: string) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatErrorMessage(err: unknown) {
  const e = err as any;
  return e?.message || "Falha ao carregar PDF";
}

function IconButton({
  title,
  disabled,
  onClick,
  children,
  className,
}: {
  title: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "h-9 w-9 rounded-xl",
        "grid place-items-center transition",
        "border border-gray-200 bg-white shadow-sm",
        "hover:bg-gray-50 hover:border-gray-300",
        "focus:outline-none focus:ring-2 focus:ring-regif-blue/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function SegButton({
  active,
  title,
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  icon: any;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "h-9 rounded-xl border px-3",
        "inline-flex items-center gap-2 text-sm font-bold transition shadow-sm",
        active
          ? "bg-regif-blue text-white border-regif-blue"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300",
        "focus:outline-none focus:ring-2 focus:ring-regif-blue/20",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
      )}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ActionLink({
  href,
  title,
  icon: Icon,
  children,
  download,
  primary,
}: {
  href: string;
  title: string;
  icon: any;
  children: string;
  download?: boolean;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      title={title}
      target={download ? undefined : "_blank"}
      rel={download ? undefined : "noreferrer"}
      download={download}
      className={clsx(
        "h-9 rounded-xl px-3 border inline-flex items-center gap-2 text-sm font-bold shadow-sm transition",
        primary
          ? "border-regif-blue bg-regif-blue text-white hover:brightness-95"
          : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
        "focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
      )}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{children}</span>
    </a>
  );
}

function ToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2",
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        "px-2 py-2",
        className
      )}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

export function PdfViewer({
  file,

  className,
  headerClassName,
  bodyClassName,

  initialPage = 1,
  initialZoom = 1.0,
  minZoom = 0.5,
  maxZoom = 2.5,
  zoomStep = 0.1,

  initialRotation = 0,
  showToolbar = true,
  showOpenInNewTab = true,
  showDownload = true,

  renderTextLayer = false,
  renderAnnotationLayer = false,

  maxWidth = 920,
  fitMode = "width",
  responsive = true,

  onLoadSuccess,
  onError,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(initialRotation);
  const [fit, setFit] = useState<FitMode>(fitMode);

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const objectUrl = useMemo(() => {
    if (!file || typeof file === "string") return null;
    if (file instanceof File) return URL.createObjectURL(file);
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    setNumPages(0);
    setPage(initialPage);
    setZoom(initialZoom);
    setRotation(initialRotation);
    setFit(fitMode);
    setLoading(true);
    setErrMsg(null);
  }, [file, initialPage, initialZoom, initialRotation, fitMode]);

  const [containerWidth, setContainerWidth] = useState<number>(maxWidth);

  useEffect(() => {
    if (!responsive) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth || maxWidth;
      setContainerWidth(Math.min(w, maxWidth));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [responsive, maxWidth]);

  const effectiveWidth = responsive ? containerWidth : maxWidth;

  const hasFile = !!file;
  const canPrev = hasFile && page > 1;
  const canNext = hasFile && numPages > 0 && page < numPages;

  const openUrl = useMemo(() => {
    if (typeof file === "string") return file;
    if (objectUrl) return objectUrl;
    return null;
  }, [file, objectUrl]);

  function safeSetPage(p: number) {
    if (!numPages) {
      setPage(Math.max(1, p));
      return;
    }
    setPage(clamp(p, 1, numPages));
  }

  function handleZoom(delta: number) {
    setFit("width");
    setZoom((z) => clamp(+((z + delta).toFixed(2)), minZoom, maxZoom));
  }

  function handleFitWidth() {
    setFit("width");
    setZoom(1.0);
  }

  function handleFitPage() {
    setFit("page");
    setZoom(1.0);
  }

  function rotateRight() {
    setRotation((r) => ((r + 90) % 360) as 0 | 90 | 180 | 270);
  }

  // largura real do canvas (tirando padding do viewer)
  const pageWidth = Math.max(320, Math.min(effectiveWidth, maxWidth) - 24);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden",
        className
      )}
      style={{ maxWidth: "100%" }}
    >
      {showToolbar && (
        <div className={clsx("border-b border-gray-100 bg-white", headerClassName)}>
          {/* Toolbar “padrão de mercado”: grupos, sem bagunça e sem “icone solto” */}
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              {/* Esquerda: navegação + paginação */}
              <div className="min-w-0 flex items-center gap-3">
                <ToolbarGroup className="shrink-0">
                  <IconButton
                    title="Página anterior"
                    onClick={() => safeSetPage(page - 1)}
                    disabled={!canPrev}
                  >
                    <ChevronLeft size={18} className="text-gray-700" />
                  </IconButton>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      value={String(page)}
                      inputMode="numeric"
                      disabled={!hasFile}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        if (!v) return;
                        safeSetPage(parseInt(v, 10));
                      }}
                      onBlur={() => safeSetPage(page)}
                      className={clsx(
                        "h-9 w-14 rounded-xl border border-gray-200 bg-gray-50 px-2 text-center text-sm font-bold tabular-nums",
                        "focus:outline-none focus:ring-2 focus:ring-regif-blue/20",
                        "disabled:opacity-60 disabled:cursor-not-allowed"
                      )}
                      aria-label="Página atual"
                    />

                    <span className="text-sm text-gray-500 tabular-nums whitespace-nowrap">
                      / {hasFile ? (numPages ? numPages : "…") : "—"}
                    </span>
                  </div>

                  <IconButton
                    title="Próxima página"
                    onClick={() => safeSetPage(page + 1)}
                    disabled={!canNext}
                  >
                    <ChevronRight size={18} className="text-gray-700" />
                  </IconButton>

                  <Divider />

                  <span className="hidden md:inline-flex text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9 items-center tabular-nums">
                    {hasFile ? `${Math.round(zoom * 100)}%` : "—%"}
                  </span>
                </ToolbarGroup>

                {/* “status pill” (discreto) */}
                <div className="hidden lg:flex items-center gap-2 min-w-0">
                  <div
                    className={clsx(
                      "h-9 px-3 rounded-xl border text-xs font-bold flex items-center",
                      hasFile
                        ? "bg-gray-50 border-gray-200 text-gray-600"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                    title={hasFile ? "Documento carregado" : "Nenhum documento"}
                  >
                    {hasFile ? "Preview" : "Sem PDF"}
                  </div>
                </div>
              </div>

              {/* Direita: ações */}
              <div className="flex items-center gap-2 shrink-0">
                {openUrl && showOpenInNewTab && (
                  <ActionLink href={openUrl} title="Abrir em nova aba" icon={ExternalLink} primary>
                    Abrir
                  </ActionLink>
                )}
                {openUrl && showDownload && (
                  <ActionLink href={openUrl} title="Baixar PDF" icon={Download} download>
                    Baixar
                  </ActionLink>
                )}
              </div>
            </div>

            {/* Linha 2: controles de visualização (agrupados e alinhados) */}
            <div className="flex items-center justify-between gap-3">
              <ToolbarGroup className="min-w-0">
                <IconButton
                  title="Diminuir zoom"
                  onClick={() => handleZoom(-zoomStep)}
                  disabled={!hasFile || zoom <= minZoom}
                >
                  <ZoomOut size={18} className="text-gray-700" />
                </IconButton>

                <IconButton
                  title="Aumentar zoom"
                  onClick={() => handleZoom(+zoomStep)}
                  disabled={!hasFile || zoom >= maxZoom}
                >
                  <ZoomIn size={18} className="text-gray-700" />
                </IconButton>

                <Divider />

                <SegButton
                  active={fit === "width"}
                  title="Ajustar à largura"
                  onClick={handleFitWidth}
                  icon={Expand}
                  label="Largura"
                  disabled={!hasFile}
                />
                <SegButton
                  active={fit === "page"}
                  title="Ajustar à página"
                  onClick={handleFitPage}
                  icon={FileText}
                  label="Página"
                  disabled={!hasFile}
                />
              </ToolbarGroup>

              <ToolbarGroup className="shrink-0">
                <IconButton title="Girar 90°" onClick={rotateRight} disabled={!hasFile}>
                  <RotateCcw size={18} className="text-gray-700" />
                </IconButton>
              </ToolbarGroup>
            </div>
          </div>
        </div>
      )}

      <div className={clsx("p-4 bg-gray-50", bodyClassName)}>
        {!hasFile ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10">
            <div className="max-w-md mx-auto text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 grid place-items-center">
                <FileText className="text-gray-400" size={22} />
              </div>
              <p className="mt-4 text-base font-extrabold text-gray-800">
                Nenhum documento selecionado
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Escolha um PDF acima para ver o preview com paginação, zoom e download.
              </p>

              {/* “skeleton” elegante pro espaço não ficar vazio */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="h-3 w-2/3 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="h-3 w-1/2 bg-gray-200 rounded-full mx-auto mb-6" />
                <div className="aspect-[4/5] max-h-[360px] mx-auto rounded-2xl bg-white border border-gray-100 shadow-sm" />
              </div>
            </div>
          </div>
        ) : errMsg ? (
          <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 text-sm">
            <p className="font-bold">Falha ao carregar PDF</p>
            <p className="text-red-700 mt-1">{errMsg}</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="text-sm text-gray-500 mb-3">Carregando documento…</div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="max-h-[560px] overflow-auto p-3">
                <div className="flex justify-center">
                  <Document
                    file={file as any}
                    loading={null}
                    error={null}
                    noData={null}
                    onLoadSuccess={(info) => {
                      setLoading(false);
                      setNumPages(info.numPages);
                      setPage((p) => clamp(p, 1, info.numPages));
                      onLoadSuccess?.({ numPages: info.numPages });
                    }}
                    onLoadError={(e) => {
                      const msg = formatErrorMessage(e);
                      setLoading(false);
                      setErrMsg(msg);
                      onError?.(msg);
                    }}
                  >
                    <Page
                      pageNumber={page}
                      width={pageWidth}
                      scale={zoom}
                      rotate={rotation}
                      renderTextLayer={renderTextLayer}
                      renderAnnotationLayer={renderAnnotationLayer}
                      loading={<div className="text-sm text-gray-500">Renderizando página…</div>}
                    />
                  </Document>
                </div>
              </div>

              {numPages > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                  <span className="tabular-nums">
                    Página <b className="text-gray-700">{page}</b> de{" "}
                    <b className="text-gray-700">{numPages}</b>
                  </span>
                  <span className="hidden sm:inline tabular-nums">
                    Zoom: <b className="text-gray-700">{Math.round(zoom * 100)}%</b>
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
