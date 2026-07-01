import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  Briefcase,
  ListChecks,
  Megaphone,
  MessageSquare,
  Settings,
  User,
  Handshake,
} from "lucide-react";
import { type ElementType, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDisplayName } from "@/lib/user";
import { apiPath } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnnouncements } from "@/hooks/use-dashboard-announcements";
import { useDashboardChats } from "@/hooks/use-dashboard-chats";
import AnunciosSection from "@/components/dashboard/AnunciosSection";
import AnnouncementFormSection from "@/components/dashboard/AnnouncementFormSection";
import PendingSection from "@/components/dashboard/PendingSection";
import ContractsSection from "@/components/dashboard/ContractsSection";
import ChatSection from "@/components/dashboard/ChatSection";
import type {
  ProfessionalProfile,
  SectionKey,
  UserProfile,
} from "@/lib/dashboard-types";
import { formatCnpj } from "@/lib/dashboard-formatters";
import { dataUrlToBlob, resizeImage, uploadFile } from "@/lib/upload";

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
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [profileServices, setProfileServices] = useState("");
  const [profileCities, setProfileCities] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [configProfile, setConfigProfile] = useState<UserProfile | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configBirthDate, setConfigBirthDate] = useState("");
  const [configRg, setConfigRg] = useState("");
  const [configPhone, setConfigPhone] = useState("");
  const [configEmail, setConfigEmail] = useState("");
  const [configCompanyName, setConfigCompanyName] = useState("");
  const [configTradeName, setConfigTradeName] = useState("");
  const [configContactName, setConfigContactName] = useState("");
  const [configContactEmail, setConfigContactEmail] = useState("");
  const [configContactPhone, setConfigContactPhone] = useState("");
  const [configContactCpf, setConfigContactCpf] = useState("");
  const [configContactRg, setConfigContactRg] = useState("");
  const [configContactBirthDate, setConfigContactBirthDate] = useState("");
  const [configServices, setConfigServices] = useState("");
  const [configPassword, setConfigPassword] = useState("");
  const [configPasswordConfirm, setConfigPasswordConfirm] = useState("");
  const [configCnpjCard, setConfigCnpjCard] = useState("");
  const [configCnpjCardName, setConfigCnpjCardName] = useState("");
  const [configHasCnpjCard, setConfigHasCnpjCard] = useState(false);
  const passwordCriteria = {
    minLength: configPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(configPassword),
    hasNumber: /\d/.test(configPassword),
  };
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!authUser?.id || authUser.role !== "PROFESSIONAL") return;
    let active = true;
    fetch(apiPath(`/api/professionals/${authUser.id}`))
      .then((response) => (response.ok ? response.json() : null))
      .then((profile: ProfessionalProfile | null) => {
        if (!active || !profile) return;
        setProfileAvatar(profile.avatar ?? "");
        setProfileSpecialty(profile.specialty ?? "");
        setProfileBio(profile.bio ?? "");
        setProfileServices((profile.services ?? []).join(", "));
        setProfileCities((profile.cities ?? []).join(", "));
      })
      .catch(() => {
        // sem perfil ainda cadastrado - formulario fica em branco, comportamento esperado
      });
    return () => {
      active = false;
    };
  }, [authUser?.id, authUser?.role]);

  useEffect(() => {
    if (!authUser?.id) return;
    const loadProfile = async () => {
      setConfigLoading(true);
      try {
        const response = await fetch(apiPath("/api/me"), { credentials: "include" });
        if (!response.ok) {
          throw new Error("Falha ao carregar dados do usuário.");
        }
        const data = (await response.json()) as UserProfile;
        setConfigProfile(data);
        setConfigBirthDate(data.birthDate ? new Date(data.birthDate).toISOString().slice(0, 10) : "");
        setConfigRg(data.rg ?? "");
        setConfigPhone(data.phone ?? "");
        setConfigEmail(data.email ?? "");
        setConfigCompanyName(data.companyName ?? "");
        setConfigTradeName(data.tradeName ?? "");
        setConfigContactName(data.contactName ?? "");
        setConfigContactEmail(data.contactEmail ?? "");
        setConfigContactPhone(data.contactPhone ?? "");
        setConfigContactCpf(data.contactCpf ?? "");
        setConfigContactRg(data.contactRg ?? "");
        setConfigContactBirthDate(
          data.contactBirthDate ? new Date(data.contactBirthDate).toISOString().slice(0, 10) : "",
        );
        setConfigServices((data.services ?? []).join(", "));
        setConfigHasCnpjCard(Boolean(data.hasCnpjCard));
      } catch (error) {
        toast.error("Não foi possível carregar os dados de cadastro.");
      } finally {
        setConfigLoading(false);
      }
    };
    loadProfile();
  }, [authUser?.id]);

  const handleSaveProfessionalProfile = async () => {
    if (!ownerId) return;
    const services = profileServices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const cities = profileCities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch(apiPath("/api/me/professional-profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          avatar: profileAvatar.trim() || null,
          specialty: profileSpecialty.trim() || null,
          bio: profileBio.trim() || null,
          services,
          cities,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.message ?? "Não foi possível salvar o perfil profissional.");
        return;
      }
      toast.success("Perfil profissional atualizado.");
    } catch (error) {
      console.error("Erro ao salvar perfil profissional:", error);
      toast.error("Não foi possível salvar o perfil profissional.");
    }
  };

  const handleConfigCnpjCardChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setConfigCnpjCard("");
      setConfigCnpjCardName("");
      return;
    }
    try {
      const url = await uploadFile(file, file.name);
      setConfigCnpjCard(url);
      setConfigCnpjCardName(file.name);
    } catch (error) {
      console.error("Erro ao enviar cartao CNPJ:", error);
      toast.error("Não foi possível enviar o cartão CNPJ.");
      event.target.value = "";
    }
  };

  const handleSaveConfig = async () => {
    if (!authUser?.id || !configProfile) return;
    if (configPassword && configPassword !== configPasswordConfirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (
      configProfile.personType === "CNPJ" &&
      configCompanyName.trim() !== (configProfile.companyName ?? "") &&
      !configCnpjCard
    ) {
      toast.error("Envie o cartão CNPJ para atualizar a razão social.");
      return;
    }

    const services = configServices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      birthDate: configBirthDate || undefined,
      rg: configRg || undefined,
      phone: configPhone || undefined,
      email: configEmail || undefined,
      companyName: configCompanyName || undefined,
      tradeName: configTradeName || undefined,
      contactName: configContactName || undefined,
      contactEmail: configContactEmail || undefined,
      contactPhone: configContactPhone || undefined,
      contactCpf: configContactCpf || undefined,
      contactRg: configContactRg || undefined,
      contactBirthDate: configContactBirthDate || undefined,
      services,
      password: configPassword || undefined,
      cnpjCard: configCnpjCard || undefined,
    };

    setConfigSaving(true);
    try {
      const response = await fetch(apiPath("/api/me"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.message ?? "Não foi possível salvar as alterações.");
        return;
      }
      setConfigProfile(result);
      setConfigHasCnpjCard(Boolean(result?.hasCnpjCard));
      setConfigPassword("");
      setConfigPasswordConfirm("");
      setConfigCnpjCard("");
      setConfigCnpjCardName("");
      await refreshAuth();
      toast.success("Dados atualizados com sucesso.");
    } catch (error) {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleProfileAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file, 500, 0.85);
      const url = await uploadFile(dataUrlToBlob(resized), file.name);
      setProfileAvatar(url);
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
      toast.error("Não foi possível carregar a foto.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Perfil Profissional</CardTitle>
                    <CardDescription>Complete seu perfil para aparecer na lista de profissionais.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Nome de exibição</label>
                        <Input value={ownerDisplayName} disabled />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Foto de perfil</label>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl overflow-hidden border border-border bg-muted">
                              {profileAvatar ? (
                                <img src={profileAvatar} alt="Foto do perfil" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">Upload da foto</p>
                              <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WEBP.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => profileAvatarInputRef.current?.click()}
                            >
                              Selecionar arquivo
                            </Button>
                            <input
                              ref={profileAvatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProfileAvatarChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Profissão</label>
                        <Input
                          placeholder="Ex: Arquiteto, Engenheiro Civil"
                          value={profileSpecialty}
                          onChange={(event) => setProfileSpecialty(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cidades atendidas</label>
                        <Input
                          placeholder="Ex: São Paulo, SP, Campinas, SP"
                          value={profileCities}
                          onChange={(event) => setProfileCities(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Quem sou eu</label>
                      <Textarea
                        placeholder="Conte um pouco sobre você, sua experiência e diferencial."
                        value={profileBio}
                        onChange={(event) => setProfileBio(event.target.value)}
                        className="min-h-[140px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Habilidades/serviços</label>
                      <Textarea
                        placeholder="Ex: Reforma, Arquitetura, Marcenaria"
                        value={profileServices}
                        onChange={(event) => setProfileServices(event.target.value)}
                        className="min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground">Separe por vírgulas.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={handleSaveProfessionalProfile}>
                        Salvar perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "chats" && (
                <ChatSection chatsState={chatsState} ownerId={ownerId} />
              )}

              {activeSection === "anunciar" && (
                <AnnouncementFormSection announcementsState={announcementsState} />
              )}

              {activeSection === "config" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações</CardTitle>
                    <CardDescription>Atualize seus dados cadastrais.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {configLoading ? (
                      <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
                        <p className="text-sm text-muted-foreground">Carregando dados...</p>
                      </div>
                    ) : (
                      <>
                        {configProfile?.personType === "CNPJ" ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">CNPJ</label>
                              <Input value={formatCnpj(configProfile?.cnpj ?? "")} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Data de criação</label>
                              <Input type="date" value={configBirthDate} onChange={(e) => setConfigBirthDate(e.target.value)} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Nome completo</label>
                                <Input value={configProfile?.name ?? ""} disabled />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">CPF</label>
                                <Input value={configProfile?.cpf ?? ""} disabled />
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Data de nascimento</label>
                                <Input
                                  type="date"
                                  value={configBirthDate}
                                  onChange={(e) => setConfigBirthDate(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">RG</label>
                                <Input value={configRg} onChange={(e) => setConfigRg(e.target.value)} placeholder="00.000.000-0" />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Telefone</label>
                            <Input value={configPhone} onChange={(e) => setConfigPhone(e.target.value)} placeholder="(00) 00000-0000" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <Input type="email" value={configEmail} onChange={(e) => setConfigEmail(e.target.value)} placeholder="seu@email.com" />
                          </div>
                        </div>

                        {configProfile?.personType === "CNPJ" && (
                          <>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Razão Social</label>
                                <Input value={configCompanyName} onChange={(e) => setConfigCompanyName(e.target.value)} />
                                <p className="text-xs text-muted-foreground">Deve ser igual ao cartão CNPJ.</p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Nome Fantasia (nome da conta)</label>
                                <Input value={configTradeName} onChange={(e) => setConfigTradeName(e.target.value)} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Cartão CNPJ</label>
                              <Input type="file" accept=".pdf,image/*" onChange={handleConfigCnpjCardChange} />
                              <p className="text-xs text-muted-foreground">
                                {configCnpjCardName
                                  ? `Arquivo: ${configCnpjCardName}`
                                  : configHasCnpjCard
                                    ? "Cartão CNPJ cadastrado. Envie um novo para atualizar."
                                    : "Envie o cartão CNPJ (PDF ou imagem)."}
                              </p>
                            </div>

                            <div className="border-t border-border pt-4 space-y-4">
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Responsável</label>
                                  <Input value={configContactName} onChange={(e) => setConfigContactName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Telefone do responsável</label>
                                  <Input value={configContactPhone} onChange={(e) => setConfigContactPhone(e.target.value)} />
                                </div>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">CPF do responsável</label>
                                  <Input value={configContactCpf} onChange={(e) => setConfigContactCpf(e.target.value)} placeholder="000.000.000-00" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">RG do responsável</label>
                                  <Input value={configContactRg} onChange={(e) => setConfigContactRg(e.target.value)} placeholder="00.000.000-0" />
                                </div>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">
                                    Data de nascimento do responsável
                                  </label>
                                  <Input
                                    type="date"
                                    value={configContactBirthDate}
                                    onChange={(e) => setConfigContactBirthDate(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Email do responsável</label>
                                  <Input
                                    type="email"
                                    value={configContactEmail}
                                    onChange={(e) => setConfigContactEmail(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {configProfile?.role === "PROFESSIONAL" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Serviços</label>
                            <Textarea
                              value={configServices}
                              onChange={(e) => setConfigServices(e.target.value)}
                              placeholder="Ex: Reforma, Arquitetura, Marcenaria"
                              className="min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground">Separe por vírgulas.</p>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Nova senha</label>
                            <Input
                              type="password"
                              placeholder="Mínimo 8 caracteres"
                              value={configPassword}
                              onChange={(e) => setConfigPassword(e.target.value)}
                            />
                            {configPassword.length > 0 && (
                              <div className="mt-2 space-y-1 text-xs">
                                <p className={passwordCriteria.minLength ? "text-emerald-600" : "text-destructive"}>
                                  {passwordCriteria.minLength ? "✓" : "✗"} Mínimo de 8 caracteres
                                </p>
                                <p className={passwordCriteria.hasLetter ? "text-emerald-600" : "text-destructive"}>
                                  {passwordCriteria.hasLetter ? "✓" : "✗"} Pelo menos 1 letra
                                </p>
                                <p className={passwordCriteria.hasNumber ? "text-emerald-600" : "text-destructive"}>
                                  {passwordCriteria.hasNumber ? "✓" : "✗"} Pelo menos 1 número
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                            <Input
                              type="password"
                              placeholder="Confirme a nova senha"
                              value={configPasswordConfirm}
                              onChange={(e) => setConfigPasswordConfirm(e.target.value)}
                            />
                            {(configPassword.length > 0 || configPasswordConfirm.length > 0) && (
                              <div className="mt-2 text-xs">
                                <p
                                  className={
                                    configPassword &&
                                    configPasswordConfirm &&
                                    configPassword === configPasswordConfirm
                                      ? "text-emerald-600"
                                      : "text-destructive"
                                  }
                                >
                                  {configPassword &&
                                  configPasswordConfirm &&
                                  configPassword === configPasswordConfirm
                                    ? "✓ Senhas iguais"
                                    : "✗ Senhas diferentes"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={handleSaveConfig} disabled={configSaving}>
                            {configSaving ? "Salvando..." : "Salvar alterações"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!configProfile) return;
                              setConfigBirthDate(configProfile.birthDate ? new Date(configProfile.birthDate).toISOString().slice(0, 10) : "");
                              setConfigRg(configProfile.rg ?? "");
                              setConfigPhone(configProfile.phone ?? "");
                              setConfigEmail(configProfile.email ?? "");
                              setConfigCompanyName(configProfile.companyName ?? "");
                              setConfigTradeName(configProfile.tradeName ?? "");
                              setConfigContactName(configProfile.contactName ?? "");
                              setConfigContactEmail(configProfile.contactEmail ?? "");
                              setConfigContactPhone(configProfile.contactPhone ?? "");
                              setConfigContactCpf(configProfile.contactCpf ?? "");
                              setConfigContactRg(configProfile.contactRg ?? "");
                              setConfigContactBirthDate(
                                configProfile.contactBirthDate
                                  ? new Date(configProfile.contactBirthDate).toISOString().slice(0, 10)
                                  : "",
                              );
                              setConfigServices((configProfile.services ?? []).join(", "));
                              setConfigPassword("");
                              setConfigPasswordConfirm("");
                              setConfigCnpjCard("");
                              setConfigCnpjCardName("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nome completo e CPF/CNPJ não podem ser alterados.
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
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


















