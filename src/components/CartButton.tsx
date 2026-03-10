import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { forwardRef } from "react";

const MotionButton = motion.button;

export function CartButton() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <MotionButton
          key="cart-btn"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg active:scale-90 transition-transform"
          aria-label="Abrir carrinho"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
            {totalItems}
          </span>
        </MotionButton>
      )}
    </AnimatePresence>
  );
}
