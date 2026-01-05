import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/filters/FilterSidebar";
import ProjectCard from "@/components/cards/ProjectCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Search, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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
    title: "Segunda Opinião - Orçamento de Obra",
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

const Projetos = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
              <Link to="/novo-projeto">
                <Button variant="hero" size="lg" className="whitespace-nowrap">
                  <Plus className="h-5 w-5" />
                  Publicar Projeto
                </Button>
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="mt-6 flex gap-3 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
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
                <FilterSidebar />
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
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{mockProjects.length}</span> projetos encontrados
                </p>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockProjects.map((project) => (
                  <ProjectCard key={project.id} {...project} />
                ))}
              </div>
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
              <FilterSidebar isMobile onClose={() => setShowMobileFilters(false)} />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Projetos;
