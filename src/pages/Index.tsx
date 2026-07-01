import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import SeoHead from "@/components/SeoHead";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead
        title="Segunda opinião de orçamentos para sua obra"
        description="Publique seu projeto e receba propostas de profissionais qualificados em reforma, arquitetura, marcenaria e mais."
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
