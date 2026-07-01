import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  ListChecks,
  Megaphone,
  MessageSquare,
  Settings,
  User,
  Handshake,
} from "lucide-react";
import { type ElementType, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDisplayName } from "@/lib/user";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnnouncements } from "@/hooks/use-dashboard-announcements";
import { useDashboardChats } from "@/hooks/use-dashboard-chats";
import { useDashboardProfile } from "@/hooks/use-dashboard-profile";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import AnunciosSection from "@/components/dashboard/AnunciosSection";
import AnnouncementFormSection from "@/components/dashboard/AnnouncementFormSection";
import PendingSection from "@/components/dashboard/PendingSection";
import ContractsSection from "@/components/dashboard/ContractsSection";
import ChatSection from "@/components/dashboard/ChatSection";
import ProfessionalProfileSection from "@/components/dashboard/ProfessionalProfileSection";
import ConfigSection from "@/components/dashboard/ConfigSection";
import SeoHead from "@/components/SeoHead";
import type { SectionKey } from "@/lib/dashboard-types";

const navItems: { key: SectionKey; label: string; icon: ElementType }[] = [
  { key: "chats", label: "Chat", icon: MessageSquare },
  { key: "anunciar", label: "Anunciar", icon: Megaphone },
  { key: "anuncios", label: "Meus anúncios", icon: ListChecks },
  { key: "pending", label: "Negócios pendentes", icon: Handshake },
  { key: "contracts", label: "Meus contratos", icon: Briefcase },
  { key: "profile", label: "Perfil Profissional", icon: User },
  { key: "config", label: "Configurações", icon: Settings },
];

const DashboardUsuario = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>("anuncios");

  const { user: authUser, loading: authLoading, refresh: refreshAuth } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login");
    }
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section") as SectionKey | null;
    if (section && ["anunciar", "anuncios", "chats", "config", "pending", "profile", "contracts"].includes(section)) {
      setActiveSection(section);
    }
  }, [location.search]);

  const ownerId = authUser?.id ?? authUser?.email ?? "guest";
  const ownerDisplayName = useMemo(() => getDisplayName(authUser, "Cliente"), [authUser]);

  const announcementsState = useDashboardAnnouncements({
    authUserId: authUser?.id,
    ownerId,
    setActiveSection,
  });

  const chatsState = useDashboardChats({
    authUserId: authUser?.id,
    ownerId,
    activeSection,
    setActiveSection,
  });

  const profileState = useDashboardProfile({
    authUserId: authUser?.id,
    authUserRole: authUser?.role,
    ownerId,
  });

  const configState = useDashboardConfig({
    authUserId: authUser?.id,
    refreshAuth,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title="Minha conta" description="Gerencie seus anúncios, chats, contratos e dados cadastrais na Vizzun." />
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <aside className="bg-card rounded-2xl border border-border shadow-card p-4 h-fit lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">Dashboard</h2>
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  const showBadge = item.key === "pending" && chatsState.pendingDeals.length > 0;
                  const unreadCount =
                    item.key === "chats"
                      ? chatsState.totalUnreadProjects
                      : item.key === "contracts"
                        ? chatsState.totalUnreadProfessionals
                        : 0;
                  return (
                    <Button
                      key={item.key}
                      variant={isActive ? "secondary" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => {
                        setActiveSection(item.key);
                        if (item.key === "anunciar") {
                          announcementsState.resetAnnouncementForm();
                        }
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {unreadCount > 0 && (
                        <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {unreadCount}
                        </span>
                      )}
                      {showBadge && (
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          {chatsState.pendingDeals.length}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </aside>

            <section className="space-y-6">
              {activeSection === "anuncios" && (
                <AnunciosSection announcementsState={announcementsState} />
              )}

              {activeSection === "pending" && (
                <PendingSection chatsState={chatsState} ownerId={ownerId} />
              )}

              {activeSection === "contracts" && (
                <ContractsSection chatsState={chatsState} ownerId={ownerId} />
              )}

              {activeSection === "profile" && (
                <ProfessionalProfileSection profileState={profileState} ownerDisplayName={ownerDisplayName} />
              )}

              {activeSection === "chats" && (
                <ChatSection chatsState={chatsState} ownerId={ownerId} />
              )}

              {activeSection === "anunciar" && (
                <AnnouncementFormSection announcementsState={announcementsState} />
              )}

              {activeSection === "config" && <ConfigSection configState={configState} />}
            </section>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={chatsState.showRejectDealModal} onOpenChange={chatsState.setShowRejectDealModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar negócio</DialogTitle>
            <DialogDescription>
              Informe um motivo (opcional) para o outro usuário.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={chatsState.rejectDealReason}
            onChange={(event) => chatsState.setRejectDealReason(event.target.value)}
            placeholder="Ex: Prazo não atende ou orçamento fora do esperado."
            className="min-h-[110px]"
          />
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => chatsState.setShowRejectDealModal(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={chatsState.handleRejectDeal}>
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardUsuario;
