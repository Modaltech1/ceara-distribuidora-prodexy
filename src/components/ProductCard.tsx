import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Product, useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg overflow-hidden flex flex-col border border-border"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.imagem_url}
          alt={product.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3 flex flex-col flex-1 gap-1">
        <h3 className="text-sm font-body font-semibold leading-tight line-clamp-2 text-foreground">
          {product.nome}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
          {product.descricao}
        </p>
        <div className="mt-auto pt-2 space-y-2">
          <span className="text-primary font-display text-sm block">
            {formatPrice(product.preco)}
          </span>

          {quantity > 0 ? (
            <div className="flex items-center justify-between rounded-full bg-primary/10 p-1">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border"
                aria-label={`Remover ${product.nome}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-body font-semibold">{quantity}</span>
              <button
                onClick={() => addItem(product)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                aria-label={`Adicionar ${product.nome}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product)}
              className="w-full h-9 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm"
              aria-label={`Adicionar ${product.nome}`}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
