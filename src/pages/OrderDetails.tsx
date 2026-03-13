import { ArrowLeft, CheckCircle, Clock, MapPin, Package, Truck, Wallet } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PedidoDetalhe {
    id: string;
    codigo: string;
    status: string;
    forma_pagamento: string | null;
    troco_para: number | null;
    subtotal: number;
    taxa_entrega: number;
    total: number;
    observacoes: string | null;
    criado_em: string;
    endereco?: {
        apelido: string | null;
        logradouro: string | null;
        numero: string | null;
        complemento: string | null;
        bairro: string | null;
        cidade: string | null;
        uf: string | null;
        referencia: string | null;
        endereco_completo: string | null;
    } | null;
}

interface PedidoItem {
    id: string;
    nome_item: string;
    preco_unitario: number;
    quantidade: number;
    subtotal: number;
}

const statusConfig: Record<
    string,
    { label: string; icon: React.ReactNode; color: string }
> = {
    novo: {
        label: "Novo",
        icon: <Clock className="h-4 w-4" />,
        color: "text-primary",
    },
    saiu_para_entrega: {
        label: "Saiu para entrega",
        icon: <Truck className="h-4 w-4" />,
        color: "text-blue-400",
    },
    entregue: {
        label: "Entregue",
        icon: <CheckCircle className="h-4 w-4" />,
        color: "text-green-400",
    },
};

export default function OrderDetails() {
    const { cliente } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
    const [itens, setItens] = useState<PedidoItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!cliente) {
            navigate("/login", { replace: true, state: { from: `/orders/${id}` } });
            return;
        }

        if (!id) {
            navigate("/orders", { replace: true });
            return;
        }

        let active = true;

        async function loadOrderDetails() {
            setLoading(true);

            const { data: pedidoData, error: pedidoError } = await supabase
                .from("pedidos")
                .select(`
          id,
          codigo,
          status,
          forma_pagamento,
          troco_para,
          subtotal,
          taxa_entrega,
          total,
          observacoes,
          criado_em,
          endereco:enderecos_cliente (
            apelido,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            uf,
            referencia,
            endereco_completo
          )
        `)
                .eq("id", id)
                .eq("cliente_id", cliente.id)
                .maybeSingle();

            if (pedidoError || !pedidoData) {
                console.error("Erro ao carregar pedido:", pedidoError);
                if (active) {
                    setPedido(null);
                    setItens([]);
                    setLoading(false);
                }
                return;
            }

            const { data: itensData, error: itensError } = await supabase
                .from("pedido_itens")
                .select("id, nome_item, preco_unitario, quantidade, subtotal")
                .eq("pedido_id", id)
                .order("id", { ascending: true });

            if (itensError) {
                console.error("Erro ao carregar itens do pedido:", itensError);
            }

            if (!active) return;

            setPedido(pedidoData as unknown as PedidoDetalhe);
            setItens((itensData as PedidoItem[]) || []);
            setLoading(false);
        }

        loadOrderDetails();

        const channel = supabase
            .channel(`pedido-detalhe-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "pedidos",
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    setPedido((prev) =>
                        prev ? { ...prev, ...(payload.new as Partial<PedidoDetalhe>) } : prev
                    );
                }
            )
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    }, [cliente?.id, id, navigate]);

    if (!cliente) return null;

    const formatPrice = (value: number) =>
        Number(value || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });

    const formatDate = (date: string) =>
        new Date(date).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

    const enderecoFormatado = pedido?.endereco?.endereco_completo
        || [
            pedido?.endereco?.logradouro,
            pedido?.endereco?.numero,
            pedido?.endereco?.bairro,
            pedido?.endereco?.cidade,
            pedido?.endereco?.uf,
        ]
            .filter(Boolean)
            .join(", ");

    const config = statusConfig[pedido?.status || "novo"] || statusConfig.novo;

    return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
            <div className="flex items-center gap-3 border-b border-border px-4 py-4">
                <button
                    onClick={() => navigate("/orders")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-lg font-semibold">Detalhes do pedido</h1>
                    {pedido?.codigo && (
                        <p className="text-xs text-muted-foreground">#{pedido.codigo}</p>
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-hide">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : !pedido ? (
                    <div className="py-12 text-center text-muted-foreground">
                        Pedido não encontrado.
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold">#{pedido.codigo}</span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDate(pedido.criado_em)}
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 ${config.color}`}>
                                {config.icon}
                                <span className="text-sm font-semibold">{config.label}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                {["novo", "saiu_para_entrega", "entregue"].map((status, index) => (
                                    <div
                                        key={status}
                                        className={`h-1 flex-1 rounded-full ${["novo", "saiu_para_entrega", "entregue"].indexOf(pedido.status) >= index
                                                ? "bg-primary"
                                                : "bg-muted"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <h2 className="text-sm font-semibold">Itens do pedido</h2>
                            </div>

                            <div className="space-y-3">
                                {itens.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{item.nome_item}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantidade} x {formatPrice(item.preco_unitario)}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {formatPrice(item.subtotal)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <h2 className="text-sm font-semibold">Endereço de entrega</h2>
                            </div>

                            <div className="space-y-1">
                                {pedido.endereco?.apelido && (
                                    <p className="text-sm font-medium">{pedido.endereco.apelido}</p>
                                )}
                                <p className="text-sm">{enderecoFormatado || "Endereço não informado"}</p>
                                {pedido.endereco?.complemento && (
                                    <p className="text-xs text-muted-foreground">
                                        Complemento: {pedido.endereco.complemento}
                                    </p>
                                )}
                                {pedido.endereco?.referencia && (
                                    <p className="text-xs text-muted-foreground">
                                        Referência: {pedido.endereco.referencia}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                <h2 className="text-sm font-semibold">Pagamento</h2>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Forma de pagamento</span>
                                    <span className="font-medium capitalize">
                                        {pedido.forma_pagamento || "Não informado"}
                                    </span>
                                </div>

                                {pedido.forma_pagamento === "dinheiro" && pedido.troco_para ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Troco para</span>
                                        <span className="font-medium">{formatPrice(pedido.troco_para)}</span>
                                    </div>
                                ) : null}

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatPrice(pedido.subtotal)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Taxa de entrega</span>
                                    <span>{formatPrice(pedido.taxa_entrega)}</span>
                                </div>

                                <div className="flex items-center justify-between border-t border-border pt-2">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-semibold text-primary">
                                        {formatPrice(pedido.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {pedido.observacoes ? (
                            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                                <h2 className="text-sm font-semibold">Observações</h2>
                                <p className="text-sm text-muted-foreground">{pedido.observacoes}</p>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
