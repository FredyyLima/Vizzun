import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, MapPin } from "lucide-react";
import type { useDashboardAnnouncements } from "@/hooks/use-dashboard-announcements";

type AnunciosSectionProps = {
  announcementsState: ReturnType<typeof useDashboardAnnouncements>;
};

const AnunciosSection = ({ announcementsState }: AnunciosSectionProps) => {
  const {
    userAnnouncements,
    handleViewAnnouncement,
    handlePauseAnnouncement,
    handleActivateAnnouncement,
    handleDeleteAnnouncement,
  } = announcementsState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus anúncios</CardTitle>
        <CardDescription>Veja todos os seus anúncios na plataforma.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {userAnnouncements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não publicou nenhum anúncio.</p>
          </div>
        ) : (
          userAnnouncements.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "Ativo" ? "secondary" : "outline"}>{item.status}</Badge>
                  {item.dealStatus === "closed" && <Badge variant="secondary">Negócio fechado</Badge>}
                  {item.dealStatus === "pending" && <Badge variant="outline">Negócio pendente</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {item.city} / {item.state}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Publicado em {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </span>
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {item.proposals} propostas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewAnnouncement(item.id)}>
                  Ver detalhes
                </Button>
                {item.status === "Ativo" ? (
                  <Button variant="ghost" size="sm" onClick={() => handlePauseAnnouncement(item.id)}>
                    Pausar anúncio
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => handleActivateAnnouncement(item.id)}>
                      Ativar anúncio
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAnnouncement(item.id)}>
                      Excluir anúncio
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AnunciosSection;
