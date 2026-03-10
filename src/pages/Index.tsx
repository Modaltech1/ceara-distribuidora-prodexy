import { StoreHeader } from "@/components/StoreHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { CartButton } from "@/components/CartButton";
import { CartOverlay } from "@/components/CartOverlay";

const Index = () => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <StoreHeader />
      <ProductGrid />
      <CartButton />
      <CartOverlay />
    </div>
  );
};

export default Index;
