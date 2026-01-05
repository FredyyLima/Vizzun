import { Building, PenTool, Hammer, Wrench, Home, Paintbrush } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Building,
    title: "Construção Civil",
    description: "Engenheiros e empreiteiros para projetos de todos os portes",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: PenTool,
    title: "Arquitetura",
    description: "Projetos arquitetônicos, plantas e design de interiores",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: Hammer,
    title: "Marcenaria",
    description: "Móveis sob medida, portas, janelas e acabamentos em madeira",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Wrench,
    title: "Reformas",
    description: "Reformas residenciais e comerciais completas",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Home,
    title: "Paisagismo",
    description: "Projetos de jardins, áreas externas e piscinas",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: Paintbrush,
    title: "Acabamentos",
    description: "Pintura, gesso, revestimentos e acabamentos finais",
    color: "bg-rose-500/10 text-rose-600",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Serviços Disponíveis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre profissionais qualificados para cada etapa do seu projeto
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Link
              key={index}
              to="/profissionais"
              className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/30 shadow-card hover:shadow-card-hover transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
