import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/filters/FilterSidebar";
import ProfessionalCard from "@/components/cards/ProfessionalCard";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SlidersHorizontal, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const mockProfessionals = [
  {
    id: "1",
    name: "Carlos Silva",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    specialty: "Engenheiro Civil",
    rating: 4.9,
    reviewCount: 127,
    location: "São Paulo, SP",
    verified: true,
    services: ["Construção", "Reformas", "Projetos Estruturais"],
  },
  {
    id: "2",
    name: "Ana Martins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    specialty: "Arquiteta",
    rating: 4.8,
    reviewCount: 89,
    location: "Rio de Janeiro, RJ",
    verified: true,
    services: ["Arquitetura", "Design de Interiores", "Paisagismo"],
  },
  {
    id: "3",
    name: "Roberto Costa",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    specialty: "Marceneiro",
    rating: 4.7,
    reviewCount: 65,
    location: "Curitiba, PR",
    verified: false,
    services: ["Marcenaria", "Móveis sob Medida", "Restauração"],
  },
  {
    id: "4",
    name: "Fernanda Lima",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    specialty: "Designer de Interiores",
    rating: 5.0,
    reviewCount: 42,
    location: "Belo Horizonte, MG",
    verified: true,
    services: ["Design de Interiores", "Decoração", "Consultoria"],
  },
  {
    id: "5",
    name: "João Pedro",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    specialty: "Mestre de Obras",
    rating: 4.6,
    reviewCount: 98,
    location: "Salvador, BA",
    verified: true,
    services: ["Construção", "Reformas", "Acabamentos"],
  },
  {
    id: "6",
    name: "Marina Santos",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    specialty: "Arquiteta Paisagista",
    rating: 4.9,
    reviewCount: 55,
    location: "Porto Alegre, RS",
    verified: true,
    services: ["Paisagismo", "Projetos de Jardim", "Consultoria Verde"],
  },
];

type StoredProfile = {
  id: string;
  name: string;
  avatar?: string | null;
  specialty?: string | null;
  bio?: string | null;
  rating?: number;
  reviewCount?: number;
  location?: string;
  verified?: boolean;
  services?: string[];
  cities?: string[];
  reviews?: { id: string; author: string; rating: number; comment: string }[];
};

const profileStorageKey = "professional_profiles";

const loadStoredProfiles = () => {
  if (typeof window === "undefined") return [] as StoredProfile[];
  const raw = localStorage.getItem(profileStorageKey);
  if (!raw) return [] as StoredProfile[];
  try {
    return JSON.parse(raw) as StoredProfile[];
  } catch {
    return [] as StoredProfile[];
  }
};

const Profissionais = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [storedProfiles, setStoredProfiles] = useState<StoredProfile[]>(() => loadStoredProfiles());

  const handleClearFilters = () => {
    setSelectedServices([]);
    setSelectedState("");
    setSearchTerm("");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedServices, selectedState, pageSize]);

  useEffect(() => {
    const reload = () => setStoredProfiles(loadStoredProfiles());
    window.addEventListener("storage", reload);
    window.addEventListener("profiles:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("profiles:changed", reload as EventListener);
    };
  }, []);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredProfessionals = useMemo(() => {
    const normalizedQuery = normalizeText(searchTerm.trim());
    const normalizedServices = selectedServices.map((service) => normalizeText(service));
    const normalizedState = normalizeText(selectedState.trim());

    const mappedStored = storedProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      avatar:
        profile.avatar ||
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      specialty: profile.specialty || "Profissional",
      rating: profile.rating ?? 0,
      reviewCount: profile.reviewCount ?? 0,
      location: profile.location || profile.cities?.[0] || "",
      verified: profile.verified ?? true,
      services: profile.services ?? [],
    }));

    const combined = [...mappedStored, ...mockProfessionals];

    return combined.filter((professional) => {
      const matchesQuery = normalizedQuery
        ? [
            normalizeText(professional.name),
            normalizeText(professional.specialty),
            normalizeText(professional.location),
            ...(professional.services ?? []).map((service) => normalizeText(service)),
          ].some((value) => value.includes(normalizedQuery))
        : true;

      const stateValue = normalizeText(professional.location.split(",").pop()?.trim() ?? "");
      const matchesState = normalizedState ? stateValue === normalizedState : true;

      const serviceValue = normalizeText((professional.services ?? []).join(" "));
      const matchesService = normalizedServices.length
        ? normalizedServices.some((service) => serviceValue.includes(service))
        : true;

      return matchesQuery && matchesState && matchesService;
    });
  }, [searchTerm, selectedServices, selectedState, storedProfiles]);

  const totalPages = Math.max(1, Math.ceil(filteredProfessionals.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProfessionals = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProfessionals.slice(start, start + pageSize);
  }, [filteredProfessionals, safePage, pageSize]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, safePage + 2);
    for (let page = start; page <= end; page += 1) pages.push(page);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Encontre Profissionais
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl">
              Explore nossa rede de profissionais qualificados em construção, arquitetura e marcenaria.
            </p>
            
            {/* Search Bar */}
            <div className="mt-6 flex gap-3 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, especialidade..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-0 bg-card shadow-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-secondary"
                />
              </div>
              <Button variant="secondary" size="lg" className="shadow-lg">
                Buscar
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar
                  selectedServices={selectedServices}
                  selectedState={selectedState}
                  onServicesChange={setSelectedServices}
                  onStateChange={setSelectedState}
                  onClear={handleClearFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-6">
                <Button
                  variant="outline"
                  onClick={() => setShowMobileFilters(true)}
                  className="w-full justify-center"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {/* Results Count */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredProfessionals.length}</span> profissionais encontrados
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Resultados por página</span>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  >
                    {[10, 15, 20, 25, 30, 40, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pagedProfessionals.map((professional) => (
                  <ProfessionalCard key={professional.id} {...professional} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {safePage > 3 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                        </PaginationItem>
                      )}
                      {safePage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      {visiblePages.map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink isActive={page === safePage} onClick={() => setCurrentPage(page)}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      {safePage < totalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      {safePage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          className={safePage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/50"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-card animate-slide-in-right">
              <FilterSidebar
                isMobile
                onClose={() => setShowMobileFilters(false)}
                selectedServices={selectedServices}
                selectedState={selectedState}
                onServicesChange={setSelectedServices}
                onStateChange={setSelectedState}
                onClear={handleClearFilters}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profissionais;
