import { CheckCircle2, Home, Package } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function OrderConfirmed() {
  const navigate = useNavigate();
  const orderCode = useMemo(() => sessionStorage.getItem("last_order_code"), []);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-display">Pedido enviado!</h1>
        <p className="text-muted-foreground font-body">
          Seu pedido foi recebido e já está em andamento.
        </p>
        {orderCode && <p className="text-sm font-body text-foreground">Código do pedido: <strong>#{orderCode}</strong></p>}
      </div>
      <div className="w-full space-y-3">
        <button
          onClick={() => navigate("/orders")}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-display text-sm flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" /> ACOMPANHAR PEDIDO
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full h-12 rounded-lg bg-card border border-border font-display text-sm flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" /> VOLTAR PARA A LOJA
        </button>
      </div>
    </div>
  );
}
