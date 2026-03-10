import { ArrowLeft, MapPin, Package, LogOut, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressResult, AddressSearch } from "@/components/AddressSearch";

export default function Account() {
  const { cliente, enderecos, logout, removeEndereco, addEndereco } = useAuth();
  const navigate = useNavigate();
  const [showAddAddress, setShowAddAddress] = useState(false);

  useEffect(() => {
    if (!cliente) {
      navigate("/login", { replace: true, state: { from: "/account" } });
    }
  }, [cliente, navigate]);

  if (!cliente) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await removeEndereco(id);
      toast.success("Endereço removido");
    } catch {
      toast.error("Erro ao remover endereço");
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
      toast.success("Endereço adicionado");
      setShowAddAddress(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar endereço");
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-display">MINHA CONTA</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
        <section className="bg-card rounded-lg p-4 space-y-2 border border-border">
          <p className="text-sm text-muted-foreground font-body">Nome</p>
          <p className="font-body font-semibold">{cliente.nome || "—"}</p>
          <p className="text-sm text-muted-foreground font-body mt-2">Telefone</p>
          <p className="font-body font-semibold">{cliente.telefone}</p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display text-muted-foreground">ENDEREÇOS ({enderecos.length}/2)</h2>
            {enderecos.length < 2 && (
              <button
                onClick={() => setShowAddAddress(true)}
                className="flex items-center gap-1 text-sm text-primary font-body font-semibold"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>

          {showAddAddress && (
            <div className="mb-4">
              <AddressSearch onSelect={handleAddressSelected} onCancel={() => setShowAddAddress(false)} />
            </div>
          )}

          {enderecos.length === 0 ? (
            <div className="bg-card rounded-lg p-4 flex items-center gap-3 border border-border">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-body">Nenhum endereço cadastrado</span>
            </div>
          ) : (
            <div className="space-y-2">
              {enderecos.map((end) => (
                <div key={end.id} className="bg-card rounded-lg p-4 flex items-start gap-3 border border-border">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold truncate">{end.apelido || "Endereço"}</p>
                    <p className="text-sm text-muted-foreground font-body line-clamp-2">{end.endereco_completo || end.logradouro}</p>
                    {end.referencia && <p className="text-xs text-muted-foreground font-body mt-1">Ref.: {end.referencia}</p>}
                    {end.principal && <span className="text-xs text-primary font-body">Principal</span>}
                  </div>
                  <button onClick={() => handleDeleteAddress(end.id)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <button
            onClick={() => navigate("/orders")}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
          >
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-body font-semibold">Meus Pedidos</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="text-sm font-body font-semibold text-destructive">Sair</span>
          </button>
        </section>
      </div>
    </div>
  );
}
