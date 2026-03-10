import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
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
        <div className="w-20 h-20 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-lg">
          <img src={logo} alt="Logo" className="w-14 h-14 object-contain" />
        </div>
        <h1 className="text-xl tracking-wider">DISTRIBUIDORA</h1>
        <p className="text-muted-foreground text-sm font-body">Gás • Água • Bebidas • Entrega rápida</p>
      </div>
    </div>
  );
}
