import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeDisplayName } from "@/lib/user";
import type { useDashboardChats } from "@/hooks/use-dashboard-chats";

type PendingSectionProps = {
  chatsState: ReturnType<typeof useDashboardChats>;
  ownerId: string;
};

const PendingSection = ({ chatsState, ownerId }: PendingSectionProps) => {
  const { pendingDeals, handleAcceptDeal, handleOpenRejectModal, handleOpenPendingChat } = chatsState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Negócios pendentes</CardTitle>
        <CardDescription>Negociações aguardando sua confirmação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingDeals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum negócio pendente no momento.</p>
          </div>
        ) : (
          pendingDeals.map((deal) => {
            const otherName = sanitizeDisplayName(
              deal.ownerId === ownerId ? deal.participantName : deal.ownerName,
              deal.ownerId === ownerId ? "Usuario" : "Cliente",
            );
            return (
              <div key={deal.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{deal.projectTitle}</h3>
                    <p className="text-sm text-muted-foreground">Solicitado por {otherName}</p>
                  </div>
                  <Badge variant="outline">Negócio pendente</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleAcceptDeal(deal.id)}>
                    Aceitar acordo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenRejectModal(deal.id)}>
                    Recusar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenPendingChat(deal.id)}>
                    Ver chat
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default PendingSection;
