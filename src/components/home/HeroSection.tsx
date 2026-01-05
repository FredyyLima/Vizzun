import { Search, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle py-16 md:py-24 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Marketplace de Serviços de Construção
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            O que você precisa{" "}
            <span className="text-gradient-primary">hoje?</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Conectamos você aos melhores profissionais de construção civil, arquitetura e marcenaria. Encontre orçamentos, segunda opinião ou ofereça seus serviços.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/profissionais">
              <Button variant="hero" size="xl" className="w-full sm:w-auto min-w-[280px]">
                <Search className="h-5 w-5" />
                Estou procurando um profissional
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
            <Link to="/projetos">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto min-w-[280px]">
                <Briefcase className="h-5 w-5" />
                Sou profissional e estou ofertando
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[
            { value: "2.500+", label: "Profissionais" },
            { value: "8.000+", label: "Projetos Realizados" },
            { value: "4.9", label: "Avaliação Média" },
            { value: "15+", label: "Estados Atendidos" },
          ].map((stat, index) => (
            <div key={index} className="text-center p-4 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-shadow">
              <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
