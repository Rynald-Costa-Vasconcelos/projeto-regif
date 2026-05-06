import {
  ArrowRight,
  Eye,
  ShoppingBag,
  HelpCircle,
  MapPin,
  Mail,
  Instagram,
  School,
  Search,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import iconBranco from "../../assets/icons/icon_branco.png";
import lojinhaMock from "../../assets/mock_lojinha.webp";
import fallbackImage from "../../assets/fallback_image.webp";

const FALLBACK_IMAGE = fallbackImage;

import {
  listPublicDocuments,
  type PublicDocumentItem,
} from "../../services/documentService";

import { listPublicNews, type PublicNewsItem } from "../../services/newsService";
import { listPublicShopFeatured, type ShopPublicProduct } from "../../services/shopService";
import { campusLabel, listPublicBoard, type BoardRoleType } from "../../services/boardService";
import { toApiError } from "../../shared/api/contracts";

// Dados dos Grêmios (Art. 2º do Estatuto)
const GREMIOS = [
  { name: "Djalma Maranhão", campus: "Natal-Central" },
  { name: "Paulo Freire", campus: "Natal-Zona Norte" },
  { name: "Nilo Peçanha", campus: "Parnamirim" },
  { name: "Sérvulo Teixeira", campus: "São Gonçalo do Amarante" },
  { name: "Valdemar dos Pássaros", campus: "Mossoró" },
  { name: "Seridó Sertão", campus: "Caicó" },
  { name: "Rady Dias", campus: "Currais Novos" },
  { name: "Samira Delgado", campus: "Santa Cruz" },
  { name: "José Ernesto Filho", campus: "Parelhas" },
  { name: "Antônia Francimar", campus: "Pau dos Ferros" },
  { name: "José de Alencar", campus: "Apodi" },
  { name: "Marcel Lúcio", campus: "Ipanguaçu" },
  { name: "Benito Barros", campus: "Macau" },
  { name: "Alzira Soriano", campus: "Lajes" },
  { name: "Francisca Alves", campus: "João Câmara" },
  { name: "Madalena Antunes", campus: "Ceará-Mirim" },
  { name: "Monsenhor Expedito", campus: "São Paulo do Potengi" },
  { name: "Nísia Floresta", campus: "Nova Cruz" },
  { name: "Homero Homem", campus: "Canguaretama" },
  { name: "Café Filho", campus: "Natal-Cidade Alta" },
];

export function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  // =========================
  // Notícias (Banco de Dados)
  // =========================
  const [news, setNews] = useState<PublicNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // =========================
  // Documentos (Banco de Dados)
  // =========================
  const [docs, setDocs] = useState<PublicDocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);

  const [shopFeatured, setShopFeatured] = useState<ShopPublicProduct[]>([]);

  // =========================
  // Quem faz a REGIF (novo módulo)
  // =========================
  const [boardExec, setBoardExec] = useState<
    Array<{
      id: string;
      roleTitle: string;
      campusLabel: string;
      name: string | null;
      status: "ACTIVE" | "VACANTE" | "EGRESSO" | "RENUNCIA";
      photoUrl?: string | null;
    }>
  >([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPublicShopFeatured(4);
        if (!cancelled) setShopFeatured(items);
      } catch {
        if (!cancelled) setShopFeatured([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setBoardError(null);
        setBoardLoading(true);
        const out = await listPublicBoard({ type: "EXECUTIVE" as BoardRoleType });
        if (!alive) return;
        const mapped = (out.items ?? []).map((it) => ({
          id: it.id,
          roleTitle: it.role.title,
          campusLabel: it.member?.campus ? campusLabel(it.member.campus as any) : it.campus ? campusLabel(it.campus as any) : "—",
          name: it.member?.name ?? null,
          status: it.status,
          photoUrl: (it.member as any)?.photoUrl ?? null,
        }));
        // ordena por hierarquia (maior primeiro)
        mapped.sort((a, b) => {
          const ra = out.items.find((x) => x.id === a.id)?.role.hierarchyLevel ?? 0;
          const rb = out.items.find((x) => x.id === b.id)?.role.hierarchyLevel ?? 0;
          return rb - ra;
        });
        setBoardExec(mapped.slice(0, 6));
      } catch (e) {
        if (!alive) return;
        setBoardError(toApiError(e).message);
        setBoardExec([]);
      } finally {
        if (alive) setBoardLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredGremios = GREMIOS.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.campus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    // "19 jan. 2026"
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const estimateReadTime = (html?: string) => {
    if (!html) return "—";
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").length : 0;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min de leitura`;
  };

  /**
   * ✅ Agora o service já normaliza coverImageUrl (vindo de coverAsset.url),
   * mas mantemos fallback e guardas aqui pra evitar "quebra" por dados incompletos.
   */
  const getImage = (n: PublicNewsItem) => {
    if ((n as any)?.showFeaturedImage === false) return null;
    return n.coverImageUrl || FALLBACK_IMAGE;
  };

  const getCategory = (n: PublicNewsItem) => n.category?.name || "Notícia";

  const getCatColor = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("esporte")) return "text-orange-500 bg-orange-50";
    if (c.includes("instit")) return "text-blue-600 bg-blue-50";
    if (c.includes("cultur") || c.includes("arte"))
      return "text-purple-600 bg-purple-50";
    if (c.includes("saúde") || c.includes("saude"))
      return "text-green-600 bg-green-50";
    if (c.includes("direito") || c.includes("human"))
      return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-100";
  };

  const getDocType = (mime?: string, originalName?: string | null) => {
    const name = (originalName || "").toLowerCase();
    if (mime?.includes("pdf") || name.endsWith(".pdf")) return "PDF";
    if (
      mime?.includes("word") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return "DOC";
    if (
      mime?.includes("spreadsheet") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    )
      return "XLS";
    return "ARQ";
  };

  const docDateLabel = (d: PublicDocumentItem) => {
    const iso = d.publishedAt || d.createdAt;
    return iso ? formatDate(iso) : "—";
  };

  // Ordena: featured primeiro (se existir), depois mais recentes
  const sortedNews = useMemo(() => {
    const arr = [...news];
    arr.sort((a, b) => {
      const af = a.isFeatured ? 1 : 0;
      const bf = b.isFeatured ? 1 : 0;
      if (af !== bf) return bf - af;

      // usa updatedAt se existir, senão createdAt
      const ad = new Date(a.updatedAt || a.createdAt).getTime();
      const bd = new Date(b.updatedAt || b.createdAt).getTime();
      return bd - ad;
    });
    return arr;
  }, [news]);

  const featured = sortedNews[0];
  const sideNews = sortedNews.slice(1, 4);

  useEffect(() => {
    let alive = true;

    async function fetchNews(signal?: AbortSignal) {
      try {
        setNewsError(null);
        const { items } = await listPublicNews({ signal });
        if (!alive) return;
        setNews(items || []);
      } catch (e: any) {
        if (!alive) return;
        setNewsError(e?.message || "Não foi possível carregar as notícias.");
      } finally {
        if (alive) setNewsLoading(false);
      }
    }

    // Primeira carga
    const controllerFirst = new AbortController();
    fetchNews(controllerFirst.signal);

    // “quase em tempo real” (evita reusar controller abortado)
    const interval = setInterval(() => {
      const c = new AbortController();
      fetchNews(c.signal);
      // aborta depois do timeout natural do service; aqui só limpamos se o tab ficar lento
      setTimeout(() => c.abort(), 15000);
    }, 15000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const c = new AbortController();
        fetchNews(c.signal);
        setTimeout(() => c.abort(), 15000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      controllerFirst.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Carrega documentos (1x) para a seção da Home
  useEffect(() => {
    let alive = true;

    async function fetchDocs(signal?: AbortSignal) {
      try {
        setDocsError(null);
        setDocsLoading(true);

        const { items } = await listPublicDocuments(
          { page: 1, pageSize: 4, sort: "newest" },
          { signal }
        );

        if (!alive) return;
        setDocs(items || []);
      } catch (e: any) {
        if (!alive) return;
        setDocsError(e?.message || "Não foi possível carregar os documentos.");
      } finally {
        if (alive) setDocsLoading(false);
      }
    }

    const controller = new AbortController();
    fetchDocs(controller.signal);

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* === SEÇÃO 1: HERO === */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center bg-regif-blue overflow-hidden scroll-mt-24"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-regif-green/20 rounded-full blur-[120px] animate-in fade-in duration-1000"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-in fade-in duration-1000 delay-300"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
          <div className="mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl animate-in zoom-in duration-1000">
            <img
              src={iconBranco}
              alt="Logo REGIF"
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-100">
            A voz dos estudantes <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-regif-green to-teal-400">
              do ensino técnico do IFRN.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200">
            Fundada em 2016, a REGIF é a entidade oficial de representação dos
            grêmios estudantis, defendendo uma educação pública, gratuita e de
            qualidade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300">
            <a
              href="/noticias/arquivo"
              className="px-8 py-4 rounded-full bg-white text-regif-blue font-bold text-lg hover:bg-gray-100 transition-transform hover:scale-105 shadow-xl shadow-white/10 flex items-center gap-2"
            >
              Ver Notícias <ArrowRight size={20} />
            </a>
            <a
              href="#gremios"
              className="px-8 py-4 rounded-full bg-transparent border border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <School size={20} /> Conhecer a Rede
            </a>
          </div>
        </div>
      </section>

      <div id="nav-sentinel" className="h-px w-full" aria-hidden="true" />

      {/* === SEÇÃO 2: PORTAL DE NOTÍCIAS (DINÂMICO) === */}
      <section id="noticias" className="py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header da Seção */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold text-red-500 tracking-wider uppercase">
                  Em Tempo Real
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-regif-dark">
                Portal de Notícias
              </h2>
              {newsError ? (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {newsError}
                </p>
              ) : null}
            </div>

            <Link
              to="/noticias/arquivo"
              className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-regif-blue transition-colors"
            >
              Ver arquivo completo{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* Loading skeleton simples */}
          {newsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 h-[500px] rounded-3xl bg-white animate-pulse border border-gray-100" />
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="h-28 rounded-2xl bg-white animate-pulse border border-gray-100" />
                <div className="h-28 rounded-2xl bg-white animate-pulse border border-gray-100" />
                <div className="h-28 rounded-2xl bg-white animate-pulse border border-gray-100" />
                <div className="mt-auto h-40 rounded-2xl bg-regif-blue/90 animate-pulse" />
              </div>
            </div>
          ) : !featured ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Nenhuma notícia publicada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* COLUNA 1: DESTAQUE PRINCIPAL */}
              <Link
                to={`/noticias/${featured.slug}`}
                className="lg:col-span-7 group relative h-[500px] rounded-3xl overflow-hidden shadow-xl cursor-pointer block"
              >
                <img
                  src={getImage(featured) || FALLBACK_IMAGE}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-regif-blue/90 via-regif-blue/40 to-transparent"></div>

                <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full">
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-regif-green text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      Destaque
                    </span>

                    <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wide backdrop-blur-sm">
                      {getCategory(featured)}
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-regif-green transition-colors">
                    {featured.title}
                  </h3>

                  <div className="flex items-center gap-4 text-blue-100 text-sm flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(featured.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />{" "}
                      {estimateReadTime(featured.contentHtml)}
                    </span>
                  </div>
                </div>
              </Link>

              {/* COLUNA 2: LISTA LATERAL */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {sideNews.map((n) => {
                  const cat = getCategory(n);
                  return (
                    <Link key={n.id} to={`/noticias/${n.slug}`} className="block">
                      <NewsListItem
                        category={cat}
                        catColor={getCatColor(cat)}
                        date={formatDate(n.createdAt)}
                        title={n.title}
                        image={getImage(n) || FALLBACK_IMAGE}
                      />
                    </Link>
                  );
                })}

                {/* Banner de Newsletter/Aviso */}
                <div className="mt-auto p-6 bg-regif-blue rounded-2xl text-white relative overflow-hidden group cursor-pointer hover:bg-blue-900 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <h4 className="font-bold text-lg mb-1 relative z-10">
                    Boletim Semanal
                  </h4>
                  <p className="text-blue-200 text-sm mb-4 relative z-10">
                    Receba as notícias no seu e-mail.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Seu e-mail..."
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm w-full placeholder-blue-300/50 focus:outline-none focus:bg-white/20 transition-all"
                    />
                    <button className="p-2 bg-regif-green rounded-lg hover:bg-green-500 transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* === SEÇÃO 3: NOSSA REDE (GRÊMIOS FILIADOS) === */}
      <section id="gremios" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-regif-blue font-bold tracking-wider text-sm uppercase">
              Nossa Força
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-regif-dark mt-2 mb-4">
              Grêmios Filiados
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              A REGIF é formada pela união de 20 grêmios estudantis espalhados
              por todo o Rio Grande do Norte. Juntos somos mais fortes.
            </p>

            <div className="mt-8 max-w-md mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Busque por campus ou nome..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-regif-blue/20 focus:border-regif-blue transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredGremios.map((gremio, index) => (
              <div
                key={index}
                className="group p-5 rounded-2xl border border-gray-100 bg-white hover:border-regif-blue/30 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-regif-blue flex items-center justify-center shrink-0 group-hover:bg-regif-blue group-hover:text-white transition-colors">
                  <School size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm group-hover:text-regif-blue transition-colors">
                    {gremio.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Campus {gremio.campus}
                  </p>
                </div>
              </div>
            ))}

            {filteredGremios.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-400">
                Nenhum grêmio encontrado com este termo.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === SEÇÃO 4: DOCUMENTOS === */}
      <section id="documentos" className="py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-regif-dark mb-4">
                Transparência Estudantil
              </h2>
              <p className="text-gray-500">
                Acesse atas, estatutos e portarias oficiais com facilidade.
              </p>
            </div>
            <Link
              to="/documentos/arquivo"
              className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition-colors shadow-sm border border-gray-200"
            >
              Acessar Arquivo Completo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docsLoading ? (
              <>
                <div className="h-24 rounded-2xl bg-white animate-pulse border border-gray-100" />
                <div className="h-24 rounded-2xl bg-white animate-pulse border border-gray-100" />
                <div className="h-24 rounded-2xl bg-white animate-pulse border border-gray-100" />
                <div className="h-24 rounded-2xl bg-white animate-pulse border border-gray-100" />
              </>
            ) : docsError ? (
              <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 font-medium">
                {docsError}
              </div>
            ) : docs.length === 0 ? (
              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
                Nenhum documento publicado ainda.
              </div>
            ) : (
              docs.map((d) => (
                <DocCard
                  key={d.id}
                  title={d.title}
                  date={docDateLabel(d)}
                  type={getDocType(d.mimeType, d.originalName)}
                  viewHref={`/documentos/${d.slug}`}
                  downloadHref={d.fileUrl}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* === SEÇÃO 5: LOJINHA === */}
      <section
        id="lojinha"
        className="py-20 bg-gradient-to-r from-regif-blue to-indigo-900 relative overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-left text-white max-w-2xl">
            <span className="text-regif-green font-bold tracking-wider text-sm">
              LOJINHA OFICIAL
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-6">
              Vista a camisa do movimento!
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              Adquira camisas, canecas e moletons exclusivos da REGIF. Todo o
              lucro é revertido para a manutenção da nossa sede e atividades
              estudantis.
            </p>
            <Link
              to="/loja"
              className="inline-flex items-center gap-3 px-8 py-4 bg-regif-green text-white font-bold rounded-full hover:bg-green-600 transition-all shadow-lg hover:shadow-green-500/30 hover:-translate-y-1"
            >
              <ShoppingBag size={20} /> Acessar Lojinha
            </Link>
          </div>
          <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 transform rotate-3 hover:rotate-0 transition-all duration-500">
            {shopFeatured.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 aspect-square">
                {shopFeatured.slice(0, 4).map((p) => {
                  const img =
                    p.images.find((i) => i.isPrimary)?.thumbUrl ||
                    p.images.find((i) => i.isPrimary)?.url ||
                    p.images[0]?.thumbUrl ||
                    p.images[0]?.url;
                  const soldOut = p.stockQuantity <= 0;
                  const tileClass = clsx(
                    "relative rounded-xl overflow-hidden bg-gray-900/40 group ring-1 ring-white/10 block",
                    soldOut && "cursor-not-allowed opacity-90"
                  );
                  const inner = (
                    <>
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className={clsx(
                            "w-full h-full object-cover min-h-[72px] transition-transform",
                            !soldOut && "group-hover:scale-105"
                          )}
                        />
                      ) : (
                        <div className="w-full h-full min-h-[72px] flex items-center justify-center text-[10px] text-white/70 text-center p-1">
                          {p.title}
                        </div>
                      )}
                      {soldOut && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                          <span className="rounded-full bg-white/95 px-2 py-1 text-[9px] font-black uppercase text-rose-800">
                            Esgotado
                          </span>
                        </div>
                      )}
                    </>
                  );
                  return soldOut ? (
                    <div key={p.id} className={tileClass} aria-label={`${p.title} — esgotado`}>
                      {inner}
                    </div>
                  ) : (
                    <Link
                      key={p.id}
                      to={`/loja/produto/${encodeURIComponent(p.slug)}`}
                      className={tileClass}
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="aspect-square bg-gray-800 rounded-2xl overflow-hidden">
                <img
                  src={lojinhaMock}
                  alt="Ilustração da lojinha da REGIF"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === SEÇÃO 6: GESTÃO ATUAL === */}
      <section id="cargos" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-regif-dark mb-4">
              Quem faz a REGIF
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Composição atual da Diretoria (Executiva), atualizada pelo Portal de Transparência.
            </p>
            <div className="mt-6">
              <Link
                to="/quem-somos"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 hover:text-regif-blue transition-colors shadow-sm"
              >
                Ver organograma completo <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {boardLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-64 rounded-3xl bg-gray-50 animate-pulse border border-gray-100" />
              <div className="h-64 rounded-3xl bg-gray-50 animate-pulse border border-gray-100" />
              <div className="h-64 rounded-3xl bg-gray-50 animate-pulse border border-gray-100" />
            </div>
          ) : boardError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 font-medium">
              {boardError}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardExec.map((m) => (
                <MemberCard
                  key={m.id}
                  name={m.name ?? "Vacante"}
                  role={m.roleTitle}
                  campus={`Campus ${m.campusLabel}`}
                  photoUrl={m.photoUrl ?? null}
                  vacant={!m.name || m.status === "VACANTE"}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* === SEÇÃO 7: FAQ === */}
      <section id="faq" className="py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-regif-dark mb-12 text-center">
            Dúvidas Frequentes
          </h2>
          <div className="grid gap-6">
            <FaqItem
              question="O que é a REGIF?"
              answer="A Rede de Grêmios do IFRN é a entidade civil sem fins lucrativos que representa oficialmente os grêmios estudantis e estudantes dos cursos técnicos de nível médio do IFRN."
            />
            <FaqItem
              question="Quem são os membros da REGIF?"
              answer="Todos os estudantes regularmente matriculados nos cursos técnicos de nível médio do IFRN são automaticamente membros associados, salvo manifestação em contrário."
            />
            <FaqItem
              question="Quais são os objetivos da entidade?"
              answer="Defender os direitos dos estudantes, garantir a representação estudantil nos conselhos do IFRN, e auxiliar na criação e fortalecimento dos grêmios locais."
            />
            <FaqItem
              question="Como a REGIF é financiada?"
              answer="Através da confecção de carteiras estudantis, doações, rendimentos de eventos e convênios firmados para a manutenção de suas atividades."
            />
          </div>
        </div>
      </section>

      {/* === SEÇÃO 8: CONTATO INSTITUCIONAL === */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4 group">
              <div className="p-4 bg-white/5 rounded-full text-regif-blue border border-white/10 group-hover:bg-regif-blue group-hover:text-white transition-all duration-300">
                <MapPin size={32} />
              </div>
              <div>
                <h4 className="font-bold text-xl mb-2">Sede Administrativa</h4>
                <p className="text-gray-400 leading-relaxed">
                  Rua Dr. Nilo Bezerra Ramalho, 1692, sala 09
                  <br />
                  Tirol, Natal/RN - CEP: 59015-340
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group">
              <div className="p-4 bg-white/5 rounded-full text-regif-green border border-white/10 group-hover:bg-regif-green group-hover:text-white transition-all duration-300">
                <Mail size={32} />
              </div>
              <div>
                <h4 className="font-bold text-xl mb-2">Canais Digitais</h4>
                <p className="text-gray-400 leading-relaxed">
                  regif.ifrn@gmail.com
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group">
              <div className="p-4 bg-white/5 rounded-full text-pink-500 border border-white/10 group-hover:bg-pink-600 group-hover:text-white transition-all duration-300">
                <Instagram size={32} />
              </div>
              <div>
                <h4 className="font-bold text-xl mb-2">Redes Sociais</h4>
                <p className="text-gray-400 leading-relaxed mb-2">
                  Acompanhe nosso dia a dia
                </p>
                <span className="font-bold text-white text-lg">@regif_ifrn</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function NewsListItem({ title, category, date, image, catColor }: any) {
  return (
    <div className="flex gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-lg transition-all group cursor-pointer border border-transparent hover:border-gray-100">
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative">
        <img
          src={image}
          alt="Thumb"
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={clsx(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
              catColor
            )}
          >
            {category}
          </span>
          <span className="text-xs text-gray-400 font-medium">{date}</span>
        </div>
        <h4 className="font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-regif-blue transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-1 mt-2 text-xs font-bold text-regif-blue opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
          Ler notícia <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

function DocCard({
  title,
  date,
  type,
  downloadHref,
}: {
  title: string;
  date: string;
  type: string;
  viewHref: string;
  downloadHref: string;
}) {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl border border-gray-100 hover:border-regif-green hover:shadow-md transition-all group bg-white">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
            type === "PDF"
              ? "bg-red-50 text-red-600"
              : type === "DOC"
              ? "bg-blue-50 text-blue-600"
              : type === "XLS"
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {type}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 group-hover:text-regif-blue transition-colors truncate w-full">
            {title}
          </h4>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a
          href={downloadHref}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-gray-400 hover:text-regif-green hover:bg-gray-50 rounded-lg"
          title="Abrir documento"
        >
          <Eye size={20} />
        </a>
      </div>
    </div>
  );
}

function MemberCard({
  name,
  role,
  campus,
  photoUrl,
  vacant,
}: {
  name: string;
  role: string;
  campus: string;
  photoUrl?: string | null;
  vacant?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center group">
      <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-md group-hover:border-regif-blue transition-colors">
        <img
          src={
            photoUrl
              ? photoUrl
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          }
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <h3 className={clsx("font-bold text-xl", vacant ? "text-gray-500" : "text-gray-800")}>
        {name}
      </h3>
      <p className="text-regif-blue font-medium mb-3">{role}</p>
      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full border border-gray-200">
        {campus}
      </span>
    </div>
  );
}

function FaqItem({ question, answer }: any) {
  return (
    <div className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-regif-blue/30 transition-colors shadow-sm">
      <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
        <HelpCircle size={18} className="text-regif-blue" /> {question}
      </h3>
      <p className="text-gray-500 leading-relaxed ml-7">{answer}</p>
    </div>
  );
}
