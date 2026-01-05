import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-background rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-background rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para começar seu projeto?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
            Junte-se a milhares de clientes e profissionais que já utilizam o ConstruLink para realizar projetos incríveis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Criar Conta Grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button
                size="xl"
                className="w-full sm:w-auto bg-primary-foreground/10 text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/20"
              >
                Saiba Mais
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
