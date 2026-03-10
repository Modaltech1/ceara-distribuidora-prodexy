import { useState } from "react";
import { ArrowLeft, Phone, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Step = "phone" | "name";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>("phone");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTarget = (location.state as { from?: string } | null)?.from || "/account";

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneSubmit = async () => {
    const digits = telefone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Informe um telefone válido");
      return;
    }
    setLoading(true);
    try {
      const result = await login(digits);
      if (result.exists) {
        toast.success(`Bem-vindo, ${result.cliente?.nome || ""}!`);
        navigate(redirectTarget, { replace: true });
      } else {
        setStep("name");
      }
    } catch {
      toast.error("Erro ao verificar telefone");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!nome.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setLoading(true);
    try {
      const digits = telefone.replace(/\D/g, "");
      const current = await register(digits, nome.trim());
      toast.success(`Cadastro realizado! Bem-vindo, ${current.nome}!`);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      if (err?.message?.includes("duplicate")) {
        toast.error("Este telefone já está cadastrado");
      } else {
        toast.error("Erro ao cadastrar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-display">{step === "phone" ? "ENTRAR" : "CADASTRO"}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-display">SEU TELEFONE</h2>
                <p className="text-sm text-muted-foreground font-body">
                  Informe seu número para entrar ou criar sua conta
                </p>
              </div>
              <div className="space-y-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full h-14 rounded-lg bg-card border border-border px-4 text-lg font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-center tracking-wider"
                  autoFocus
                />
                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading}
                  className="w-full h-14 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {loading ? "VERIFICANDO..." : "CONTINUAR"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-display">COMO SE CHAMA?</h2>
                <p className="text-sm text-muted-foreground font-body">
                  Primeira vez aqui! Informe seu nome para finalizar o cadastro
                </p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full h-14 rounded-lg bg-card border border-border px-4 text-lg font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-center"
                  autoFocus
                />
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full h-14 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {loading ? "CADASTRANDO..." : "CRIAR CONTA"}
                </button>
                <button
                  onClick={() => setStep("phone")}
                  className="w-full h-10 text-sm text-muted-foreground font-body"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
