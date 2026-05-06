import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import clsx from "clsx";

// Import da logo
import logoHorizontal from "../../assets/brand/logo_horizontal.png";

// Schema de Validação
const setupSchema = z.object({
  setupToken: z.string().min(1, "O token do sistema é obrigatório"),
  name: z.string().min(3, "Nome deve ter no mínimo 3 letras"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Precisa de uma letra maiúscula")
    .regex(/[0-9]/, "Precisa de um número")
});

type SetupData = z.infer<typeof setupSchema>;

export function Setup() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'danger' | '', msg: string }>({ type: '', msg: '' });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SetupData>({
    resolver: zodResolver(setupSchema)
  });

  async function handleSetup(data: SetupData) {
    setStatus({ type: '', msg: '' });
    
    try {
      await api.post("/auth/setup", data);
      
      setStatus({ type: 'success', msg: 'Administrador criado com sucesso! Redirecionando...' });
      
      // Aguarda 2 segundos e redireciona
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err: any) {
      const errorMsg = err.response?.data?.mensagem || "Erro ao criar administrador.";
      
      if (errorMsg.includes("SETUP_TOKEN")) {
        setStatus({ type: 'danger', msg: "O Token de Setup está incorreto." });
      } else if (err.response?.status === 403) {
        setStatus({ type: 'danger', msg: "A configuração inicial já foi bloqueada por segurança." });
      } else {
        setStatus({ type: 'danger', msg: errorMsg });
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Faixa Decorativa Superior */}
        <div className="h-2 w-full bg-gradient-to-r from-regif-blue via-regif-blue to-regif-green" />

        <div className="p-8">
          
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <img 
              src={logoHorizontal} 
              alt="REGIF Logo" 
              className="h-10 mx-auto mb-6 object-contain" 
            />
            
            <div className="inline-flex items-center justify-center p-3 bg-green-50 rounded-full mb-4">
              <ShieldCheck className="text-regif-green h-8 w-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-regif-dark">Configuração Inicial</h1>
            <p className="text-gray-500 text-sm mt-1">
              Crie o primeiro <span className="font-semibold text-regif-blue">Super Admin</span> do sistema.
            </p>
          </div>

          {/* Mensagens de Status */}
          {status.msg && (
            <div className={clsx(
              "mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-pulse",
              status.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-regif-red border border-red-200"
            )}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span>{status.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleSetup)} className="space-y-5">
            
            {/* 1. SETUP TOKEN */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-1">
                <KeyRound size={12} /> Token do Sistema (.env)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  placeholder="Cole o token secreto aqui"
                  className={clsx(
                    "block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 transition-all outline-none bg-gray-50 focus:bg-white",
                    errors.setupToken ? "border-regif-red focus:border-regif-red" : "border-gray-200 focus:border-regif-blue"
                  )}
                  {...register("setupToken")}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-regif-blue transition-colors"
                >
                  {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.setupToken && <p className="text-xs text-regif-red font-medium ml-1">{errors.setupToken.message}</p>}
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Dados do Admin</span></div>
            </div>

            {/* 2. DADOS DO USUÁRIO */}
            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Administrador Geral"
                    className={clsx(
                      "block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 transition-all outline-none",
                      errors.name ? "border-regif-red" : "border-gray-200 focus:border-regif-blue"
                    )}
                    {...register("name")}
                  />
                </div>
                {errors.name && <p className="text-xs text-regif-red font-medium ml-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@regif.com"
                    className={clsx(
                      "block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 transition-all outline-none",
                      errors.email ? "border-regif-red" : "border-gray-200 focus:border-regif-blue"
                    )}
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-regif-red font-medium ml-1">{errors.email.message}</p>}
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Senha Forte</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-regif-blue transition-colors" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className={clsx(
                      "block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 transition-all outline-none",
                      errors.password ? "border-regif-red" : "border-gray-200 focus:border-regif-blue"
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-regif-blue transition-colors"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-regif-red font-medium ml-1">{errors.password.message}</p>}
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-regif-green text-white font-bold py-3.5 rounded-xl hover:bg-green-600 focus:ring-4 focus:ring-green-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 active:scale-[0.98] mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Configurando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>CRIAR ADMINISTRADOR</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-gray-500 hover:text-regif-blue font-medium flex items-center justify-center gap-1 transition-colors">
                Já tem conta? Ir para Login <ArrowRight size={14} />
              </Link>
            </div>

          </form>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-gray-400 text-xs text-center w-full">
        System Setup v1.0 • REGIF
      </div>

    </div>
  );
}