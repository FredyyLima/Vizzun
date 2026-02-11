import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/filters/FilterSidebar";
import ProjectCard from "@/components/cards/ProjectCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SlidersHorizontal, Search, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const mockProjects = [
  {
    id: "1",
    title: "Reforma Completa de Apartamento 120m²",
    summary: "Preciso reformar apartamento de 3 quartos, incluindo troca de piso, pintura, parte elétrica e hidráulica. Já tenho o projeto aprovado.",
    location: "São Paulo, SP",
    budget: "R$ 80.000,00",
    budgetType: "exact" as const,
    category: "Reforma",
    postedAt: "Há 2 horas",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Projeto Arquitetônico - Casa de Campo",
    summary: "Busco arquiteto para desenvolver projeto de casa de campo com 200m², estilo moderno com elementos rústicos. Terreno em aclive.",
    location: "Campinas, SP",
    budget: "R$ 15.000 - R$ 25.000",
    budgetType: "range" as const,
    category: "Arquitetura",
    postedAt: "Há 5 horas",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Móveis Planejados para Escritório",
    summary: "Preciso de orçamento para móveis planejados de home office: mesa em L, armários e estante. Ambiente de 15m².",
    location: "Rio de Janeiro, RJ",
    budget: "A combinar",
    budgetType: "open" as const,
    category: "Marcenaria",
    postedAt: "Há 1 dia",
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    title: "Construção de Piscina Semi-olímpica",
    summary: "Projeto e execução de piscina semi-olímpica com deck em madeira de lei. Área total disponível: 150m². Prazo desejado: 4 meses.",
    location: "Belo Horizonte, MG",
    budget: "R$ 120.000,00",
    budgetType: "exact" as const,
    category: "Construção",
    postedAt: "Há 2 dias",
    imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Vizzun - Orçamento de Obra",
    summary: "Recebi um orçamento de R$200mil para construção de sobrado 180m². Gostaria de uma segunda opinião profissional antes de fechar.",
    location: "Curitiba, PR",
    budget: "R$ 500 - R$ 1.500",
    budgetType: "range" as const,
    category: "Consultoria",
    postedAt: "Há 3 dias",
  },
  {
    id: "6",
    title: "Paisagismo para Área Externa",
    summary: "Projeto de paisagismo para quintal de 80m². Desejo área gourmet integrada com jardim, iluminação noturna e sistema de irrigação.",
    location: "Salvador, BA",
    budget: "A combinar",
    budgetType: "open" as const,
    category: "Paisagismo",
    postedAt: "Há 4 dias",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  },
];
type StoredAnnouncement = {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  state: string;
  budget: string;
  createdAt: string;
  role?: string;
  status?: "Ativo" | "Pausado";
  dealStatus?: "pending" | "closed";
  attachments?: { id: string; name: string; type: string; url?: string; isPrimary?: boolean }[];
  primaryImageUrl?: string | null;
};

const announcementStorageKey = "site_announcements";

const loadStoredAnnouncements = () => {
  if (typeof window === "undefined") return [] as StoredAnnouncement[];
  const raw = localStorage.getItem(announcementStorageKey);
  if (!raw) return [] as StoredAnnouncement[];
  try {
    return JSON.parse(raw) as StoredAnnouncement[];
  } catch {
    return [] as StoredAnnouncement[];
  }
};

const formatPostedAt = (value: string) => {
  if (!value) return "Agora";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return "Há poucos minutos";
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Há ${diffHours} horas`;
  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays} dias`;
};

const mapAnnouncementsToProjects = (announcements: StoredAnnouncement[]) =>
  announcements
    .filter((item) => (item.status ?? "Ativo") === "Ativo" && item.dealStatus !== "closed")
    .map((item) => ({
      imageUrl:
        item.primaryImageUrl ??
        item.attachments?.find((att) => att.isPrimary && att.type.startsWith("image/"))?.url ??
        item.attachments?.find((att) => att.type.startsWith("image/"))?.url,
      id: item.id,
      title: item.title,
      summary: item.description,
      location: `${item.city}, ${item.state}`,
      budget: item.budget || "A combinar",
      budgetType: item.budget?.toLowerCase().includes("combinar") ? ("open" as const) : ("exact" as const),
      category: item.category,
      postedAt: formatPostedAt(item.createdAt),
    }));
const Projetos = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [storedAnnouncements, setStoredAnnouncements] = useState<StoredAnnouncement[]>(() => loadStoredAnnouncements());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const authUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { id?: string; email?: string };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reload = () => {
      setStoredAnnouncements(loadStoredAnnouncements());
    };
    window.addEventListener("storage", reload);
    window.addEventListener("announcements:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("announcements:changed", reload as EventListener);
    };
  }, []);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredProjects = useMemo(() => {
    const storedProjects = mapAnnouncementsToProjects(storedAnnouncements);
    const allProjects = [...storedProjects, ...mockProjects];

    const normalizedQuery = normalizeText(searchTerm.trim());
    const normalizedServices = selectedServices.map((service) => normalizeText(service));
    const normalizedState = normalizeText(selectedState.trim());

    return allProjects.filter((project) => {
      const titleMatch = normalizeText(project.title ?? "").includes(normalizedQuery);
      const summaryMatch = normalizeText(project.summary ?? "").includes(normalizedQuery);
      const categoryMatch = normalizeText(project.category ?? "").includes(normalizedQuery);
      const matchesQuery = normalizedQuery ? titleMatch || summaryMatch || categoryMatch : true;

      const stateValue = normalizeText(project.location?.split(",").pop()?.trim() ?? "");
      const matchesState = normalizedState ? stateValue === normalizedState : true;

      const categoryValue = normalizeText(project.category ?? "");
      const matchesService = normalizedServices.length
        ? normalizedServices.some((service) => categoryValue.includes(service))
        : true;

      return matchesQuery && matchesState && matchesService;
    });
  }, [storedAnnouncements, searchTerm, selectedState, selectedServices]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedState("");
    setSelectedServices([]);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedState, selectedServices, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProjects = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safePage, pageSize]);

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
        <div className="bg-gradient-accent py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-4">
                  Projetos Disponíveis
                </h1>
                <p className="text-lg text-secondary-foreground/80 max-w-2xl">
                  Encontre projetos que precisam de orçamentos e ofereça seus serviços.
                </p>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="whitespace-nowrap"
                onClick={() => {
                  if (authUser) {
                    navigate("/dashboard-usuario?section=anunciar");
                  } else {
                    setShowAuthPrompt(true);
                  }
                }}
              >
                <Plus className="h-5 w-5" />
                Publicar Projeto
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="mt-6 flex gap-3 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-0 bg-card shadow-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button variant="hero" size="lg" className="shadow-lg">
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
                  <span className="font-semibold text-foreground">{filteredProjects.length}</span> projetos encontrados
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
                {pagedProjects.map((project) => (
                  <ProjectCard key={project.id} {...project} />
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

      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entre para publicar</DialogTitle>
            <DialogDescription>
              Para criar um anúncio, é necessário fazer login ou criar uma conta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0">
            <Link to="/login">
              <Button variant="secondary">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button variant="outline">Criar conta</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projetos;





