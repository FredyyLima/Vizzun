import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import MediaMessage from "@/components/chat/MediaMessage";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  ListChecks,
  MapPin,
  Megaphone,
  MessageSquare,
  Mic,
  Paperclip,
  Send,
  Settings,
  Square,
  X,
  User,
  Handshake,
} from "lucide-react";
import { type ElementType, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDisplayName, sanitizeDisplayName } from "@/lib/user";
import { apiPath } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnnouncements } from "@/hooks/use-dashboard-announcements";
import AnunciosSection from "@/components/dashboard/AnunciosSection";
import AnnouncementFormSection from "@/components/dashboard/AnnouncementFormSection";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Announcement,
  AnnouncementAttachment,
  ChatMessage,
  ChatSummary,
  ProfessionalProfile,
  SectionKey,
  StoredChat,
  StoredProfessionalChat,
  UserProfile,
} from "@/lib/dashboard-types";
import {
  brazilStates,
  buildChatMessages,
  buildChatSummaries,
  buildProfessionalChatMessages,
  buildProfessionalChatSummaries,
  formatCnpj,
  formatCurrency,
  formatDayLabel,
  formatRelativeTime,
  formatTime,
} from "@/lib/dashboard-formatters";
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
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatSource, setActiveChatSource] = useState<"project" | "professional">("project");
  const [draftMessage, setDraftMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showRejectDealModal, setShowRejectDealModal] = useState(false);
  const [rejectDealReason, setRejectDealReason] = useState("");
  const [rejectDealChatId, setRejectDealChatId] = useState<string | null>(null);
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
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { user: authUser, loading: authLoading, refresh: refreshAuth } = useAuth();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (activeSection !== "chats" && activeSection !== "contracts") {
      setActiveChatId(null);
    }
  }, [activeSection]);

  const { data: storedChats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await fetch(apiPath("/api/chats"), { credentials: "include" });
      if (!response.ok) return [] as StoredChat[];
      return (await response.json()) as StoredChat[];
    },
    enabled: Boolean(authUser?.id),
    refetchInterval: 4000,
  });

  const refetchChats = () => queryClient.invalidateQueries({ queryKey: ["chats"] });

  const chatReadMap = useMemo(() => {
    const map: Record<string, string> = {};
    storedChats.forEach((chat) => {
      const isOwnerOfChat = chat.ownerId === ownerId;
      const readAt = isOwnerOfChat ? chat.ownerLastReadAt : chat.participantLastReadAt;
      if (readAt) map[chat.id] = readAt;
    });
    return map;
  }, [storedChats, ownerId]);

  const { data: storedProfessionalChats = [] } = useQuery({
    queryKey: ["professional-chats"],
    queryFn: async () => {
      const response = await fetch(apiPath("/api/professional-chats"), { credentials: "include" });
      if (!response.ok) return [] as StoredProfessionalChat[];
      return (await response.json()) as StoredProfessionalChat[];
    },
    enabled: Boolean(authUser?.id),
    refetchInterval: 4000,
  });

  const refetchProfessionalChats = () => queryClient.invalidateQueries({ queryKey: ["professional-chats"] });

  const professionalReadMap = useMemo(() => {
    const map: Record<string, string> = {};
    storedProfessionalChats.forEach((chat) => {
      const isProfessionalOfChat = chat.professionalId === ownerId;
      const readAt = isProfessionalOfChat ? chat.professionalLastReadAt : chat.clientLastReadAt;
      if (readAt) map[chat.id] = readAt;
    });
    return map;
  }, [storedProfessionalChats, ownerId]);

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

  const projectChats = useMemo(() => buildChatSummaries(storedChats, ownerId), [storedChats, ownerId]);

  const professionalChats = useMemo(
    () => buildProfessionalChatSummaries(storedProfessionalChats, ownerId),
    [storedProfessionalChats, ownerId],
  );

  const allChats = useMemo(() => [...projectChats, ...professionalChats], [projectChats, professionalChats]);

  const chatMessages = useMemo(() => {
    const projectMessages = buildChatMessages(storedChats);
    const professionalMessages = buildProfessionalChatMessages(storedProfessionalChats);
    return { ...projectMessages, ...professionalMessages };
  }, [storedChats, storedProfessionalChats]);

  const unreadProjectCounts = useMemo(() => {
    return projectChats.reduce((acc, chat) => {
      const lastReadAt = chatReadMap[chat.id];
      const messages = chatMessages[chat.id] ?? [];
      const unread = messages.filter(
        (message) =>
          message.senderId &&
          message.senderId !== ownerId &&
          (!lastReadAt || new Date(message.createdAt).getTime() > new Date(lastReadAt).getTime()),
      ).length;
      acc[chat.id] = unread;
      return acc;
    }, {} as Record<string, number>);
  }, [projectChats, chatMessages, chatReadMap, ownerId]);

  const unreadProfessionalCounts = useMemo(() => {
    return professionalChats.reduce((acc, chat) => {
      const lastReadAt = professionalReadMap[chat.id];
      const messages = chatMessages[chat.id] ?? [];
      const unread = messages.filter(
        (message) =>
          message.senderId &&
          message.senderId !== ownerId &&
          (!lastReadAt || new Date(message.createdAt).getTime() > new Date(lastReadAt).getTime()),
      ).length;
      acc[chat.id] = unread;
      return acc;
    }, {} as Record<string, number>);
  }, [professionalChats, chatMessages, professionalReadMap, ownerId]);

  const totalUnreadProjects = useMemo(
    () => Object.values(unreadProjectCounts).reduce((sum, value) => sum + value, 0),
    [unreadProjectCounts],
  );

  const totalUnreadProfessionals = useMemo(
    () => Object.values(unreadProfessionalCounts).reduce((sum, value) => sum + value, 0),
    [unreadProfessionalCounts],
  );

  const sortedProjectChats = useMemo(() => {
    const chatsCopy = [...projectChats];
    return chatsCopy.sort((a, b) => {
      const aClosed = a.dealStatus === "closed";
      const bClosed = b.dealStatus === "closed";
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      if (a.active !== b.active) return a.active ? -1 : 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [projectChats]);

  const sortedProfessionalChats = useMemo(() => {
    const chatsCopy = [...professionalChats];
    return chatsCopy.sort((a, b) => {
      const aClosed = a.dealStatus === "closed";
      const bClosed = b.dealStatus === "closed";
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      if (a.active !== b.active) return a.active ? -1 : 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [professionalChats]);

  const activeChat = useMemo(
    () => allChats.find((chat) => chat.id === activeChatId) ?? null,
    [allChats, activeChatId],
  );
  useEffect(() => {
    if (activeChat) setActiveChatSource(activeChat.source);
  }, [activeChat]);

  const groupedMessages = useMemo(() => {
    if (!activeChatId) return [] as { label: string; messages: ChatMessage[] }[];
    const messages = [...(chatMessages[activeChatId] ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const groups: { label: string; messages: ChatMessage[] }[] = [];
    messages.forEach((message) => {
      const label = formatDayLabel(message.createdAt);
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.label !== label) {
        groups.push({ label, messages: [message] });
      } else {
        lastGroup.messages.push(message);
      }
    });
    return groups;
  }, [activeChatId, chatMessages]);

  useEffect(() => {
    if (!activeChatId) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChatId, groupedMessages]);

  useEffect(() => {
    if (!activeChatId) return;
    markChatAsRead(activeChatId, activeChatSource);
  }, [activeChatId, activeChatSource, groupedMessages]);

  const pendingDeals = useMemo(
    () =>
      storedChats.filter(
        (chat) =>
          chat.dealStatus === "pending" &&
          chat.pendingDealFrom &&
          chat.pendingDealFrom !== ownerId &&
          (chat.ownerId === ownerId || chat.participantId === ownerId),
      ),
    [storedChats, ownerId],
  );

  const contractDeals = useMemo(
    () =>
      storedChats.filter(
        (chat) =>
          chat.dealStatus === "closed" &&
          (chat.ownerId === ownerId || chat.participantId === ownerId),
      ),
    [storedChats, ownerId],
  );

  const appendMessagesToChat = async (chatId: string, newMessages: ChatMessage[]) => {
    if (!chatId) return;
    try {
      for (const message of newMessages) {
        await fetch(apiPath(`/api/chats/${chatId}/messages`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            text: message.text,
            kind: message.kind ?? "text",
            fileName: message.fileName,
            fileUrl: message.fileUrl,
            fileType: message.fileType,
          }),
        });
      }
      refetchChats();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Não foi possível enviar a mensagem.");
    }
  };

  const appendMessagesToProfessionalChat = async (chatId: string, newMessages: ChatMessage[]) => {
    if (!chatId) return;
    try {
      for (const message of newMessages) {
        await fetch(apiPath(`/api/professional-chats/${chatId}/messages`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            text: message.text,
            kind: message.kind ?? "text",
            fileName: message.fileName,
            fileUrl: message.fileUrl,
            fileType: message.fileType,
          }),
        });
      }
      refetchProfessionalChats();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Não foi possível enviar a mensagem.");
    }
  };

  const postChatAction = async (chatId: string, path: string, body: Record<string, unknown>) => {
    const response = await fetch(apiPath(`/api/chats/${chatId}/${path}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message ?? "Nao foi possivel completar a acao.");
    }
    refetchChats();
  };

  const postProfessionalChatAction = async (chatId: string, path: string, body: Record<string, unknown>) => {
    const response = await fetch(apiPath(`/api/professional-chats/${chatId}/${path}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message ?? "Nao foi possivel completar a acao.");
    }
    refetchProfessionalChats();
  };

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

  const handleAcceptDeal = async (chatId: string) => {
    try {
      await postChatAction(chatId, "deal", { action: "accept" });
      toast.success("Negócio fechado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível fechar o negócio.");
    }
  };

  const handleRequestProjectClose = async (chatId: string) => {
    try {
      await postChatAction(chatId, "close", { action: "request" });
      toast.success("Fechamento solicitado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível solicitar o fechamento.");
    }
  };

  const handleAcceptProjectClose = async (chatId: string) => {
    try {
      await postChatAction(chatId, "close", { action: "accept" });
      toast.success("Negócio finalizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível finalizar o negócio.");
    }
  };

  const handleRejectProjectClose = async (chatId: string) => {
    try {
      await postChatAction(chatId, "close", { action: "reject" });
      toast.success("Fechamento recusado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recusar o fechamento.");
    }
  };

  const handleOpenPendingChat = (chatId: string) => {
    setActiveSection("chats");
    setActiveChatId(chatId);
  };

  const handleOpenRejectModal = (chatId: string) => {
    setRejectDealChatId(chatId);
    setRejectDealReason("");
    setShowRejectDealModal(true);
  };

  const handleRejectDeal = async () => {
    if (!rejectDealChatId) return;
    const reasonText = rejectDealReason.trim();
    try {
      await postChatAction(rejectDealChatId, "deal", { action: "reject", reason: reasonText || undefined });
      toast.success("Negócio recusado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recusar o negócio.");
    } finally {
      setShowRejectDealModal(false);
      setRejectDealChatId(null);
      setRejectDealReason("");
    }
  };

  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
    const selected = allChats.find((item) => item.id === chatId);
    if (selected) {
      setActiveChatSource(selected.source);
    }
  };

  const markChatAsRead = (chatId: string, source: "project" | "professional") => {
    const path = source === "project" ? `/api/chats/${chatId}/read` : `/api/professional-chats/${chatId}/read`;
    const refetch = source === "project" ? refetchChats : refetchProfessionalChats;
    fetch(apiPath(path), { method: "POST", credentials: "include" })
      .then(refetch)
      .catch(() => {
        // marcar como lido nao e critico o suficiente para bloquear a UI em caso de falha
      });
  };

  const handleRequestProfessionalClose = async (chatId: string) => {
    try {
      await postProfessionalChatAction(chatId, "close", { action: "request" });
      toast.success("Fechamento solicitado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível solicitar o fechamento.");
    }
  };

  const handleAcceptProfessionalClose = async (chatId: string) => {
    try {
      await postProfessionalChatAction(chatId, "close", { action: "accept" });
      toast.success("Negócio finalizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível finalizar o negócio.");
    }
  };

  const handleRejectProfessionalClose = async (chatId: string) => {
    try {
      await postProfessionalChatAction(chatId, "close", { action: "reject" });
      toast.success("Fechamento recusado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recusar o fechamento.");
    }
  };

  const handleSendMessage = () => {
    if (!activeChatId || !draftMessage.trim()) return;
    const now = new Date().toISOString();
    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "me",
      senderId: ownerId,
      text: draftMessage.trim(),
      createdAt: now,
      kind: "text",
    };
    if (activeChatSource === "professional") {
      appendMessagesToProfessionalChat(activeChatId, [newMessage]);
    } else {
      appendMessagesToChat(activeChatId, [newMessage]);
    }
    setDraftMessage("");
  };

  const handleAttachClick = () => {
    if (!activeChatId) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeChatId) return;
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const resolveKind = (type: string) => {
      if (type.startsWith("image/")) return "image";
      if (type.startsWith("video/")) return "video";
      if (type.startsWith("audio/")) return "audio";
      return "file";
    };

    const append = activeChatSource === "professional" ? appendMessagesToProfessionalChat : appendMessagesToChat;

    for (const file of files) {
      try {
        const url = await uploadFile(file, file.name);
        await append(activeChatId, [
          {
            id: `f-${Date.now()}-${file.name}`,
            sender: "me",
            senderId: ownerId,
            text: file.name,
            createdAt: new Date().toISOString(),
            kind: resolveKind(file.type),
            fileName: file.name,
            fileUrl: url,
            fileType: file.type,
          },
        ]);
      } catch (error) {
        console.error("Erro ao enviar anexo:", error);
        toast.error("Não foi possível enviar o anexo.");
      }
    }
  };

  const startRecording = async () => {
    if (!activeChatId || isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("getUserMedia não suportado neste navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const append = activeChatSource === "professional" ? appendMessagesToProfessionalChat : appendMessagesToChat;
        try {
          const url = await uploadFile(blob, "audio.webm");
          await append(activeChatId, [
            {
              id: `a-${Date.now()}`,
              sender: "me",
              senderId: ownerId,
              createdAt: new Date().toISOString(),
              kind: "audio",
              fileName: "Áudio",
              fileUrl: url,
              fileType: "audio/webm",
            },
          ]);
        } catch (error) {
          console.error("Erro ao enviar audio:", error);
          toast.error("Não foi possível enviar o áudio.");
        }

        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao acessar o microfone:", error);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
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
                  const showBadge = item.key === "pending" && pendingDeals.length > 0;
                  const unreadCount =
                    item.key === "chats"
                      ? totalUnreadProjects
                      : item.key === "contracts"
                        ? totalUnreadProfessionals
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
                          {pendingDeals.length}
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
              )}

              {activeSection === "contracts" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Meus contratos</CardTitle>
                    <CardDescription>Conversas com profissionais e contratações realizadas na plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {activeChatId && activeChatSource === "professional" && activeChat ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setActiveChatId(null)}
                              className="h-8 w-8 rounded-full border border-border text-muted-foreground hover:bg-muted"
                              aria-label="Voltar para os contratos"
                            >
                              <ArrowLeft className="h-4 w-4 mx-auto" />
                            </button>
                            <div>
                              <p className="text-sm text-muted-foreground">Contrato profissional</p>
                              <h3 className="text-lg font-semibold text-foreground">{activeChat.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {activeChat.active
                                  ? "Online"
                                  : `Visto por ultimo ha ${formatRelativeTime(activeChat.lastSeenAt)}`}
                              </p>
                            </div>
                          </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={activeChat.dealStatus === "closed" ? "outline" : "secondary"}>
                                {activeChat.dealStatus === "closed" ? "Negócio fechado" : "Em aberto"}
                              </Badge>
                              <Badge variant={activeChat.dealStatus === "closed" ? "outline" : "secondary"}>
                                {activeChat.dealStatus === "closed" ? "Inativo" : "Ativo"}
                              </Badge>
                              {activeChat.closePendingFrom && (
                                <Badge variant="outline">Fechamento em andamento</Badge>
                              )}
                              {activeChat.dealStatus !== "closed" &&
                                (activeChat.closePendingFrom ? (
                                  activeChat.closePendingFrom === ownerId ? (
                                    <Button variant="outline" size="sm" disabled>
                                      Aguardando confirmação
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleAcceptProfessionalClose(activeChat.id)}
                                      >
                                        Aceitar fechamento
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRejectProfessionalClose(activeChat.id)}
                                      >
                                        Recusar
                                      </Button>
                                    </>
                                  )
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleRequestProfessionalClose(activeChat.id)}
                                  >
                                    Fechar negócio
                                  </Button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4">
                          {groupedMessages.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-12">
                              Nenhuma mensagem ainda. Inicie a conversa enviando sua proposta.
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {groupedMessages.map((group) => (
                                <div key={group.label} className="space-y-3">
                                  <div className="flex items-center justify-center">
                                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                      {group.label}
                                    </span>
                                  </div>
                                  {group.messages.map((message) => {
                                    const isMe = message.senderId ? message.senderId === ownerId : message.sender === "me";
                                    return (
                                      <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div
                                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                            isMe
                                              ? "bg-gradient-hero text-primary-foreground rounded-br-md"
                                              : "bg-card border border-border text-foreground rounded-bl-md"
                                          }`}
                                        >
                                          <MediaMessage message={message} isMe={isMe} />
                                          <p
                                            className={`text-xs mt-1 ${
                                              isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                            }`}
                                          >
                                            {formatTime(message.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                              <div ref={chatEndRef} />
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                              aria-label="Adicionar anexo"
                            >
                              <Paperclip className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            <button
                              type="button"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                              onClick={isRecording ? stopRecording : startRecording}
                              aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
                            >
                              {isRecording ? (
                                <Square className="h-5 w-5 text-destructive" />
                              ) : (
                                <Mic className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <Input
                              value={draftMessage}
                              onChange={(event) => setDraftMessage(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              placeholder="Digite sua mensagem..."
                              className="flex-1"
                            />
                            <Button variant="secondary" size="icon" onClick={handleSendMessage}>
                              <Send className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-foreground">Chats profissionais</h3>
                        </div>
                        {sortedProfessionalChats.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                            <p className="text-sm text-muted-foreground">
                              Você ainda não iniciou nenhum contrato profissional.
                            </p>
                          </div>
                        ) : (
                          sortedProfessionalChats.map((chat) => (
                            <div
                              key={chat.id}
                              className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-base font-semibold text-foreground">{chat.title}</h4>
                                  <p className="text-sm text-muted-foreground">{chat.name}</p>
                                </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={chat.dealStatus === "closed" ? "outline" : "secondary"}>
                                  {chat.dealStatus === "closed" ? "Negócio fechado" : "Em aberto"}
                                </Badge>
                                {unreadProfessionalCounts[chat.id] > 0 && (
                                  <Badge variant="destructive">Não lida</Badge>
                                )}
                                {chat.closePendingFrom && (
                                  <Badge variant="outline">Fechamento em andamento</Badge>
                                )}
                                <Badge variant={chat.dealStatus === "closed" ? "outline" : "secondary"}>
                                  {chat.dealStatus === "closed" ? "Inativo" : "Ativo"}
                                </Badge>
                              </div>
                              </div>
                              <p className="text-sm text-muted-foreground">Última mensagem: {chat.lastMessage}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(chat.lastMessageAt).toLocaleString("pt-BR")}</span>
                                <Button variant="outline" size="sm" onClick={() => handleOpenChat(chat.id)}>
                                  Abrir chat
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </CardContent>
                </Card>
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
                <Card>
                  {activeChat ? (
                    <>
                      <CardHeader className="border-b border-border">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => setActiveChatId(null)}
                              className="mt-1 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div>
                              <CardTitle className="text-lg">{activeChat.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {activeChat.active
                                  ? "Online"
                                  : `Visto por ultimo ha ${formatRelativeTime(activeChat.lastSeenAt)}`}
                              </p>
                            </div>
                          </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={activeChat.active ? "secondary" : "outline"}>
                                {activeChat.active ? "Ativo" : "Inativo"}
                              </Badge>
                              {activeChat.dealStatus === "pending" && (
                                <Badge variant="outline">Negócio pendente</Badge>
                              )}
                              {activeChat.closePendingFrom && (
                                <Badge variant="outline">Fechamento em andamento</Badge>
                              )}
                              {activeChat.dealStatus === "closed" && (
                                <Badge variant="secondary">Negócio fechado</Badge>
                              )}
                              {activeChat.dealStatus !== "closed" &&
                                (activeChat.closePendingFrom ? (
                                  activeChat.closePendingFrom === ownerId ? (
                                    <Button variant="outline" size="sm" disabled>
                                      Aguardando confirmação
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleAcceptProjectClose(activeChat.id)}
                                      >
                                        Aceitar fechamento
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRejectProjectClose(activeChat.id)}
                                      >
                                        Recusar
                                      </Button>
                                    </>
                                  )
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleRequestProjectClose(activeChat.id)}
                                  >
                                    Fechar negócio
                                  </Button>
                                ))}
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        <div className="max-h-[480px] overflow-y-auto space-y-6 pt-2">
                          {groupedMessages.map((group) => (
                            <div key={group.label} className="space-y-4">
                              <div className="flex justify-center">
                                <span className="rounded-full bg-muted px-4 py-1 text-xs text-muted-foreground">
                                  {group.label}
                                </span>
                              </div>
                              {group.messages.map((message) => {
                                const isMe = message.senderId ? message.senderId === ownerId : message.sender === "me";
                                return (
                                  <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div
                                      className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        isMe
                                          ? "bg-gradient-hero text-primary-foreground rounded-br-md"
                                          : "bg-card border border-border text-foreground rounded-bl-md"
                                      }`}
                                    >
                                      <MediaMessage message={message} isMe={isMe} />
                                      <p className={`mt-1 text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                        {formatTime(message.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        <div className="border-t border-border pt-4">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                                aria-label="Adicionar anexo"
                                onClick={handleAttachClick}
                              >
                                <Paperclip className="h-5 w-5" />
                              </button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                              />
                              <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                                aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
                                onClick={isRecording ? stopRecording : startRecording}
                              >
                                {isRecording ? (
                                  <Square className="h-5 w-5 text-destructive" />
                                ) : (
                                  <Mic className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                            <Input
                              value={draftMessage}
                              onChange={(event) => setDraftMessage(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              placeholder="Digite sua mensagem..."
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={handleSendMessage}
                              disabled={!draftMessage.trim()}
                            >
                              <Send className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <CardHeader>
                        <CardTitle>Chats</CardTitle>
                        <CardDescription>Conversas de anúncios aparecem primeiro.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sortedProjectChats.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                            <p className="text-sm text-muted-foreground">Você ainda não iniciou nenhum chat.</p>
                          </div>
                        ) : (
                          sortedProjectChats.map((chat) => (
                            <div
                              key={chat.id}
                              className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
                            >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <h3 className="text-base font-semibold text-foreground">{chat.title}</h3>
                                <p className="text-sm text-muted-foreground">{chat.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={chat.active ? "secondary" : "outline"}>
                                  {chat.active ? "Ativo" : "Inativo"}
                                </Badge>
                                {unreadProjectCounts[chat.id] > 0 && (
                                  <Badge variant="destructive">Não lida</Badge>
                                )}
                                {chat.dealStatus === "pending" && (
                                  <Badge variant="outline">Negócio pendente</Badge>
                                )}
                                {chat.closePendingFrom && (
                                  <Badge variant="outline">Fechamento em andamento</Badge>
                              )}
                              {chat.dealStatus === "closed" && (
                                <Badge variant="secondary">Negócio fechado</Badge>
                              )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">Última mensagem: {chat.lastMessage}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(chat.lastMessageAt).toLocaleString("pt-BR")}</span>
                                <Button variant="outline" size="sm" onClick={() => handleOpenChat(chat.id)}>
                                  Abrir chat
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </>
                  )}
                </Card>
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

      <Dialog open={showRejectDealModal} onOpenChange={setShowRejectDealModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar negócio</DialogTitle>
            <DialogDescription>
              Informe um motivo (opcional) para o outro usuário.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectDealReason}
            onChange={(event) => setRejectDealReason(event.target.value)}
            placeholder="Ex: Prazo não atende ou orçamento fora do esperado."
            className="min-h-[110px]"
          />
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRejectDealModal(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={handleRejectDeal}>
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardUsuario;


















