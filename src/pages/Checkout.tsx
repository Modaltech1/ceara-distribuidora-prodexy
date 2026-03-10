import { ArrowLeft, MapPin, CreditCard, Banknote, QrCode, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AddressSearch, AddressResult } from "@/components/AddressSearch";

type PaymentMethod = "dinheiro" | "pix" | "cartao" | null;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { cliente, enderecos, addEndereco, loadEnderecos } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [payment, setPayment] = useState<PaymentMethod>(null);
  const [changeAmount, setChangeAmount] = useState("");
  const [selectedEnderecoId, setSelectedEnderecoId] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const defaultAddress = enderecos.find((endereco) => endereco.principal) || enderecos[0];
    if (defaultAddress && !selectedEnderecoId) {
      setSelectedEnderecoId(defaultAddress.id);
    }
  }, [enderecos, selectedEnderecoId]);

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const redirectToLogin = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  if (!cliente) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 max-w-lg mx-auto">
        <p className="text-muted-foreground font-body text-center">Faça login para finalizar seu pedido</p>
        <button
          onClick={redirectToLogin}
          className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-display text-sm"
        >
          ENTRAR
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 max-w-lg mx-auto">
        <p className="text-muted-foreground font-body">Seu carrinho está vazio</p>
        <button
          onClick={() => navigate("/")}
          className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-display text-sm"
        >
          VER ITENS
        </button>
      </div>
    );
  }

  const handleConfirmOrder = async () => {
    if (!payment) {
      toast.error("Selecione uma forma de pagamento");
      return;
    }
    if (!selectedEnderecoId) {
      toast.error("Selecione um endereço de entrega");
      return;
    }

    setSubmitting(true);
    try {
      const codigo = `PED${Date.now().toString(36).toUpperCase()}`;
      const subtotal = totalPrice;
      const taxaEntrega = 0;
      const total = subtotal + taxaEntrega;

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          codigo,
          cliente_id: cliente.id,
          endereco_id: selectedEnderecoId,
          status: "novo",
          forma_pagamento: payment,
          troco_para: payment === "dinheiro" && changeAmount ? parseFloat(changeAmount) : null,
          subtotal,
          taxa_entrega: taxaEntrega,
          total,
        })
        .select("id,codigo")
        .single();

      if (pedidoError) throw pedidoError;

      const pedidoItens = items.map((item) => ({
        pedido_id: pedido.id,
        item_id: item.product.id,
        nome_item: item.product.nome,
        preco_unitario: item.product.preco,
        quantidade: item.quantity,
        subtotal: item.product.preco * item.quantity,
      }));

      const { error: itensError } = await supabase.from("pedido_itens").insert(pedidoItens);
      if (itensError) throw itensError;

      sessionStorage.setItem("last_order_code", pedido.codigo);
      clearCart();
      navigate("/order-confirmed");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao confirmar pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddressSelected = async (address: AddressResult) => {
    try {
      await addEndereco({
        apelido: address.apelido || null,
        cep: address.cep || null,
        logradouro: address.logradouro,
        numero: address.numero || null,
        complemento: address.complemento || null,
        bairro: address.bairro || null,
        cidade: address.cidade || null,
        uf: address.uf || null,
        referencia: address.referencia || null,
        endereco_completo: address.endereco_completo,
        place_id: address.place_id || null,
        latitude: address.latitude || null,
        longitude: address.longitude || null,
        principal: enderecos.length === 0,
      });
      await loadEnderecos();
      setShowAddAddress(false);
      toast.success("Endereço adicionado");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar endereço");
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: "pix", label: "PIX", icon: <QrCode className="w-5 h-5" /> },
    { id: "cartao", label: "Cartão", icon: <CreditCard className="w-5 h-5" /> },
    { id: "dinheiro", label: "Dinheiro", icon: <Banknote className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-display">CHECKOUT</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
        <section>
          <h2 className="text-sm font-display mb-3 text-muted-foreground">RESUMO DO PEDIDO</h2>
          <div className="space-y-2 bg-card rounded-lg p-4 border border-border">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-2 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={item.product.imagem_url} alt={item.product.nome} className="w-10 h-10 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-body font-semibold truncate">{item.product.nome}</p>
                    <p className="text-xs text-muted-foreground font-body">Qtd: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm text-primary font-display shrink-0">{formatPrice(item.product.preco * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-display mb-3 text-muted-foreground">ENDEREÇO DE ENTREGA</h2>
          {enderecos.length > 0 && (
            <div className="space-y-2 mb-3">
              {enderecos.map((end) => (
                <button
                  key={end.id}
                  onClick={() => setSelectedEnderecoId(end.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
                    selectedEnderecoId === end.id ? "bg-primary/10 border-primary" : "bg-card border-border"
                  }`}
                >
                  <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${selectedEnderecoId === end.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold truncate">{end.apelido || "Endereço"}</p>
                    <p className="text-sm text-muted-foreground font-body line-clamp-2">{end.endereco_completo || end.logradouro}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          {showAddAddress ? (
            <AddressSearch onSelect={handleAddressSelected} onCancel={() => setShowAddAddress(false)} />
          ) : enderecos.length < 2 ? (
            <button
              onClick={() => setShowAddAddress(true)}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border border-dashed"
            >
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground font-body">Adicionar endereço</span>
            </button>
          ) : (
            <div className="text-xs text-muted-foreground font-body">Você pode salvar no máximo 2 endereços.</div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-display mb-3 text-muted-foreground">FORMA DE PAGAMENTO</h2>
          <div className="space-y-2">
            {paymentOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPayment(opt.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                  payment === opt.id ? "bg-primary/10 border-primary" : "bg-card border-border"
                }`}
              >
                <span className={payment === opt.id ? "text-primary" : "text-muted-foreground"}>{opt.icon}</span>
                <span className={`text-sm font-body font-semibold ${payment === opt.id ? "text-foreground" : "text-muted-foreground"}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          {payment === "dinheiro" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
              <label className="text-xs text-muted-foreground font-body mb-1 block">Troco para quanto?</label>
              <input
                type="number"
                value={changeAmount}
                onChange={(e) => setChangeAmount(e.target.value)}
                placeholder="Ex: 50"
                className="w-full h-10 rounded-lg bg-card border border-border px-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </motion.div>
          )}
        </section>
      </div>

      <div className="border-t border-border px-4 py-4 space-y-3 bg-background">
        <div className="flex items-center justify-between text-sm font-body">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-body">
          <span className="text-muted-foreground">Taxa de entrega</span>
          <span>Grátis</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body font-semibold">Total</span>
          <span className="text-xl font-display text-primary">{formatPrice(totalPrice)}</span>
        </div>
        <button
          onClick={handleConfirmOrder}
          disabled={submitting}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider disabled:opacity-60"
        >
          {submitting ? "ENVIANDO PEDIDO..." : "FINALIZAR PEDIDO"}
        </button>
      </div>
    </div>
  );
}
