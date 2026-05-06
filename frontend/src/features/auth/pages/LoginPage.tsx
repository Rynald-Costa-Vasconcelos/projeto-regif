// src/features/auth/pages/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Home,
} from "lucide-react";

import { api } from "../../../lib/api";
import { adminUserService } from "../../../services/adminUserService";
import { getSessionUser, getToken, setSession } from "../../../shared/auth/session";

import logoHorizontal from "../../../assets/brand/logo_horizontal.png";
import iconBranco from "../../../assets/icons/icon_branco.png";

export function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getSessionUser();
    if (token && user) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const firstName = useMemo(() => {
    const n = userName?.trim();
    if (!n) return "";
    return n.split(/\s+/)[0] || "";
  }, [userName]);

  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-user", { email: email.trim() });
      if (response.data?.name) setUserName(response.data.name);
      setStep(2);
    } catch (err: any) {
      if (err.response?.status === 404) setError("Este e-mail não foi encontrado.");
      else setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
        rememberMe,
      });

      const token = response.data.token as string;
      // 1) Salva o token imediatamente (para o interceptor enviar no /users/me)
      setSession({ token, user: response.data.user, rememberMe });

      // 2) Busca o "me" completo (com permissões) e atualiza a sessão
      const me = await adminUserService.getMe();
      setSession({ token, user: me.user, rememberMe });

      navigate("/admin/dashboard");
    } catch (err: any) {
      const apiMessage = err.response?.data?.mensagem || err.response?.data?.message;
      setError(apiMessage || "Senha incorreta.");
    } finally {
      setLoading(false);
    }
  }

  function goBackToEmail() {
    setStep(1);
    setError("");
    setPassword("");
    setShowPassword(false);
  }

  function goHome() {
    navigate("/");
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans overflow-x-hidden">
      <div className="min-h-screen w-full flex">
        {/* ===== LADO ESQUERDO ===== */}
        <aside className="hidden lg:flex basis-5/12 min-w-0 bg-regif-blue relative overflow-hidden items-center justify-center p-12 text-center">
          {/* Fundo decorativo (sem transform pra não vazar/cortar) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-[560px] h-[560px] bg-regif-green/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <img
              src={iconBranco}
              alt="Rede REGIF"
              className="w-64 h-auto mx-auto mb-8 drop-shadow-2xl opacity-90"
              draggable={false}
            />
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Painel de Administração do Site
            </h2>
            <p className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed">
              Escreva Notícias, Publique Documentos, Gerencie Usuários e Muito Mais
            </p>
          </div>

          <div className="absolute bottom-8 text-blue-200/60 text-xs font-medium z-10">
            © 2026 REGIF. Todos os Direitos Reservados.
          </div>
        </aside>

        {/* ===== LADO DIREITO ===== */}
        <main className="flex-1 basis-7/12 min-w-0 bg-white flex items-center justify-center p-6 sm:p-12 relative">
          {/* ✅ Botão voltar (sempre acessível) */}
          <button
            type="button"
            onClick={goHome}
            className={clsx(
              "absolute top-4 left-4 sm:top-6 sm:left-6",
              "inline-flex items-center gap-2",
              "px-3 py-2 rounded-xl",
              "text-sm font-semibold",
              "text-gray-600 hover:text-regif-blue",
              "bg-white/80 hover:bg-gray-50",
              "border border-gray-200",
              "shadow-sm hover:shadow transition-all",
              "focus:outline-none focus:ring-4 focus:ring-regif-blue/15"
            )}
            aria-label="Voltar para a página inicial"
            title="Voltar para o site"
          >
            <Home size={18} />
            <span>Voltar ao site</span>
          </button>

          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10 lg:text-left">
              <img
                src={logoHorizontal}
                alt="Logo REGIF"
                className="h-12 mx-auto lg:mx-0 mb-6 object-contain"
                draggable={false}
              />

              <h1 className="text-2xl font-bold text-regif-dark">
                {step === 1 ? "Acesse sua conta" : `Olá, ${firstName || "usuário"}!`}
              </h1>

              <p className="text-gray-500 mt-2 text-sm">
                {step === 1
                  ? "Digite seu e-mail cadastrado no site para começar."
                  : "Digite sua senha para acessar o painel."}
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-regif-red text-regif-red text-sm rounded-r-lg flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* ===== STEP 1 ===== */}
            {step === 1 && (
              <form onSubmit={handleVerifyEmail} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">E-mail</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="nome.sobrenome@gmail.com"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-regif-blue/20 focus:border-regif-blue transition-all outline-none text-gray-700 bg-gray-50 focus:bg-white placeholder:text-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]",
                    "bg-regif-blue hover:bg-blue-900 focus:ring-4 focus:ring-blue-900/30",
                    "disabled:opacity-70 disabled:cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <span>Continuar</span>}
                  {!loading && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>
            )}

            {/* ===== STEP 2 ===== */}
            {step === 2 && (
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Card usuário */}
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-regif-blue text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {userName ? userName.charAt(0).toUpperCase() : <CheckCircle size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-regif-blue truncate">{email}</span>
                      <span className="text-[10px] text-gray-500">Conta verificada</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="text-xs text-gray-500 hover:text-regif-red font-medium px-2 py-1 rounded hover:bg-white transition-colors"
                  >
                    Alterar
                  </button>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-semibold text-gray-700">Senha</label>
                    <a
                      href="#"
                      className="text-xs text-regif-blue hover:text-regif-red hover:underline transition-colors"
                    >
                      Esqueceu a senha?
                    </a>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                    </div>

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-regif-blue/20 focus:border-regif-blue transition-all outline-none text-gray-700 bg-gray-50 focus:bg-white placeholder:text-gray-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-regif-blue transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Lembre de mim */}
                <label className="flex items-center gap-3 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-regif-green focus:ring-regif-green/30"
                  />
                  <span className="text-sm text-gray-600">
                    Lembre de mim neste dispositivo
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]",
                    "bg-regif-green hover:bg-green-600 focus:ring-4 focus:ring-green-500/30",
                    "disabled:opacity-70 disabled:cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <CheckCircle className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Rodapé Mobile */}
            <div className="mt-10 text-center text-xs text-gray-400 lg:hidden">
              © 2026 REGIF
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
