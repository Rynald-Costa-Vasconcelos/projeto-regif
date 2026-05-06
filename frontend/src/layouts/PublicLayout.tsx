import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Newspaper,
  FileText,
  Users,
  HelpCircle,
  LogIn,
  Instagram,
  School,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";
import logoIcon from "../assets/icons/icon_branco.png";
import logoHorizontalBranca from "../assets/brand/logo_horizontal_branca.png";
import logoHorizontal from "../assets/brand/logo_horizontal.png";

const REGIF_INSTAGRAM_URL = "https://www.instagram.com/regif.ifrn/";

function getPublicPageTitle(pathname: string) {
  // Ajuste aqui conforme suas rotas públicas reais
  if (pathname === "/" || pathname === "") return "INÍCIO";
  if (pathname.startsWith("/noticias/arquivo")) return "ARQUIVO";
  if (pathname === "/noticias") return "NOTÍCIAS";
  if (pathname.startsWith("/noticias/")) return "NOTÍCIA";
  if (pathname.startsWith("/documentos")) return "DOCUMENTOS";
  if (pathname.startsWith("/loja/ajuda")) return "AJUDA — LOJINHA";
  if (pathname.startsWith("/loja/meus-pedidos")) return "MEUS PEDIDOS — LOJINHA";
  if (pathname.startsWith("/loja")) return "LOJINHA";
  if (pathname.startsWith("/gremios")) return "GRÊMIOS";
  if (pathname.startsWith("/quem-somos")) return "QUEM SOMOS";
  if (pathname.startsWith("/ajuda")) return "AJUDA";
  return "REGIF";
}

export function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const retryRef = useRef<number | null>(null);
  const location = useLocation();

  const isHome = location.pathname === "/" || location.pathname === "";
  const isShop = location.pathname.startsWith("/loja");

  // --- Mobile drawer state (só Home) ---
  const [mobileOpen, setMobileOpen] = useState(false);

  // Só faz sentido observar o sentinel na Home (navbar mutante)
  useEffect(() => {
    if (!isHome) {
      setIsScrolled(false);
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      return;
    }

    const setupObserver = () => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      const sentinel = document.getElementById("nav-sentinel");

      if (!sentinel) {
        setIsScrolled(false);
        if (retryRef.current) window.clearTimeout(retryRef.current);
        retryRef.current = window.setTimeout(setupObserver, 50);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => setIsScrolled(!entry.isIntersecting),
        { root: null, threshold: 0, rootMargin: "-80px 0px 0px 0px" }
      );

      observer.observe(sentinel);
      observerRef.current = observer;
    };

    setupObserver();

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (retryRef.current) window.clearTimeout(retryRef.current);
    };
  }, [location.pathname, isHome]);

  // Fecha drawer ao trocar rota (ex.: indo pra /login)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ESC fecha drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Bloqueia scroll do body quando drawer abrir (mobile)
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Menu da Home (âncoras locais)
  const navItems = useMemo(
    () => [
      { href: "#hero", icon: Home, label: "Início" },
      { href: "#noticias", icon: Newspaper, label: "Notícias" },
      { href: "#gremios", icon: School, label: "Grêmios" },
      { href: "#documentos", icon: FileText, label: "Documentos" },
      { href: "#lojinha", icon: ShoppingBag, label: "Lojinha" },
      { href: "#cargos", icon: Users, label: "Quem Somos" },
      { href: "#faq", icon: HelpCircle, label: "Ajuda" },
    ],
    []
  );

  const handleAnchorClick = (href: string) => {
    setMobileOpen(false);
    // Home: deixa o browser lidar com hash
    window.location.hash = href.replace("#", "");
  };

  const pageTitle = useMemo(
    () => getPublicPageTitle(location.pathname),
    [location.pathname]
  );

  return (
    <div className="flex min-h-screen flex-col font-sans text-gray-800 bg-gray-50 selection:bg-regif-green selection:text-white scroll-smooth">
      {/* =========================================================
          HOME: MOBILE drawer (somente < lg)
         ========================================================= */}
      {isHome && (
        <div className="lg:hidden">
          {/* Botão fixo */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className={clsx(
              "fixed top-4 left-4 z-[60]",
              "w-12 h-12 rounded-2xl",
              "bg-regif-blue/90 backdrop-blur-md border border-white/10",
              "shadow-2xl",
              "flex items-center justify-center",
              "text-white hover:bg-regif-blue transition"
            )}
          >
            <Menu size={22} />
          </button>

          {/* Drawer */}
          <div
            className={clsx(
              "fixed inset-0 z-[70] transition",
              mobileOpen ? "visible" : "invisible"
            )}
            aria-hidden={!mobileOpen}
          >
            {/* Overlay */}
            <div
              className={clsx(
                "absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity",
                mobileOpen ? "opacity-100" : "opacity-0"
              )}
              onClick={() => setMobileOpen(false)}
            />

            {/* Painel */}
            <aside
              className={clsx(
                "absolute left-0 top-0 h-full w-[82%] max-w-[320px]",
                "bg-regif-blue/95 backdrop-blur-md text-white",
                "shadow-2xl border-r border-white/10",
                "transition-transform duration-300 ease-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              {/* Header drawer */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <img
                      src={logoIcon}
                      alt="REGIF"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-bold">REGIF</p>
                    <p className="text-xs text-blue-100/80">Menu</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar menu"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Links */}
              <nav className="p-3">
                <p className="px-3 pt-2 pb-2 text-xs font-semibold text-blue-100/70 uppercase tracking-wider">
                  Seções
                </p>

                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => handleAnchorClick(item.href)}
                        className={clsx(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-2xl",
                          "hover:bg-white/10 active:bg-white/15 transition",
                          "text-left"
                        )}
                      >
                        <item.icon size={20} className="text-blue-100" />
                        <span className="text-sm font-semibold">
                          {item.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="my-4 h-px bg-white/10" />

                <p className="px-3 pt-1 pb-2 text-xs font-semibold text-blue-100/70 uppercase tracking-wider">
                  Administração
                </p>

                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "mx-1 flex items-center gap-3 px-3 py-3 rounded-2xl",
                    "bg-regif-green text-white",
                    "shadow-lg shadow-green-900/20",
                    "hover:bg-green-500 transition"
                  )}
                >
                  <LogIn size={20} />
                  <span className="text-sm font-bold">Entrar no Painel</span>
                </Link>
              </nav>

              {/* Footer do drawer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <SocialIcon icon={Instagram} href={REGIF_INSTAGRAM_URL} label="Instagram" />
                </div>
                <p className="mt-3 text-[11px] text-blue-100/70">© 2026 REGIF</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* =========================================================
          DESKTOP
          - Home: navbar mutante (lg+)
          - Outras páginas: navbar simples (lg+)
         ========================================================= */}
      {isHome ? (
        <nav
          className={clsx(
            "hidden lg:flex",
            "fixed z-50 items-center bg-regif-blue/90 backdrop-blur-md shadow-2xl border border-white/10 group",
            "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "transform -translate-x-1/2 -translate-y-1/2",
            isScrolled
              ? "top-12 left-1/2 flex-row py-3 px-6 rounded-2xl gap-6 w-auto opacity-100 scale-100"
              : "top-1/2 left-12 flex-col py-6 px-3 rounded-full gap-5 opacity-70 hover:opacity-100 hover:scale-105"
          )}
        >
          {/* Logo */}
          <Link
            to="/"
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            title="REGIF"
          >
            <img src={logoIcon} alt="REGIF" className="w-8 h-8 object-contain" />
          </Link>

          {/* Separador Superior */}
          <div
            className={clsx(
              "bg-white/20 rounded-full transition-all duration-700",
              isScrolled ? "h-6 w-[1px]" : "w-8 h-[1px]"
            )}
          />

          {/* Links de Navegação (Home) */}
          <div className={clsx("flex gap-4", isScrolled ? "flex-row" : "flex-col")}>
            <NavIcon href="#hero" icon={Home} label="Início" />
            <NavIcon href="#noticias" icon={Newspaper} label="Notícias" />
            <NavIcon href="#gremios" icon={School} label="Grêmios" />
            <NavIcon href="#documentos" icon={FileText} label="Documentos" />
            <NavIcon href="#lojinha" icon={ShoppingBag} label="Lojinha" />
            <NavIcon href="#cargos" icon={Users} label="Quem Somos" />
            <NavIcon href="#faq" icon={HelpCircle} label="Ajuda" />
          </div>

          {/* Separador Inferior */}
          <div
            className={clsx(
              "bg-white/20 rounded-full transition-all duration-700",
              isScrolled ? "h-6 w-[1px]" : "w-8 h-[1px] mt-auto"
            )}
          />

          {/* Login */}
          <Link
            to="/login"
            className="p-2.5 rounded-full bg-regif-green text-white shadow-lg shadow-green-900/20 hover:bg-green-500 transition-all hover:rotate-12 shrink-0"
            title="Área Restrita"
          >
            <LogIn size={20} />
          </Link>
        </nav>
      ) : isShop ? null : (
        <>
          {/* Navbar simples estilo “G1” (desktop + mobile) */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-regif-blue text-white shadow-lg">
            <div className="mx-auto max-w-7xl px-4">
              <div className="relative flex h-14 items-center">
                {/* Logo à esquerda (link para HOME) */}
                <Link to="/" className="flex items-center gap-2 pr-4" title="Ir para a Home">
                  <img
                    src={logoHorizontalBranca}
                    alt="REGIF"
                    className="h-24 w-24 object-contain"
                  />
                </Link>

                {/* Título central */}
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-xs sm:text-sm font-black tracking-[0.22em] opacity-95">
                    {pageTitle}
                  </span>
                </div>

                {/* “respiro” à direita (sem perfil/busca/menu) */}
                <div className="ml-auto" />
              </div>
            </div>
          </header>
        </>
      )}

      {/* === CONTEÚDO === */}
      <main
        className={clsx(
          "flex w-full flex-1 flex-col min-h-0",
          !isHome && !isShop && "pt-14"
        )}
      >
        <Outlet />
      </main>

      {/* =========================================================
          FOOTER
          - Home: footer completo (como está)
          - Outras páginas: footer simplificado (sem links)
         ========================================================= */}
      {isHome ? (
        <footer className="bg-regif-dark text-white pt-20 pb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-regif-blue via-regif-green to-regif-blue" />

          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 relative z-10">
            <div className="space-y-6">
              <img
                src={logoHorizontal}
                alt="Logo REGIF"
                className="h-10 brightness-0 invert opacity-90"
              />
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                A entidade oficial de representação dos estudantes do ensino técnico do IFRN.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Explorar</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#hero" className="hover:text-regif-green transition-colors">
                    Início
                  </a>
                </li>
                <li>
                  <a href="#noticias" className="hover:text-regif-green transition-colors">
                    Últimas Notícias
                  </a>
                </li>
                <li>
                  <a href="#documentos" className="hover:text-regif-green transition-colors">
                    Transparência
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Institucional</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#cargos" className="hover:text-regif-green transition-colors">
                    Quem Somos
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-regif-green transition-colors">
                    Ajuda
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-regif-green transition-colors">
                    Acesso Admin
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Conecte-se</h4>
              <div className="flex gap-4">
                <SocialIcon icon={Instagram} href={REGIF_INSTAGRAM_URL} label="Instagram" />
              </div>
            </div>
          </div>

          <div className="text-center border-t border-gray-800/50 pt-8 text-gray-600 text-xs">
            © 2026 REGIF. Todos os Direitos Reservados.
          </div>
        </footer>
      ) : (
        <footer className="bg-regif-dark text-white">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logoHorizontal}
                  alt="Logo REGIF"
                  className="h-9 brightness-0 invert opacity-90"
                />
              </div>

              <div className="flex items-center gap-3">
                <SocialIcon icon={Instagram} href={REGIF_INSTAGRAM_URL} label="Instagram" />
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-gray-400">
              © 2026 REGIF — Todos os direitos reservados.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// --- Componentes Visuais ---

function NavIcon({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <a
      href={href}
      className="relative p-2.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-all group/icon"
    >
      <Icon size={24} strokeWidth={1.5} />

      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 translate-y-2 group-hover/icon:opacity-100 group-hover/icon:translate-y-0 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50">
        {label}
        <span className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></span>
      </span>
    </a>
  );
}

function SocialIcon({
  icon: Icon,
  href = "#",
  label = "Rede social",
}: {
  icon: any;
  href?: string;
  label?: string;
}) {
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer noopener" : undefined}
      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-regif-green hover:border-regif-green hover:text-white transition-all hover:-translate-y-1"
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </a>
  );
}
