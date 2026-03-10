import { ArrowLeft, CheckCircle, Clock, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Pedido {
  id: string;
  codigo: string;
  status: string;
  forma_pagamento: string;
  total: number;
  criado_em: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  novo: { label: "Novo", icon: <Clock className="w-4 h-4" />, color: "text-primary" },
  saiu_para_entrega: { label: "Saiu para entrega", icon: <Truck className="w-4 h-4" />, color: "text-blue-400" },
  entregue: { label: "Entregue", icon: <CheckCircle className="w-4 h-4" />, color: "text-green-400" },
};

export default function MyOrders() {
  const { cliente } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cliente) {
      navigate("/login", { replace: true, state: { from: "/orders" } });
      return;
    }

    let active = true;

    const fetchPedidos = async () => {
      const { data } = await supabase
        .from("pedidos")
        .select("id, codigo, status, forma_pagamento, total, criado_em")
        .eq("cliente_id", cliente.id)
        .order("criado_em", { ascending: false });

      if (!active) return;
      setPedidos((data as Pedido[]) || []);
      setLoading(false);
    };

    fetchPedidos();

    const channel = supabase
      .channel(`pedidos-updates-${cliente.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `cliente_id=eq.${cliente.id}` }, (payload) => {
        setPedidos((prev) =>
          prev.map((pedido) => (pedido.id === payload.new.id ? { ...pedido, ...(payload.new as Partial<Pedido>) } : pedido))
        );
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [cliente?.id, navigate]);

  if (!cliente) return null;

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate("/account")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-display">MEUS PEDIDOS</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Package className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground font-body">Nenhum pedido realizado</p>
          </div>
        ) : (
          pedidos.map((pedido) => {
            const config = statusConfig[pedido.status] || statusConfig.novo;
            return (
              <div key={pedido.id} className="bg-card rounded-lg p-4 space-y-3 border border-border">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm">#{pedido.codigo}</span>
                  <span className="text-xs text-muted-foreground font-body shrink-0">{formatDate(pedido.criado_em)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-2 ${config.color}`}>
                    {config.icon}
                    <span className="text-sm font-body font-semibold">{config.label}</span>
                  </div>
                  <span className="text-primary font-display text-sm shrink-0">{formatPrice(pedido.total)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {["novo", "saiu_para_entrega", "entregue"].map((status, index) => (
                    <div
                      key={status}
                      className={`h-1 flex-1 rounded-full ${
                        ["novo", "saiu_para_entrega", "entregue"].indexOf(pedido.status) >= index ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
