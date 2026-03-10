import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface Cliente {
  id: string;
  nome: string | null;
  telefone: string;
  ativo: boolean;
}

export interface EnderecoCliente {
  id: string;
  cliente_id: string;
  apelido: string | null;
  cep: string | null;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  referencia: string | null;
  endereco_completo: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  principal: boolean;
}

export type EnderecoPayload = Omit<EnderecoCliente, "id" | "cliente_id">;

interface AuthContextType {
  cliente: Cliente | null;
  enderecos: EnderecoCliente[];
  isLoading: boolean;
  login: (telefone: string) => Promise<{ exists: boolean; cliente?: Cliente }>;
  register: (telefone: string, nome: string) => Promise<Cliente>;
  logout: () => void;
  loadEnderecos: () => Promise<void>;
  addEndereco: (endereco: EnderecoPayload) => Promise<void>;
  updateEndereco: (id: string, endereco: EnderecoPayload) => Promise<void>;
  removeEndereco: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "distribuidora_cliente";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [enderecos, setEnderecos] = useState<EnderecoCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEnderecos = useCallback(async () => {
    const currentClienteId = cliente?.id;
    if (!currentClienteId) {
      setEnderecos([]);
      return;
    }

    const { data, error } = await supabase
      .from("enderecos_cliente")
      .select("*")
      .eq("cliente_id", currentClienteId)
      .order("principal", { ascending: false })
      .order("criado_em", { ascending: true });

    if (error) throw error;
    setEnderecos((data as EnderecoCliente[]) || []);
  }, [cliente?.id]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Cliente;
        setCliente(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (cliente) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cliente));
      loadEnderecos().catch(console.error);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setEnderecos([]);
    }
  }, [cliente, loadEnderecos]);

  const login = useCallback(async (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, "");
    const { data, error } = await supabase
      .from("clientes")
      .select("id,nome,telefone,ativo")
      .eq("telefone", cleanPhone)
      .eq("ativo", true)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const current = data as Cliente;
      setCliente(current);
      return { exists: true, cliente: current };
    }

    return { exists: false };
  }, []);

  const register = useCallback(async (telefone: string, nome: string) => {
    const cleanPhone = telefone.replace(/\D/g, "");
    const { data, error } = await supabase
      .from("clientes")
      .insert({ telefone: cleanPhone, nome: nome.trim(), ativo: true })
      .select("id,nome,telefone,ativo")
      .single();

    if (error) throw error;
    const current = data as Cliente;
    setCliente(current);
    return current;
  }, []);

  const logout = useCallback(() => {
    setCliente(null);
    setEnderecos([]);
  }, []);

  const normalizeAddressPayload = (endereco: EnderecoPayload, shouldBePrimary: boolean): EnderecoPayload => ({
    apelido: endereco.apelido?.trim() || null,
    cep: endereco.cep?.trim() || null,
    logradouro: endereco.logradouro.trim(),
    numero: endereco.numero?.trim() || null,
    complemento: endereco.complemento?.trim() || null,
    bairro: endereco.bairro?.trim() || null,
    cidade: endereco.cidade?.trim() || null,
    uf: endereco.uf?.trim().toUpperCase() || null,
    referencia: endereco.referencia?.trim() || null,
    endereco_completo: endereco.endereco_completo?.trim() || null,
    place_id: endereco.place_id?.trim() || null,
    latitude: endereco.latitude ?? null,
    longitude: endereco.longitude ?? null,
    principal: shouldBePrimary,
  });

  const addEndereco = useCallback(async (endereco: EnderecoPayload) => {
    if (!cliente) throw new Error("Faça login para adicionar endereço");
    if (enderecos.length >= 2) throw new Error("Máximo de 2 endereços");

    const shouldBePrimary = enderecos.length === 0 || endereco.principal;

    if (shouldBePrimary) {
      await supabase
        .from("enderecos_cliente")
        .update({ principal: false })
        .eq("cliente_id", cliente.id);
    }

    const payload = normalizeAddressPayload(endereco, shouldBePrimary);

    const { error } = await supabase
      .from("enderecos_cliente")
      .insert({ ...payload, cliente_id: cliente.id });

    if (error) throw error;
    await loadEnderecos();
  }, [cliente, enderecos.length, loadEnderecos]);

  const updateEndereco = useCallback(async (id: string, endereco: EnderecoPayload) => {
    if (!cliente) throw new Error("Faça login para editar endereço");
    const shouldBePrimary = Boolean(endereco.principal);

    if (shouldBePrimary) {
      await supabase
        .from("enderecos_cliente")
        .update({ principal: false })
        .eq("cliente_id", cliente.id)
        .neq("id", id);
    }

    const payload = normalizeAddressPayload(endereco, shouldBePrimary);

    const { error } = await supabase
      .from("enderecos_cliente")
      .update(payload)
      .eq("id", id)
      .eq("cliente_id", cliente.id);

    if (error) throw error;
    await loadEnderecos();
  }, [cliente, loadEnderecos]);

  const removeEndereco = useCallback(async (id: string) => {
    if (!cliente) throw new Error("Faça login para remover endereço");

    const target = enderecos.find((endereco) => endereco.id === id) || null;

    const { error } = await supabase
      .from("enderecos_cliente")
      .delete()
      .eq("id", id)
      .eq("cliente_id", cliente.id);

    if (error) throw error;

    if (target?.principal) {
      const remaining = enderecos.filter((endereco) => endereco.id !== id);
      const nextPrimary = remaining[0];
      if (nextPrimary) {
        await supabase
          .from("enderecos_cliente")
          .update({ principal: true })
          .eq("id", nextPrimary.id)
          .eq("cliente_id", cliente.id);
      }
    }

    await loadEnderecos();
  }, [cliente, enderecos, loadEnderecos]);

  return (
    <AuthContext.Provider
      value={{
        cliente,
        enderecos,
        isLoading,
        login,
        register,
        logout,
        loadEnderecos,
        addEndereco,
        updateEndereco,
        removeEndereco,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
