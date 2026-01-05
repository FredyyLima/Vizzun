import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Video,
  Headphones,
  Download,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const projectImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
];

const attachments = [
  { name: "Planta_Baixa.pdf", type: "pdf", size: "2.4 MB" },
  { name: "Projeto_Eletrico.pdf", type: "pdf", size: "1.8 MB" },
  { name: "Video_Ambiente.mp4", type: "video", size: "45 MB" },
  { name: "Audio_Briefing.mp3", type: "audio", size: "3.2 MB" },
];

const ProjetoDetalhe = () => {
  const { id } = useParams();
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % projectImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + projectImages.length) % projectImages.length);
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "video":
        return <Video className="h-5 w-5 text-violet-500" />;
      case "audio":
        return <Headphones className="h-5 w-5 text-emerald-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-muted/50 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/projetos" className="hover:text-foreground transition-colors">
                Projetos
              </Link>
              <span>/</span>
              <span className="text-foreground">Reforma Completa de Apartamento</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={projectImages[currentImage]}
                    alt={`Imagem ${currentImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 shadow-lg hover:bg-card transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 shadow-lg hover:bg-card transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/80 text-background text-sm font-medium">
                    {currentImage + 1} / {projectImages.length}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {projectImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden ring-2 transition-all ${
                        currentImage === index ? "ring-primary" : "ring-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    Reforma
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-semibold">
                    R$ 80.000,00
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Reforma Completa de Apartamento 120m²
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    São Paulo, SP
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Publicado há 2 horas
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    João Mendes
                  </div>
                </div>

                <div className="prose prose-gray max-w-none">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Descrição do Projeto</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Preciso reformar apartamento de 3 quartos com 120m², localizado no Jardins, São Paulo. 
                    O projeto inclui troca completa do piso (porcelanato), pintura de todas as paredes e 
                    tetos, revisão completa da parte elétrica (incluindo novo quadro de distribuição) e 
                    hidráulica.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    A cozinha será aberta para a sala (remoção de parede não estrutural já aprovada em 
                    projeto). Os banheiros serão reformados com troca de louças, metais e revestimentos. 
                    Já possuo o projeto aprovado pela prefeitura e memorial descritivo detalhado.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    <strong>Prazo desejado:</strong> 3 a 4 meses<br />
                    <strong>Início previsto:</strong> Março de 2024<br />
                    <strong>Observação:</strong> O apartamento estará desocupado durante toda a obra.
                  </p>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Anexos ({attachments.length})
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {attachments.map((attachment, index) => (
                    <button
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
                    >
                      {getAttachmentIcon(attachment.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Budget Card */}
                <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    <span className="text-sm font-medium text-muted-foreground">Orçamento</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    R$ 80.000,00
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Valor exato definido pelo cliente
                  </p>
                  
                  <Link to={`/chat/${id}`}>
                    <Button variant="secondary" size="lg" className="w-full">
                      <MessageSquare className="h-5 w-5" />
                      Fazer Proposta
                    </Button>
                  </Link>
                </div>

                {/* Client Card */}
                <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                  <h4 className="font-semibold text-foreground mb-4">Sobre o Cliente</h4>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">João Mendes</p>
                      <p className="text-sm text-muted-foreground">Membro desde 2022</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projetos publicados</span>
                      <span className="font-medium text-foreground">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projetos finalizados</span>
                      <span className="font-medium text-foreground">2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjetoDetalhe;
