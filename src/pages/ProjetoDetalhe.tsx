import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Headphones,
  Download,
  MessageSquare,
  User,
  Play,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDisplayName, sanitizeDisplayName } from "@/lib/user";

const projectImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
];

const fallbackAttachments: AttachmentItem[] = [];

type StoredAnnouncement = {
  id: string;
  ownerId?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  title: string;
  category: string;
  description: string;
  city: string;
  state: string;
  budget: string;
  deadline?: string;
  createdAt: string;
  attachments?: { id: string; name: string; type: string; url?: string; isPrimary?: boolean }[];
  primaryImageUrl?: string | null;
};

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string;
  personType?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
};

type GalleryItem = {
  type: "image" | "video";
  url: string;
  name?: string;
};

type AttachmentItem = {
  name: string;
  type: "pdf" | "audio" | "file";
  size?: string;
  url?: string;
};

type ProjectDetail = {
  title: string;
  category: string;
  budget: string;
  budgetLabel: string;
  location: string;
  postedAt: string;
  clientName: string;
  clientEmail?: string | null;
  memberSince: string;
  projectsPublished: number;
  projectsFinished: number;
  description: string[];
  extraInfo?: { label: string; value: string }[];
  gallery: GalleryItem[];
  attachments: AttachmentItem[];
};

const fallbackGallery: GalleryItem[] = projectImages.map((url) => ({
  type: "image",
  url,
}));

const fallbackAttachmentItems: AttachmentItem[] = fallbackAttachments;

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

const formatPostedAt = (value?: string) => {
  if (!value) return "Publicado recentemente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Publicado recentemente";
  return `Publicado em ${date.toLocaleDateString("pt-BR")}`;
};

const getAttachmentType = (type: string) => {
  if (type.includes("pdf")) return "pdf" as const;
  if (type.startsWith("image/")) return "image" as const;
  if (type.startsWith("video/")) return "video" as const;
  if (type.startsWith("audio/")) return "audio" as const;
  return "file" as const;
};

const isGalleryAttachment = (type: string) => type.startsWith("image/") || type.startsWith("video/");

const getDownloadAttachmentType = (type: string) => {
  const resolved = getAttachmentType(type);
  if (resolved === "image" || resolved === "video") return "file" as const;
  return resolved;
};

const ProjetoDetalhe = () => {
  const { id } = useParams();
  const [currentMedia, setCurrentMedia] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [storedAnnouncements, setStoredAnnouncements] = useState<StoredAnnouncement[]>(() => loadStoredAnnouncements());
  const authUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reload = () => setStoredAnnouncements(loadStoredAnnouncements());
    window.addEventListener("storage", reload);
    window.addEventListener("announcements:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("announcements:changed", reload as EventListener);
    };
  }, []);

  const announcement = useMemo(
    () => storedAnnouncements.find((item) => item.id === id) ?? null,
    [storedAnnouncements, id],
  );

  const isOwner =
    !!announcement &&
    !!authUser &&
    (announcement.ownerId === authUser.id || (authUser.email && announcement.ownerId === authUser.email));
  const canStartChat = !!authUser;

  const ownerStats = useMemo(() => {
    if (!announcement) return null;
    const ownerKey = announcement.ownerId ?? announcement.ownerEmail ?? announcement.ownerName ?? announcement.id;
    const ownerAnnouncements = storedAnnouncements.filter((item) => {
      const key = item.ownerId ?? item.ownerEmail ?? item.ownerName ?? item.id;
      return key === ownerKey;
    });
    const dates = ownerAnnouncements
      .map((item) => new Date(item.createdAt).getTime())
      .filter((value) => !Number.isNaN(value));
    const earliest = dates.length ? new Date(Math.min(...dates)) : null;
    const memberSinceYear = earliest ? earliest.getFullYear() : new Date().getFullYear();
    return {
      memberSince: `Membro desde ${memberSinceYear}`,
      projectsPublished: ownerAnnouncements.length,
    };
  }, [announcement, storedAnnouncements]);

  const detail: ProjectDetail = useMemo(() => {
    if (announcement) {
      const attachments = announcement.attachments ?? [];
      let gallery = attachments
        .filter((att) => att.url && isGalleryAttachment(att.type))
        .map((att) => ({
          name: att.name,
          url: att.url as string,
          type: att.type.startsWith("video/") ? "video" : "image",
        }));
      const primaryUrl = announcement.primaryImageUrl ?? null;
      if (primaryUrl) {
        if (gallery.some((item) => item.url === primaryUrl)) {
          gallery = [
            ...gallery.filter((item) => item.url === primaryUrl),
            ...gallery.filter((item) => item.url !== primaryUrl),
          ];
        } else {
          gallery = [{ type: "image", url: primaryUrl, name: "Imagem principal" }, ...gallery];
        }
      }
      if (gallery.length === 0) {
        gallery = fallbackGallery;
      }

      const downloadAttachments = attachments
        .filter((att) => !isGalleryAttachment(att.type) || !att.url)
        .map((att) => ({
          name: att.name,
          type: getDownloadAttachmentType(att.type),
          url: att.url,
        }));

      const matchesAuthUser =
        authUser &&
        (announcement.ownerId === authUser.id || (authUser.email && announcement.ownerId === authUser.email));
      const fallbackName = matchesAuthUser ? getDisplayName(authUser, "Cliente") : null;
      const fallbackEmail = matchesAuthUser ? authUser?.email ?? null : null;

      return {
        title: announcement.title,
        category: announcement.category,
        budget: announcement.budget,
        budgetLabel: announcement.budget?.toLowerCase().includes("combinar")
          ? "Valor a combinar"
          : "Valor definido pelo cliente",
        location: `${announcement.city}, ${announcement.state}`,
        postedAt: formatPostedAt(announcement.createdAt),
        clientName: sanitizeDisplayName(announcement.ownerName?.trim() || fallbackName || "Cliente", "Cliente"),
        clientEmail: announcement.ownerEmail ?? fallbackEmail ?? null,
        memberSince: ownerStats?.memberSince ?? "Membro desde este ano",
        projectsPublished: ownerStats?.projectsPublished ?? 0,
        projectsFinished: 0,
        description: announcement.description ? [announcement.description] : [],
        extraInfo: announcement.deadline
          ? [{ label: "Prazo desejado", value: announcement.deadline }]
          : undefined,
        gallery,
        attachments: downloadAttachments.length ? downloadAttachments : fallbackAttachmentItems,
      };
    }

    return {
      title: "Reforma Completa de Apartamento 120m²",
      category: "Reforma",
      budget: "R$ 80.000,00",
      budgetLabel: "Valor exato definido pelo cliente",
      location: "São Paulo, SP",
      postedAt: "Publicado há 2 horas",
      clientName: "João Mendes",
      clientEmail: "joao.mendes@email.com",
      memberSince: "Membro desde 2022",
      projectsPublished: 3,
      projectsFinished: 2,
      description: [
        "Preciso reformar apartamento de 3 quartos com 120m², localizado no Jardins, São Paulo. O projeto inclui troca completa do piso (porcelanato), pintura de todas as paredes e tetos, revisão completa da parte elétrica (incluindo novo quadro de distribuição) e hidráulica.",
        "A cozinha será aberta para a sala (remoção de parede não estrutural já aprovada em projeto). Os banheiros serão reformados com troca de louças, metais e revestimentos. Já possuo o projeto aprovado pela prefeitura e memorial descritivo detalhado.",
      ],
      extraInfo: [
        { label: "Prazo desejado", value: "3 a 4 meses" },
        { label: "Início previsto", value: "Março de 2024" },
        { label: "Observação", value: "O apartamento estará desocupado durante toda a obra." },
      ],
      gallery: fallbackGallery,
      attachments: fallbackAttachmentItems,
    };
  }, [announcement, authUser, ownerStats]);

  useEffect(() => {
    setCurrentMedia(0);
  }, [detail.gallery]);

  const nextMedia = () => {
    if (detail.gallery.length <= 1) return;
    setCurrentMedia((prev) => (prev + 1) % detail.gallery.length);
  };

  const prevMedia = () => {
    if (detail.gallery.length <= 1) return;
    setCurrentMedia((prev) => (prev - 1 + detail.gallery.length) % detail.gallery.length);
  };

  const getAttachmentIcon = (type: AttachmentItem["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "audio":
        return <Headphones className="h-5 w-5 text-emerald-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const activeMedia = detail.gallery[currentMedia] ?? detail.gallery[0];
  const hasGalleryNav = detail.gallery.length > 1;

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
              <span className="text-foreground">{detail.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="h-full w-full"
                    aria-label="Abrir visualização da mídia"
                  >
                    {activeMedia?.type === "video" ? (
                      <div className="relative h-full w-full">
                        <video
                          src={activeMedia.url}
                          className="h-full w-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={activeMedia?.url}
                        alt={`Mídia ${currentMedia + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>

                  {hasGalleryNav && (
                    <>
                      <button
                        onClick={prevMedia}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 shadow-lg hover:bg-card transition-colors"
                        aria-label="Mídia anterior"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextMedia}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 shadow-lg hover:bg-card transition-colors"
                        aria-label="Próxima mídia"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/80 text-background text-sm font-medium">
                        {currentMedia + 1} / {detail.gallery.length}
                      </div>
                    </>
                  )}
                </div>

                {hasGalleryNav && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {detail.gallery.map((item, index) => (
                      <button
                        key={`${item.url}-${index}`}
                        onClick={() => setCurrentMedia(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden ring-2 transition-all ${
                          currentMedia === index ? "ring-primary" : "ring-transparent opacity-60 hover:opacity-100"
                        }`}
                        aria-label={`Selecionar mídia ${index + 1}`}
                      >
                        {item.type === "video" ? (
                          <div className="relative h-full w-full">
                            <video
                              src={item.url}
                              className="h-full w-full object-cover"
                              preload="metadata"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[95vw] w-fit">
                  <div className="relative">
                    {activeMedia?.type === "video" ? (
                      <video
                        src={activeMedia.url}
                        controls
                        autoPlay
                        className="max-h-[80vh] w-full rounded-lg bg-black"
                      />
                    ) : (
                      <img
                        src={activeMedia?.url}
                        alt={`Mídia ${currentMedia + 1}`}
                        className="max-h-[80vh] w-full object-contain rounded-lg"
                      />
                    )}

                    {hasGalleryNav && (
                      <>
                        <button
                          type="button"
                          onClick={prevMedia}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 shadow-lg hover:bg-card transition-colors"
                          aria-label="Mídia anterior"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          type="button"
                          onClick={nextMedia}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 shadow-lg hover:bg-card transition-colors"
                          aria-label="Próxima mídia"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/80 text-background text-sm font-medium">
                          {currentMedia + 1} / {detail.gallery.length}
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Project Details */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {detail.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-semibold">
                    {detail.budget}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{detail.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {detail.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {detail.postedAt}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {detail.clientName}
                  </div>
                </div>

                <div className="prose prose-gray max-w-none">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Descrição do Projeto</h3>
                  {detail.description.map((paragraph) => (
                    <p key={paragraph} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {detail.extraInfo && detail.extraInfo.length > 0 && (
                    <p className="text-muted-foreground leading-relaxed mt-4">
                      {detail.extraInfo.map((item) => (
                        <span key={item.label} className="block">
                          <strong>{item.label}:</strong> {item.value}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {detail.attachments.length > 0 && (
                <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Anexos ({detail.attachments.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {detail.attachments.map((attachment) => {
                      const content = (
                        <>
                          {getAttachmentIcon(attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {attachment.size ?? "Arquivo anexado"}
                            </p>
                          </div>
                          {attachment.url && (
                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </>
                      );

                      return attachment.url ? (
                        <a
                          key={attachment.name}
                          href={attachment.url}
                          download={attachment.name}
                          className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
                        >
                          {content}
                        </a>
                      ) : (
                        <div
                          key={attachment.name}
                          className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 text-left"
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                  <div className="text-3xl font-bold text-foreground mb-2">{detail.budget}</div>
                  <p className="text-sm text-muted-foreground mb-6">{detail.budgetLabel}</p>

                  {isOwner ? (
                    <Link to="/dashboard-usuario">
                      <Button variant="secondary" size="lg" className="w-full">
                        <User className="h-5 w-5" />
                        Minha conta
                      </Button>
                    </Link>
                  ) : canStartChat ? (
                    <Link to={`/chat/${id}`}>
                      <Button variant="secondary" size="lg" className="w-full">
                        <MessageSquare className="h-5 w-5" />
                        Fazer Proposta
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowAuthPrompt(true)}>
                      <MessageSquare className="h-5 w-5" />
                      Fazer Proposta
                    </Button>
                  )}
                </div>

                {/* Client Card */}
                <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                  <h4 className="font-semibold text-foreground mb-4">Sobre o Cliente</h4>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{detail.clientName}</p>
                      <p className="text-sm text-muted-foreground">{detail.memberSince}</p>
                      <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        E-mail verificado
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projetos publicados</span>
                      <span className="font-medium text-foreground">{detail.projectsPublished}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projetos finalizados</span>
                      <span className="font-medium text-foreground">{detail.projectsFinished}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entre para enviar proposta</DialogTitle>
            <DialogDescription>
              Para iniciar um chat com o proprietário do anúncio, é necessário fazer login ou criar uma conta.
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

export default ProjetoDetalhe;
