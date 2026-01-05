import { ChevronDown, MapPin, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface FilterSidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const serviceTypes = [
  { id: "construcao", label: "Construção Civil" },
  { id: "arquitetura", label: "Arquitetura" },
  { id: "marcenaria", label: "Marcenaria" },
  { id: "reforma", label: "Reformas" },
  { id: "paisagismo", label: "Paisagismo" },
  { id: "acabamentos", label: "Acabamentos" },
];

const states = [
  "São Paulo",
  "Rio de Janeiro",
  "Minas Gerais",
  "Bahia",
  "Rio Grande do Sul",
  "Paraná",
];

const FilterSidebar = ({ onClose, isMobile = false }: FilterSidebarProps) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [isStateOpen, setIsStateOpen] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className={`bg-card ${isMobile ? "" : "rounded-2xl border border-border shadow-card"} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros</h3>
        </div>
        {isMobile && onClose && (
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Location Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          <MapPin className="inline h-4 w-4 mr-1" />
          Localização
        </label>
        
        {/* State Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsStateOpen(!isStateOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-background text-sm hover:border-primary/50 transition-colors"
          >
            <span className={selectedState ? "text-foreground" : "text-muted-foreground"}>
              {selectedState || "Selecione o estado"}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isStateOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isStateOpen && (
            <div className="absolute z-10 w-full mt-2 py-2 bg-popover border border-border rounded-lg shadow-lg">
              {states.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setSelectedState(state);
                    setIsStateOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  {state}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Tipo de Serviço
        </label>
        <div className="space-y-3">
          {serviceTypes.map((service) => (
            <label
              key={service.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                id={service.id}
                checked={selectedServices.includes(service.id)}
                onCheckedChange={() => toggleService(service.id)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {service.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSelectedServices([]);
          setSelectedState("");
        }}
      >
        Limpar Filtros
      </Button>
    </div>
  );
};

export default FilterSidebar;
