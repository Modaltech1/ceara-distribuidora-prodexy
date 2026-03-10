import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

export interface AddressResult {
  apelido?: string;
  logradouro: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  complemento?: string;
  referencia?: string;
  endereco_completo: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressSearchProps {
  onSelect: (address: AddressResult) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export function AddressSearch({ onSelect, onCancel }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [useManual, setUseManual] = useState(!GOOGLE_API_KEY);
  const [loadingMap, setLoadingMap] = useState(false);
  const [selectedBase, setSelectedBase] = useState<Partial<AddressResult> | null>(null);
  const [form, setForm] = useState({
    apelido: "Casa",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    complemento: "",
    referencia: "",
  });

  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const dummyDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_API_KEY) return;

    const initServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        if (dummyDiv.current) {
          placesService.current = new window.google.maps.places.PlacesService(dummyDiv.current);
        }
      }
    };

    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    const existing = document.querySelector('script[data-google-maps="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", initServices);
      return () => existing.removeEventListener("load", initServices);
    }

    setLoadingMap(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.dataset.googleMaps = "true";
    script.onload = () => {
      setLoadingMap(false);
      initServices();
    };
    script.onerror = () => {
      setLoadingMap(false);
      setUseManual(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (selectedBase) {
      setForm((prev) => ({
        ...prev,
        logradouro: selectedBase.logradouro || "",
        numero: selectedBase.numero || "",
        bairro: selectedBase.bairro || "",
        cidade: selectedBase.cidade || "",
        uf: selectedBase.uf || "",
        cep: selectedBase.cep || "",
      }));
    }
  }, [selectedBase]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!autocompleteService.current || value.trim().length < 3) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: "br" },
        types: ["address"],
      },
      (results: any[], status: string) => {
        if (status === "OK" && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleSelectPrediction = (prediction: any) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["address_components", "geometry", "formatted_address"] },
      (place: any, status: string) => {
        if (status !== "OK" || !place) return;

        const getComponent = (type: string) =>
          place.address_components?.find((component: any) => component.types.includes(type))?.long_name || "";

        const ufShort = place.address_components?.find((component: any) => component.types.includes("administrative_area_level_1"))?.short_name || "";

        setSelectedBase({
          logradouro: getComponent("route"),
          numero: getComponent("street_number"),
          bairro: getComponent("sublocality_level_1") || getComponent("sublocality") || getComponent("neighborhood"),
          cidade: getComponent("administrative_area_level_2") || getComponent("administrative_area_level_1"),
          uf: ufShort,
          cep: getComponent("postal_code"),
          endereco_completo: place.formatted_address || prediction.description,
          place_id: prediction.place_id,
          latitude: place.geometry?.location?.lat(),
          longitude: place.geometry?.location?.lng(),
        });
        setPredictions([]);
        setQuery(place.formatted_address || prediction.description);
      }
    );
  };

  const submit = () => {
    if (!form.logradouro.trim()) return;

    const parts = [
      form.logradouro.trim(),
      form.numero.trim() ? `, ${form.numero.trim()}` : "",
      form.bairro.trim() ? ` - ${form.bairro.trim()}` : "",
      form.cidade.trim() ? `, ${form.cidade.trim()}` : "",
      form.uf.trim() ? ` - ${form.uf.trim().toUpperCase()}` : "",
      form.cep.trim() ? `, CEP ${form.cep.trim()}` : "",
    ];

    onSelect({
      apelido: form.apelido.trim() || undefined,
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim() || undefined,
      bairro: form.bairro.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      uf: form.uf.trim().toUpperCase() || undefined,
      cep: form.cep.trim() || undefined,
      complemento: form.complemento.trim() || undefined,
      referencia: form.referencia.trim() || undefined,
      endereco_completo: selectedBase?.endereco_completo || parts.join(""),
      place_id: selectedBase?.place_id,
      latitude: selectedBase?.latitude,
      longitude: selectedBase?.longitude,
    });
  };

  return (
    <div className="bg-card rounded-lg p-4 space-y-3 border border-border">
      <div ref={dummyDiv} style={{ display: "none" }} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display text-muted-foreground">
          {useManual ? "NOVO ENDEREÇO" : "BUSCAR ENDEREÇO"}
        </h3>
        <button onClick={onCancel} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!useManual && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Digite rua, número ou bairro..."
              className="w-full h-10 rounded-lg bg-background border border-border pl-9 pr-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          {loadingMap && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando busca do Google...
            </div>
          )}

          {predictions.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {predictions.map((prediction: any) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handleSelectPrediction(prediction)}
                  className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 text-left transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm font-body">{prediction.description}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {(useManual || selectedBase) && (
        <div className="space-y-3 pt-1">
          <input
            value={form.apelido}
            onChange={(e) => setForm((prev) => ({ ...prev, apelido: e.target.value }))}
            placeholder="Apelido (Casa, Trabalho)"
            className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
          />
          <input
            value={form.logradouro}
            onChange={(e) => setForm((prev) => ({ ...prev, logradouro: e.target.value }))}
            placeholder="Rua / Avenida"
            className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.numero}
              onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))}
              placeholder="Nº"
              className="h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
            />
            <input
              value={form.complemento}
              onChange={(e) => setForm((prev) => ({ ...prev, complemento: e.target.value }))}
              placeholder="Comp."
              className="col-span-2 h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>
          <input
            value={form.bairro}
            onChange={(e) => setForm((prev) => ({ ...prev, bairro: e.target.value }))}
            placeholder="Bairro"
            className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.cidade}
              onChange={(e) => setForm((prev) => ({ ...prev, cidade: e.target.value }))}
              placeholder="Cidade"
              className="col-span-2 h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
            />
            <input
              value={form.uf}
              onChange={(e) => setForm((prev) => ({ ...prev, uf: e.target.value.toUpperCase().slice(0, 2) }))}
              placeholder="UF"
              className="h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>
          <input
            value={form.cep}
            onChange={(e) => setForm((prev) => ({ ...prev, cep: e.target.value }))}
            placeholder="CEP"
            className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
          />
          <input
            value={form.referencia}
            onChange={(e) => setForm((prev) => ({ ...prev, referencia: e.target.value }))}
            placeholder="Referência (opcional)"
            className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm font-body focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        {!useManual && (
          <button
            onClick={() => {
              setUseManual(true);
              setSelectedBase(null);
            }}
            className="text-xs text-muted-foreground font-body underline"
          >
            Digitar manualmente
          </button>
        )}
        <button
          onClick={submit}
          disabled={!form.logradouro.trim()}
          className="ml-auto h-10 px-4 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider disabled:opacity-50"
        >
          SALVAR ENDEREÇO
        </button>
      </div>
    </div>
  );
}
