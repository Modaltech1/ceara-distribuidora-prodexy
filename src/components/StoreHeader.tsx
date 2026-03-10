import heroBg from "@/assets/hero-bg.png";
import logo from "@/assets/logo.jpg";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function StoreHeader() {
  const navigate = useNavigate();
  const { cliente } = useAuth();

  return (
    <div className="relative w-full h-56 overflow-hidden">
      <img
        src={heroBg}
        alt="Distribuidora"
        className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
      />
      <div className="absolute inset-0 bg-background/60" />

      {/* Account button */}
      <button
        onClick={() => navigate(cliente ? "/account" : "/login")}
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center border border-border"
      >
        <User className="w-4 h-4 text-foreground" />
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
        <div className="w-24 h-24 rounded-full border-2 border-primary/40 overflow-hidden shadow-lg bg-white">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl tracking-wider">Ceará Distribuidora</h1>
        <p className="text-muted-foreground text-sm font-body">Gás • Água • Bebidas • Entrega rápida</p>
      </div>
    </div>
  );
}
