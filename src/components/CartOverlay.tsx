import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function CartOverlay() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            key="cart"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-card rounded-t-2xl flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h2 className="text-lg font-display">CARRINHO</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 font-body">
                  Seu carrinho está vazio
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 bg-muted/30 rounded-lg p-3"
                  >
                    <img
                      src={item.product.imagem_url}
                      alt={item.product.nome}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate font-body">{item.product.nome}</p>
                      <p className="text-primary text-sm font-display">
                        {formatPrice(item.product.preco)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.quantity === 1 ? (
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-sm w-5 text-center font-body font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-body">Total</span>
                  <span className="text-xl font-display text-primary">{formatPrice(totalPrice)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider active:scale-[0.98] transition-transform"
                >
                  FINALIZAR PEDIDO
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
