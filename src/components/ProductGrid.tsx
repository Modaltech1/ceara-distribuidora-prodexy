//src/components/ProductGrid.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./ProductCard";
import { Product } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";

function normalizeProduct(row: any): Product {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao || null,
    preco: Number(row.preco || 0),
    imagem_url: row.imagem_url || "/placeholder.svg",
    categoria:
      row.categorias?.nome ||
      row.categoria ||
      "Outros",
    categoria_id: row.categoria_id || null,
    estoque_atual: Number(row.estoque_atual || 0),
    ativo: row.ativo ?? true,
  };
}

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);

      const { data, error } = await supabase
        .from("itens")
        .select(`
          id,
          nome,
          descricao,
          preco,
          categoria,
          imagem_url,
          ativo,
          estoque_atual,
          categoria_id,
          categorias ( nome )
        `)
        .eq("ativo", true)
        .gt("estoque_atual", 0)
        .order("nome", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Erro ao carregar itens:", error);
        setProducts([]);
        setLoading(false);
        return;
      }

      setProducts(((data as any[]) || []).map(normalizeProduct));
      setLoading(false);
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.categoria || "Outros")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const filteredCategories = activeCategory ? [activeCategory] : categories;

  const scrollToCategory = (cat: string | null) => {
    setActiveCategory(cat);

    if (cat) {
      sectionRefs.current[cat]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => scrollToCategory(null)}
            className={`shrink-0 rounded-full px-4 text-sm font-semibold transition-colors h-9 ${!activeCategory
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground"
              }`}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`shrink-0 rounded-full px-4 text-sm font-semibold transition-colors h-9 ${activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-border bg-card animate-pulse"
              >
                <div className="aspect-square bg-muted" />
                <div className="space-y-2 p-3">
                  <div className="h-4 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="mt-4 h-9 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum item disponível no momento.
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category}
              ref={(el) => {
                sectionRefs.current[category] = el;
              }}
              className="mt-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-lg font-semibold">{category}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {products
                  .filter(
                    (product) => (product.categoria || "Outros") === category
                  )
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}