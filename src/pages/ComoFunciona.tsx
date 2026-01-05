import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Shield, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Users,
    title: "Rede de Profissionais Verificados",
    description: "Todos os profissionais passam por um processo de verificação de credenciais e experiência.",
  },
  {
    icon: Shield,
    title: "Negociação Segura",
    description: "Chat integrado e sistema de confirmação de acordo para garantir transparência nas negociações.",
  },
  {
    icon: Zap,
    title: "Orçamentos Rápidos",
    description: "Publique seu projeto e receba propostas de profissionais qualificados em poucas horas.",
  },
];

const faqItems = [
  {
    question: "Como funciona o processo de contratação?",
    answer: "Você publica seu projeto, recebe propostas de profissionais qualificados, negocia pelo chat e fecha o negócio quando ambas as partes concordarem.",
  },
  {
    question: "Quanto custa usar a plataforma?",
    answer: "O cadastro é gratuito tanto para clientes quanto para profissionais. Cobramos apenas uma pequena taxa sobre projetos fechados com sucesso.",
  },
  {
    question: "Como sei que o profissional é confiável?",
    answer: "Todos os profissionais passam por verificação de documentos. Além disso, você pode ver avaliações de outros clientes antes de contratar.",
  },
  {
    question: "Posso cancelar um projeto?",
    answer: "Sim, você pode cancelar a qualquer momento antes de fechar o acordo. Após o fechamento, políticas específicas de cancelamento se aplicam.",
  },
];

const ComoFunciona = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-subtle">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Como o ConstruLink Funciona
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Conectamos clientes e profissionais da construção de forma simples, segura e eficiente.
            </p>
            <Link to="/cadastro">
              <Button variant="hero" size="xl">
                Comece Agora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works Steps */}
        <HowItWorksSection />

        {/* Benefits */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Por que escolher o ConstruLink?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Oferecemos as melhores ferramentas para conectar você ao profissional ideal
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="p-8 rounded-2xl bg-background border border-border shadow-card hover:shadow-card-hover transition-all text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl border border-border p-6"
                >
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {item.question}
                      </h3>
                      <p className="text-muted-foreground">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de clientes e profissionais que já utilizam o ConstruLink.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button variant="secondary" size="xl">
                  Criar Conta Grátis
                </Button>
              </Link>
              <Link to="/profissionais">
                <Button
                  size="xl"
                  className="bg-primary-foreground/10 text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/20"
                >
                  Ver Profissionais
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ComoFunciona;
