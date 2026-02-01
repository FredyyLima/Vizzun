import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MapPin, CheckCircle } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

const mockProfessionals = [
  {
    id: "1",
    name: "Carlos Silva",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    specialty: "Engenheiro Civil",
    rating: 4.9,
    reviewCount: 127,
    location: "São Paulo, SP",
    verified: true,
    services: ["Construção", "Reformas", "Projetos Estruturais"],
    cities: ["São Paulo, SP"],
    reviews: [
      {
        id: "r1",
        author: "Fernanda Lima",
        rating: 5,
        comment: "Excelente profissional, cumpriu prazos e entregou com qualidade.",
      },
    ],
  },
  {
    id: "2",
    name: "Ana Martins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    specialty: "Arquiteta",
    rating: 4.8,
    reviewCount: 89,
    location: "Rio de Janeiro, RJ",
    verified: true,
    services: ["Arquitetura", "Design de Interiores", "Paisagismo"],
    cities: ["Rio de Janeiro, RJ"],
    reviews: [],
  },
  {
    id: "3",
    name: "Roberto Costa",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    specialty: "Marceneiro",
    rating: 4.7,
    reviewCount: 65,
    location: "Curitiba, PR",
    verified: false,
    services: ["Marcenaria", "Móveis sob Medida", "Restauração"],
    cities: ["Curitiba, PR"],
    reviews: [],
  },
];

type StoredProfile = {
  id: string;
  name: string;
  avatar?: string | null;
  specialty?: string | null;
  bio?: string | null;
  services?: string[];
  rating?: number;
  reviewCount?: number;
  location?: string;
  verified?: boolean;
  cities?: string[];
  reviews?: { id: string; author: string; rating: number; comment: string }[];
};

const profileStorageKey = "professional_profiles";

const loadStoredProfiles = () => {
  if (typeof window === "undefined") return [] as StoredProfile[];
  const raw = localStorage.getItem(profileStorageKey);
  if (!raw) return [] as StoredProfile[];
  try {
    return JSON.parse(raw) as StoredProfile[];
  } catch {
    return [] as StoredProfile[];
  }
};

const ProfissionalDetalhe = () => {
  const { id } = useParams();
  const profiles = useMemo(() => loadStoredProfiles(), []);

  const profile = useMemo(() => {
    if (!id) return null;
    const stored = profiles.find((item) => item.id === id);
    if (stored) {
      return {
        id: stored.id,
        name: stored.name,
        avatar: stored.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
        specialty: stored.specialty || "Profissional",
        bio: stored.bio || "",
        rating: stored.rating ?? 0,
        reviewCount: stored.reviewCount ?? 0,
        location: stored.location || "",
        verified: stored.verified ?? true,
        services: stored.services ?? [],
        cities: stored.cities ?? (stored.location ? [stored.location] : []),
        reviews: stored.reviews ?? [],
      };
    }
    return mockProfessionals.find((item) => item.id === id) ?? null;
  }, [id, profiles]);

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Profissional não encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Não localizamos este perfil. Volte para a lista de profissionais.
              </p>
              <Link to="/profissionais">
                <Button variant="secondary">Voltar</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground">
            <Link to="/profissionais" className="hover:text-foreground transition-colors">
              Profissionais
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{profile.name}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[320px_1fr] gap-8">
            <Card className="h-fit">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative mx-auto w-28 h-28">
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-2xl object-cover" />
                  {profile.verified && (
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
                      <CheckCircle className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{profile.name}</h1>
                  <p className="text-sm text-muted-foreground">{profile.specialty}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="text-sm font-semibold">{profile.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({profile.reviewCount} avaliações)</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location || "Localização não informada"}</span>
                </div>
                <Link to={`/chat-profissional/${profile.id}`}>
                  <Button variant="secondary" className="w-full">
                    Contrate-me
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quem sou eu</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.bio ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      O profissional ainda não adicionou uma descrição.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Habilidades</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma habilidade cadastrada.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.services.map((service) => (
                        <Badge key={service} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cidades atendidas</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.cities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma cidade cadastrada.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.cities.map((city) => (
                        <Badge key={city} variant="outline">
                          {city}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avaliações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Comentários aparecerão apenas após negócios fechados na plataforma.
                    </p>
                  ) : (
                    profile.reviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{review.author}</p>
                          <div className="flex items-center gap-1 text-sm text-secondary">
                            <Star className="h-3 w-3 fill-secondary" />
                            <span>{review.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfissionalDetalhe;
