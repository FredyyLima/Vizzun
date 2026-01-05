import { FileSearch, MessageSquare, Handshake, Check } from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    step: "01",
    title: "Publique seu Projeto",
    description: "Descreva o que você precisa, adicione fotos e defina seu orçamento.",
  },
  {
    icon: MessageSquare,
    step: "02",
    title: "Receba Propostas",
    description: "Profissionais qualificados enviarão propostas para seu projeto.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Negocie e Feche",
    description: "Converse pelo chat, compare propostas e feche o melhor negócio.",
  },
  {
    icon: Check,
    step: "04",
    title: "Avalie o Serviço",
    description: "Após a conclusão, avalie o profissional e ajude outros clientes.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um processo simples para conectar você ao profissional ideal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-border" />
              )}
              
              <div className="relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-secondary-foreground font-bold text-sm">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
