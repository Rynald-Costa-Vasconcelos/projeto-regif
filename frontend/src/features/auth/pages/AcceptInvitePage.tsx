import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  Home,
} from "lucide-react";
import { api } from "../../../lib/api";
import logoHorizontalBranca from "../../../assets/brand/logo_horizontal_branca.png";

type InviteData = {
  id: string;
  email: string;
  expiresAt: string;
  role: { id: string; name: string; color?: string | null };
};

/** Mesmas regras que `inviteAcceptSchema` no backend (auth.controller). */
function meetsPasswordPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[\W_]/.test(password)
  );
}

function formatApiError(err: unknown): string {
  const anyErr = err as { response?: { data?: { message?: string; details?: unknown } } };
  const data = anyErr.response?.data;
  const details = data?.details;
  if (Array.isArray(details) && details.length > 0) {
    const msgs = details
      .map((d: { message?: string }) => (typeof d?.message === "string" ? d.message : ""))
      .filter(Boolean);
    if (msgs.length) return msgs.join(" ");
  }
  if (typeof data?.message === "string" && data.message) return data.message;
  return "Não foi possível concluir seu cadastro.";
}

export function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordOk = useMemo(() => meetsPasswordPolicy(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const canSubmit = useMemo(
    () =>
      !!invite &&
      name.trim().length >= 3 &&
      passwordOk &&
      passwordsMatch &&
      !submitting,
    [invite, name, passwordOk, passwordsMatch, submitting]
  );

  useEffect(() => {
    let mounted = true;

    async function loadInvite() {
      if (!token) {
        setError("Convite inválido.");
        setLoadingInvite(false);
        return;
      }

      try {
        const res = await api.get<{ invite: InviteData }>(`/auth/invites/${encodeURIComponent(token)}`);
        if (!mounted) return;
        setInvite(res.data.invite);
      } catch (err: any) {
        if (!mounted) return;
        const message = err.response?.data?.message || "Este convite é inválido ou expirou.";
        setError(message);
      } finally {
        if (mounted) setLoadingInvite(false);
      }
    }

    loadInvite();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !canSubmit) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(`/auth/invites/${encodeURIComponent(token)}/accept`, {
        name: name.trim(),
        password,
      });

      setSuccess(res.data?.message || "Cadastro concluído com sucesso.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "block w-full pl-10 pr-12 py-2.5 sm:py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-regif-blue/20 focus:border-regif-blue transition-all outline-none text-gray-700 bg-gray-50 focus:bg-white placeholder:text-gray-400";

  return (
    <main className="min-h-dvh w-full bg-regif-blue font-sans relative overflow-x-hidden flex flex-col">
      {/* overflow-hidden: blobs com posição negativa não aumentam a altura rolável do documento */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-regif-green/15 rounded-full blur-3xl" />
      </div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className={clsx(
          "absolute top-3 left-3 sm:top-6 sm:left-6 z-10 shrink-0",
          "inline-flex items-center gap-2 px-2.5 py-2 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold",
          "text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20",
          "shadow-sm backdrop-blur-sm transition-all",
          "focus:outline-none focus:ring-4 focus:ring-white/20"
        )}
        aria-label="Voltar para a página inicial"
      >
        <Home size={18} className="shrink-0" />
        <span className="hidden min-[380px]:inline sm:inline">Voltar ao site</span>
      </button>

      <div className="relative z-[1] flex w-full flex-1 flex-col items-center justify-center px-3 pt-[3.25rem] pb-6 sm:px-6 sm:pb-10 sm:pt-10 min-h-0">
        <section className="w-full max-w-xl lg:max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/25 border border-white/10 overflow-hidden max-h-[calc(100dvh-5.5rem)] sm:max-h-none overflow-y-auto overscroll-contain">
          <div className="bg-regif-blue px-5 py-6 sm:px-8 sm:py-8 relative text-center shrink-0">
            <div className="absolute inset-0 opacity-[0.12] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <img
              src={logoHorizontalBranca}
              alt="REGIF"
              className="relative h-9 min-[380px]:h-10 sm:h-12 w-auto max-w-[min(100%,280px)] sm:max-w-none mx-auto object-contain drop-shadow-md"
              draggable={false}
            />
          </div>

          <div className="px-4 pb-5 pt-4 sm:px-9 sm:pb-8 sm:pt-6 space-y-4 sm:space-y-5">
            <header className="space-y-1.5 sm:space-y-2 text-center">
              <h1 className="text-xl min-[380px]:text-2xl sm:text-3xl font-bold text-regif-dark tracking-tight px-1">
                {success ? "Cadastro concluído!" : "Aceitar convite"}
              </h1>
              <p className="text-gray-500 text-xs min-[380px]:text-sm leading-relaxed max-w-lg mx-auto px-0.5">
                {success
                  ? "Sua conta no painel está pronta."
                  : "Conclua seu cadastro com os dados abaixo para acessar o painel da REGIF."}
              </p>
            </header>

            {loadingInvite && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 sm:py-8 text-gray-500">
                <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-regif-blue" />
                <p className="text-xs sm:text-sm font-medium">Validando convite…</p>
              </div>
            )}

            {!loadingInvite && error && (
              <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-regif-red text-regif-red text-xs sm:text-sm rounded-r-lg flex items-start gap-2.5 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" aria-hidden />
                <span className="min-w-0 break-words">{error}</span>
              </div>
            )}

            {!loadingInvite && invite && !success && (
              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                <div className="flex items-start gap-2.5 sm:gap-3 bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-regif-blue text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                    {(invite.email?.charAt(0) || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[10px] sm:text-xs font-bold text-regif-blue uppercase tracking-wide">
                      Convite
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 break-all sm:break-normal sm:truncate">
                      {invite.email}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500">
                      Cargo: <span className="font-medium text-gray-700">{invite.role.name}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Nome completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                    </div>
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome no painel"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie uma senha forte"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-regif-blue transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 justify-center"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-snug sm:leading-relaxed ml-1">
                    Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial (ex.:{" "}
                    <span className="font-mono">!</span>, <span className="font-mono">@</span>,{" "}
                    <span className="font-mono">#</span>).
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">
                    Confirmar senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={inputClass}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a mesma senha"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-regif-blue transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 justify-center"
                      aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-[11px] sm:text-xs text-regif-red font-medium ml-1">
                      As senhas não coincidem.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] text-sm sm:text-base",
                    "bg-regif-green hover:bg-green-600 focus:ring-4 focus:ring-green-500/30",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Concluindo…</span>
                    </>
                  ) : (
                    <>
                      <span>Concluir cadastro</span>
                      <CheckCircle className="h-5 w-5 shrink-0" />
                    </>
                  )}
                </button>
              </form>
            )}

            {success && (
              <div className="p-3 sm:p-4 bg-green-50 border-l-4 border-regif-green text-green-900 text-xs sm:text-sm rounded-r-lg space-y-2">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-600 mt-0.5" aria-hidden />
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <p className="leading-relaxed break-words">{success}</p>
                    <p className="text-[11px] sm:text-xs text-green-800/90 font-medium">
                      Redirecionando para a tela de login…
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-[11px] sm:text-xs text-gray-400 pt-0.5 sm:pt-1">© 2026 REGIF</p>
          </div>
        </section>
      </div>
    </main>
  );
}
