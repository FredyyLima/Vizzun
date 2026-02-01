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

type SectionKey = "chats" | "anunciar" | "anuncios" | "pending" | "contracts" | "profile" | "config";

type ChatSummary = {
  id: string;
  name: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSeenAt: string;
  active: boolean;
  dealStatus?: "pending" | "closed";
  closePendingFrom?: string | null;
  pendingDealFrom?: string | null;
  source: "project" | "professional";
};

type ChatMessage = {
  id: string;
  sender: "me" | "other";
  senderId?: string;
  text?: string;
  createdAt: string;
  kind?: "text" | "file" | "audio" | "image" | "video";
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
};

type StoredChat = {
  id: string;
  projectId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string | null;
  participantId: string;
  participantName: string;
  projectTitle: string;
  projectBudget?: string;
  pendingDealFrom?: string | null;
  dealStatus?: "pending" | "closed";
  closePendingFrom?: string | null;
  contractStatus?: "pending" | "accepted" | "rejected";
  createdAt?: string;
  messages: ChatMessage[];
};

type StoredProfessionalChat = {
  id: string;
  professionalId: string;
  professionalName: string;
  clientId: string;
  clientName: string;
  dealStatus?: "open" | "closed";
  closePendingFrom?: string | null;
  createdAt?: string;
  messages: ChatMessage[];
};

type AnnouncementAttachment = {
  id: string;
  name: string;
  type: string;
  url?: string;
  isPrimary?: boolean;
};

type Announcement = {
  id: string;
  ownerId: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  role: "Cliente" | "Profissional";
  title: string;
  category: string;
  description: string;
  city: string;
  state: string;
  budget: string;
  deadline: string;
  status: "Ativo" | "Pausado";
  dealStatus?: "pending" | "closed";
  createdAt: string;
  proposals: number;
  attachments?: AnnouncementAttachment[];
  primaryImageUrl?: string | null;
};

type ProfessionalProfile = {
  id: string;
  name: string;
  avatar?: string | null;
  specialty?: string | null;
  bio?: string | null;
  services?: string[];
  cities?: string[];
  location?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: { id: string; author: string; rating: number; comment: string }[];
  verified?: boolean;
};

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string;
  personType?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
};

type UserProfile = {
  id: string;
  role: string;
  personType: string;
  name?: string | null;
  birthDate?: string | null;
  cpf?: string | null;
  rg?: string | null;
  cnpj?: string | null;
  companyName?: string | null;
  tradeName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactCpf?: string | null;
  contactRg?: string | null;
  contactBirthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  services?: string[];
  hasCnpjCard?: boolean;
};

const navItems: { key: SectionKey; label: string; icon: ElementType }[] = [
  { key: "chats", label: "Chat", icon: MessageSquare },
  { key: "anunciar", label: "Anunciar", icon: Megaphone },
  { key: "anuncios", label: "Meus anúncios", icon: ListChecks },
  { key: "pending", label: "Negócios pendentes", icon: Handshake },
  { key: "contracts", label: "Meus contratos", icon: Briefcase },
  { key: "profile", label: "Perfil Profissional", icon: User },
  { key: "config", label: "Configurações", icon: Settings },
];

const brazilStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const announcementStorageKey = "site_announcements";
const chatStorageKey = "site_chats";
const profileStorageKey = "professional_profiles";
const professionalChatStorageKey = "professional_chats";
const chatReadStorageKey = "chat_reads";
const professionalChatReadStorageKey = "professional_chat_reads";

const loadStoredAnnouncements = () => {
  if (typeof window === "undefined") return [] as Announcement[];
  const raw = localStorage.getItem(announcementStorageKey);
  if (!raw) return [] as Announcement[];
  try {
    const parsed = JSON.parse(raw) as Announcement[];
    return parsed.map((item) => ({
      ...item,
      status: item.status ?? "Ativo",
    }));
  } catch {
    return [] as Announcement[];
  }
};

const loadStoredChats = () => {
  if (typeof window === "undefined") return [] as StoredChat[];
  const raw = localStorage.getItem(chatStorageKey);
  if (!raw) return [] as StoredChat[];
  try {
    return JSON.parse(raw) as StoredChat[];
  } catch {
    return [] as StoredChat[];
  }
};

const loadStoredProfiles = () => {
  if (typeof window === "undefined") return [] as ProfessionalProfile[];
  const raw = localStorage.getItem(profileStorageKey);
  if (!raw) return [] as ProfessionalProfile[];
  try {
    return JSON.parse(raw) as ProfessionalProfile[];
  } catch {
    return [] as ProfessionalProfile[];
  }
};

const loadStoredProfessionalChats = () => {
  if (typeof window === "undefined") return [] as StoredProfessionalChat[];
  const raw = localStorage.getItem(professionalChatStorageKey);
  if (!raw) return [] as StoredProfessionalChat[];
  try {
    return JSON.parse(raw) as StoredProfessionalChat[];
  } catch {
    return [] as StoredProfessionalChat[];
  }
};

const loadReadMap = (storageKey: string, userId: string) => {
  if (typeof window === "undefined") return {} as Record<string, string>;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    return parsed[userId] ?? {};
  } catch {
    return {} as Record<string, string>;
  }
};

const saveReadMap = (storageKey: string, userId: string, next: Record<string, string>, eventName: string) => {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(storageKey);
  let parsed: Record<string, Record<string, string>> = {};
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
  } catch {
    parsed = {};
  }
  parsed[userId] = next;
  localStorage.setItem(storageKey, JSON.stringify(parsed));
  window.dispatchEvent(new Event(eventName));
};

const buildChatPreview = (message?: ChatMessage) => {
  if (!message) return "Sem mensagens";
  if (message.text) return message.text;
  if (message.fileName) return `Anexo: ${message.fileName}`;
  if (message.kind === "audio") return "Áudio";
  return "Mensagem";
};


const buildChatSummaries = (storedChats: StoredChat[], viewerId: string) =>
  storedChats
    .filter((chat) => chat.ownerId === viewerId || chat.participantId === viewerId)
    .map((chat) => {
      const lastMessage = chat.messages?.[chat.messages.length - 1];
      const lastTimestamp = lastMessage?.createdAt ?? chat.createdAt ?? new Date().toISOString();
      const isOwner = chat.ownerId === viewerId;
      const displayName = sanitizeDisplayName(
        isOwner ? chat.participantName : chat.ownerName,
        isOwner ? "Usuario" : "Cliente",
      );
      const lastSeenAt = lastMessage?.createdAt ?? lastTimestamp;
      const isActive =
        chat.dealStatus !== "closed" && Date.now() - new Date(lastSeenAt).getTime() < 24 * 60 * 60 * 1000;
      return {
        id: chat.id,
        name: displayName,
        title: chat.projectTitle ?? "Projeto",
        lastMessage: buildChatPreview(lastMessage),
        lastMessageAt: lastTimestamp,
        lastSeenAt,
        active: isActive,
        dealStatus: chat.dealStatus ?? undefined,
        closePendingFrom: chat.closePendingFrom ?? null,
        pendingDealFrom: chat.pendingDealFrom ?? null,
        source: "project",
      } as ChatSummary;
    });

const buildChatMessages = (storedChats: StoredChat[]) =>
  storedChats.reduce((acc, chat) => {
    const normalized = (chat.messages ?? []).map((message) => ({
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    }));
    acc[chat.id] = normalized;
    return acc;
  }, {} as Record<string, ChatMessage[]>);

const buildProfessionalChatSummaries = (storedChats: StoredProfessionalChat[], viewerId: string) =>
  storedChats
    .filter((chat) => chat.professionalId === viewerId || chat.clientId === viewerId)
    .map((chat) => {
      const lastMessage = chat.messages?.[chat.messages.length - 1];
      const lastTimestamp = lastMessage?.createdAt ?? chat.createdAt ?? new Date().toISOString();
      const isProfessional = chat.professionalId === viewerId;
      const status = chat.dealStatus ?? "open";
      const displayName = sanitizeDisplayName(
        isProfessional ? chat.clientName : chat.professionalName,
        isProfessional ? "Usuario" : "Profissional",
      );
      const lastSeenAt = lastMessage?.createdAt ?? lastTimestamp;
      const isActive =
        status !== "closed" && Date.now() - new Date(lastSeenAt).getTime() < 24 * 60 * 60 * 1000;
      return {
        id: chat.id,
        name: displayName,
        title: "Contrato profissional",
        lastMessage: buildChatPreview(lastMessage),
        lastMessageAt: lastTimestamp,
        lastSeenAt,
        active: isActive,
        dealStatus: status === "closed" ? "closed" : undefined,
        closePendingFrom: chat.closePendingFrom ?? null,
        source: "professional",
      } as ChatSummary;
    });

const buildProfessionalChatMessages = (storedChats: StoredProfessionalChat[]) =>
  storedChats.reduce((acc, chat) => {
    const normalized = (chat.messages ?? []).map((message) => ({
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    }));
    acc[chat.id] = normalized;
    return acc;
  }, {} as Record<string, ChatMessage[]>);

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const formatDayLabel = (value: string) => new Date(value).toLocaleDateString("pt-BR");

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} dia${diffDays > 1 ? "s" : ""}`;
};

const formatCurrency = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
};

const formatCnpj = (value?: string | null) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];
  if (digits.length <= 2) return parts[0];
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
};

const DashboardUsuario = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>("anuncios");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatSource, setActiveChatSource] = useState<"project" | "professional">("project");
  const [draftMessage, setDraftMessage] = useState("");
  const [storedChats, setStoredChats] = useState<StoredChat[]>(() => loadStoredChats());
  const [storedProfessionalChats, setStoredProfessionalChats] = useState<StoredProfessionalChat[]>(() =>
    loadStoredProfessionalChats(),
  );
  const [chatReadMap, setChatReadMap] = useState<Record<string, string>>({});
  const [professionalReadMap, setProfessionalReadMap] = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadStoredAnnouncements());
  const [titleValue, setTitleValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [budgetValue, setBudgetValue] = useState("");
  const [deadlineValue, setDeadlineValue] = useState("");
  const [cityValue, setCityValue] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [announcementAttachments, setAnnouncementAttachments] = useState<AnnouncementAttachment[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missingOptional, setMissingOptional] = useState<string[]>([]);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [originalAnnouncement, setOriginalAnnouncement] = useState<Announcement | null>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [draggedAttachmentId, setDraggedAttachmentId] = useState<string | null>(null);
  const [dragOverAttachmentId, setDragOverAttachmentId] = useState<string | null>(null);
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
  const announcementFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section") as SectionKey | null;
    if (section && ["anunciar", "anuncios", "chats", "config", "pending", "profile", "contracts"].includes(section)) {
      setActiveSection(section);
    }
  }, [location.search]);

  const ownerId = authUser?.id ?? authUser?.email ?? "guest";
  const ownerDisplayName = useMemo(() => getDisplayName(authUser, "Cliente"), [authUser]);
  const isViewingAnnouncement = selectedAnnouncementId !== null;
  const isFormDisabled = isViewingAnnouncement && !isEditingAnnouncement;
  const normalizedBudget = budgetValue.trim() ? budgetValue.trim() : "A Combinar";
  const normalizedDeadline = deadlineValue.trim() ? deadlineValue.trim() : "A Combinar";
  const getPrimaryImageUrl = (fallback?: string | null) => {
    const primary =
      announcementAttachments.find((item) => item.isPrimary && item.type.startsWith("image/")) ??
      announcementAttachments.find((item) => item.type.startsWith("image/"));
    return primary?.url ?? fallback ?? null;
  };

  const normalizeAttachments = (items: AnnouncementAttachment[], primaryId?: string | null) => {
    const next = items.map((item) => ({ ...item }));
    if (primaryId) {
      return next.map((item) => ({
        ...item,
        isPrimary: item.id === primaryId,
      }));
    }
    const existingPrimary = next.find((item) => item.isPrimary && item.type.startsWith("image/"));
    if (existingPrimary) {
      return next.map((item) => ({
        ...item,
        isPrimary: item.id === existingPrimary.id,
      }));
    }
    const firstImageIndex = next.findIndex((item) => item.type.startsWith("image/"));
    if (firstImageIndex >= 0) {
      return next.map((item, index) => ({
        ...item,
        isPrimary: index === firstImageIndex,
      }));
    }
    return next.map((item) => ({ ...item, isPrimary: false }));
  };

  const moveAttachment = (items: AnnouncementAttachment[], fromId: string, toId: string) => {
    const fromIndex = items.findIndex((item) => item.id === fromId);
    const toIndex = items.findIndex((item) => item.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  useEffect(() => {
    if (activeSection !== "chats" && activeSection !== "contracts") {
      setActiveChatId(null);
    }
  }, [activeSection]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reload = () => {
      setChatReadMap(loadReadMap(chatReadStorageKey, ownerId));
      setProfessionalReadMap(loadReadMap(professionalChatReadStorageKey, ownerId));
    };
    reload();
    window.addEventListener("storage", reload);
    window.addEventListener("chat-reads:changed", reload as EventListener);
    window.addEventListener("professional-reads:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("chat-reads:changed", reload as EventListener);
      window.removeEventListener("professional-reads:changed", reload as EventListener);
    };
  }, [ownerId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reload = () => {
      setStoredChats(loadStoredChats());
    };
    window.addEventListener("storage", reload);
    window.addEventListener("chats:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("chats:changed", reload as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reload = () => {
      setStoredProfessionalChats(loadStoredProfessionalChats());
    };
    window.addEventListener("storage", reload);
    window.addEventListener("professional-chats:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("professional-chats:changed", reload as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reload = () => {
      setAnnouncements(loadStoredAnnouncements());
    };
    window.addEventListener("storage", reload);
    window.addEventListener("announcements:changed", reload as EventListener);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("announcements:changed", reload as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const profiles = loadStoredProfiles();
    const profile = profiles.find((item) => item.id === ownerId);
    if (!profile) return;
    setProfileAvatar(profile.avatar ?? "");
    setProfileSpecialty(profile.specialty ?? "");
    setProfileBio(profile.bio ?? "");
    setProfileServices((profile.services ?? []).join(", "));
    setProfileCities((profile.cities ?? []).join(", "));
  }, [ownerId]);

  useEffect(() => {
    if (!authUser?.id) return;
    const loadProfile = async () => {
      setConfigLoading(true);
      try {
        const response = await fetch(`/api/user/${authUser.id}`);
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

  const userAnnouncements = useMemo(
    () => announcements.filter((item) => item.ownerId === ownerId),
    [announcements, ownerId],
  );

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

  const hasAnnouncementChanges = useMemo(() => {
    if (!originalAnnouncement) return false;
    const originalAttachments = originalAnnouncement.attachments ?? [];
    const attachmentsChanged =
      JSON.stringify(originalAttachments) !== JSON.stringify(announcementAttachments);
    return (
      titleValue.trim() !== (originalAnnouncement.title ?? "") ||
      categoryValue.trim() !== (originalAnnouncement.category ?? "") ||
      descriptionValue.trim() !== (originalAnnouncement.description ?? "") ||
      cityValue.trim() !== (originalAnnouncement.city ?? "") ||
      stateValue.trim() !== (originalAnnouncement.state ?? "") ||
      normalizedBudget !== (originalAnnouncement.budget ?? "A Combinar") ||
      normalizedDeadline !== (originalAnnouncement.deadline ?? "A Combinar") ||
      attachmentsChanged
    );
  }, [
    originalAnnouncement,
    titleValue,
    categoryValue,
    descriptionValue,
    cityValue,
    stateValue,
    normalizedBudget,
    normalizedDeadline,
    announcementAttachments,
  ]);

  const clearError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const appendMessagesToChat = (chatId: string, newMessages: ChatMessage[]) => {
    if (!chatId) return;
    setStoredChats((prev) => {
      const next = prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: [...(chat.messages ?? []), ...newMessages],
        };
      });
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(next));
        window.dispatchEvent(new Event("chats:changed"));
      } catch (error) {
        console.error("Erro ao salvar chats no armazenamento local:", error);
        toast.error("Não foi possível salvar o chat no armazenamento local.");
      }
      return next;
    });
  };

  const appendMessagesToProfessionalChat = (chatId: string, newMessages: ChatMessage[]) => {
    if (!chatId) return;
    setStoredProfessionalChats((prev) => {
      const next = prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: [...(chat.messages ?? []), ...newMessages],
        };
      });
      try {
        localStorage.setItem(professionalChatStorageKey, JSON.stringify(next));
        window.dispatchEvent(new Event("professional-chats:changed"));
      } catch (error) {
        console.error("Erro ao salvar chats profissionais:", error);
        toast.error("Não foi possível salvar o chat.");
      }
      return next;
    });
  };

  const updateStoredChats = (nextChats: StoredChat[]) => {
    setStoredChats(nextChats);
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify(nextChats));
      window.dispatchEvent(new Event("chats:changed"));
    } catch (error) {
      console.error("Erro ao salvar chats no armazenamento local:", error);
      toast.error("Não foi possível salvar os chats.");
    }
  };

  const updateAnnouncementDealStatus = (announcementId: string, status: "pending" | "closed") => {
    const nextAnnouncements = announcements.map((item) =>
      item.id === announcementId ? { ...item, dealStatus: status } : item,
    );
    persistAnnouncements(nextAnnouncements);
  };

  const handleSaveProfessionalProfile = () => {
    if (!ownerId) return;
    const profiles = loadStoredProfiles();
    const services = profileServices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const cities = profileCities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const nextProfile: ProfessionalProfile = {
      id: ownerId,
      name: ownerDisplayName,
      avatar: profileAvatar.trim() || null,
      specialty: profileSpecialty.trim() || null,
      bio: profileBio.trim() || null,
      services,
      cities,
      location: cities[0] ?? "",
      rating: 0,
      reviewCount: 0,
      reviews: [],
      verified: true,
    };

    const nextProfiles = profiles.some((item) => item.id === ownerId)
      ? profiles.map((item) => (item.id === ownerId ? nextProfile : item))
      : [nextProfile, ...profiles];

    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(nextProfiles));
      window.dispatchEvent(new Event("profiles:changed"));
      toast.success("Perfil profissional atualizado.");
    } catch (error) {
      console.error("Erro ao salvar perfil profissional:", error);
      toast.error("Não foi possível salvar o perfil profissional.");
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
      const response = await fetch(`/api/user/${authUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const storedAuth = localStorage.getItem("auth_user");
      if (storedAuth) {
        const nextAuth = {
          ...JSON.parse(storedAuth),
          email: result.email,
          tradeName: result.tradeName,
          companyName: result.companyName,
        };
        localStorage.setItem("auth_user", JSON.stringify(nextAuth));
        window.dispatchEvent(new Event("auth:changed"));
      }
      toast.success("Dados atualizados com sucesso.");
    } catch (error) {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleAcceptDeal = (chatId: string) => {
    const now = new Date().toISOString();
    const nextChats = storedChats.flatMap((chat) => {
      if (chat.id !== chatId) return [chat];
      const closedChat = {
        ...chat,
        dealStatus: "closed",
        pendingDealFrom: null,
        closePendingFrom: null,
        messages: [
          ...(chat.messages ?? []),
          {
            id: `system-${Date.now()}`,
            sender: "me",
            senderId: ownerId,
            text: "Negócio aceito. O acordo foi fechado.",
            createdAt: now,
            kind: "text",
          } as ChatMessage,
        ],
      };
      const newChat: StoredChat = {
        ...chat,
        id: `chat-${chat.projectId}-${chat.participantId}-${Date.now()}`,
        dealStatus: null,
        pendingDealFrom: null,
        closePendingFrom: null,
        contractStatus: null,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      return [closedChat, newChat];
    });
    updateStoredChats(nextChats);
    const chat = storedChats.find((item) => item.id === chatId);
    if (chat?.projectId) {
      updateAnnouncementDealStatus(chat.projectId, "closed");
    }
    toast.success("Negócio fechado com sucesso!");
  };

  const handleRequestProjectClose = (chatId: string) => {
    const now = new Date().toISOString();
    const nextChats = storedChats.map((chat) => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        closePendingFrom: ownerId,
        messages: [
          ...(chat.messages ?? []),
          {
            id: `system-${Date.now()}`,
            sender: "me",
            senderId: ownerId,
            text: "Solicitação de fechamento enviada. Aguardando confirmação da outra parte.",
            createdAt: now,
            kind: "text",
          } as ChatMessage,
        ],
      };
    });
    updateStoredChats(nextChats);
    toast.success("Fechamento solicitado.");
  };

  const handleAcceptProjectClose = (chatId: string) => {
    const now = new Date().toISOString();
    const nextChats = storedChats.flatMap((chat) => {
      if (chat.id !== chatId) return [chat];
      const closedChat = {
        ...chat,
        dealStatus: "closed",
        closePendingFrom: null,
        pendingDealFrom: null,
        messages: [
          ...(chat.messages ?? []),
          {
            id: `system-${Date.now()}`,
            sender: "me",
            senderId: ownerId,
            text: "Negócio fechado.",
            createdAt: now,
            kind: "text",
          } as ChatMessage,
        ],
      };
      const newChat: StoredChat = {
        ...chat,
        id: `chat-${chat.projectId}-${chat.participantId}-${Date.now()}`,
        dealStatus: null,
        pendingDealFrom: null,
        closePendingFrom: null,
        contractStatus: null,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      return [closedChat, newChat];
    });
    updateStoredChats(nextChats);
    const chat = storedChats.find((item) => item.id === chatId);
    if (chat?.projectId) {
      updateAnnouncementDealStatus(chat.projectId, "closed");
    }
    toast.success("Negócio finalizado com sucesso!");
  };

  const handleRejectProjectClose = (chatId: string) => {
    const now = new Date().toISOString();
    const nextChats = storedChats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            closePendingFrom: null,
            messages: [
              ...(chat.messages ?? []),
              {
                id: `system-${Date.now()}`,
                sender: "me",
                senderId: ownerId,
                text: "Fechamento recusado.",
                createdAt: now,
                kind: "text",
              } as ChatMessage,
            ],
          }
        : chat,
    );
    updateStoredChats(nextChats);
    toast.success("Fechamento recusado.");
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

  const handleRejectDeal = () => {
    if (!rejectDealChatId) return;
    const reasonText = rejectDealReason.trim();
    const nextChats = storedChats.map((chat) => {
      if (chat.id !== rejectDealChatId) return chat;
      const now = new Date().toISOString();
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        sender: "other",
        senderId: "system",
        text: reasonText ? `Negócio recusado: ${reasonText}` : "Negócio recusado.",
        createdAt: now,
        kind: "text",
      };
      return {
        ...chat,
        dealStatus: null,
        pendingDealFrom: null,
        messages: [...(chat.messages ?? []), systemMessage],
      };
    });
    updateStoredChats(nextChats);
    const chat = storedChats.find((item) => item.id === rejectDealChatId);
    if (chat?.projectId) {
      const nextAnnouncements = announcements.map((item) =>
        item.id === chat.projectId ? { ...item, dealStatus: undefined } : item,
      );
      persistAnnouncements(nextAnnouncements);
    }
    setShowRejectDealModal(false);
    setRejectDealChatId(null);
    setRejectDealReason("");
    toast.success("Negócio recusado.");
  };

  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
    const selected = allChats.find((item) => item.id === chatId);
    if (selected) {
      setActiveChatSource(selected.source);
    }
  };

  const markChatAsRead = (chatId: string, source: "project" | "professional") => {
    const now = new Date().toISOString();
    if (source === "project") {
      const next = { ...chatReadMap, [chatId]: now };
      setChatReadMap(next);
      saveReadMap(chatReadStorageKey, ownerId, next, "chat-reads:changed");
      return;
    }
    const next = { ...professionalReadMap, [chatId]: now };
    setProfessionalReadMap(next);
    saveReadMap(professionalChatReadStorageKey, ownerId, next, "professional-reads:changed");
  };

  const handleRequestProfessionalClose = (chatId: string) => {
    setStoredProfessionalChats((prev) => {
      const next = prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        const systemMessage: ChatMessage = {
          id: `${Date.now()}-deal`,
          sender: "me",
          senderId: ownerId,
          text: "Solicitação de fechamento enviada. Aguardando confirmação da outra parte.",
          createdAt: new Date().toISOString(),
          kind: "text",
        };
        return {
          ...chat,
          closePendingFrom: ownerId,
          messages: [...(chat.messages ?? []), systemMessage],
        };
      });
      try {
        localStorage.setItem(professionalChatStorageKey, JSON.stringify(next));
        window.dispatchEvent(new Event("professional-chats:changed"));
      } catch (error) {
        console.error("Erro ao salvar chats profissionais:", error);
        toast.error("Não foi possível solicitar o fechamento.");
      }
      return next;
    });
    toast.success("Fechamento solicitado.");
  };

  const handleAcceptProfessionalClose = (chatId: string) => {
    setStoredProfessionalChats((prev) => {
      const next = prev.flatMap((chat) => {
        if (chat.id !== chatId) return [chat];
        const systemMessage: ChatMessage = {
          id: `${Date.now()}-deal`,
          sender: "me",
          senderId: ownerId,
          text: "Negócio fechado.",
          createdAt: new Date().toISOString(),
          kind: "text",
        };
        const closedChat = {
          ...chat,
          closePendingFrom: null,
          dealStatus: "closed",
          messages: [...(chat.messages ?? []), systemMessage],
        };
        const newChat: StoredProfessionalChat = {
          ...chat,
          id: `pro-${chat.professionalId}-${chat.clientId}-${Date.now()}`,
          closePendingFrom: null,
          dealStatus: "open",
          createdAt: new Date().toISOString(),
          messages: [],
        };
        return [closedChat, newChat];
      });
      try {
        localStorage.setItem(professionalChatStorageKey, JSON.stringify(next));
        window.dispatchEvent(new Event("professional-chats:changed"));
      } catch (error) {
        console.error("Erro ao salvar chats profissionais:", error);
        toast.error("Não foi possível finalizar o negócio.");
      }
      return next;
    });
    toast.success("Negócio finalizado com sucesso!");
  };

  const handleRejectProfessionalClose = (chatId: string) => {
    setStoredProfessionalChats((prev) => {
      const next = prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        const systemMessage: ChatMessage = {
          id: `${Date.now()}-deal`,
          sender: "me",
          senderId: ownerId,
          text: "Fechamento recusado.",
          createdAt: new Date().toISOString(),
          kind: "text",
        };
        return {
          ...chat,
          closePendingFrom: null,
          messages: [...(chat.messages ?? []), systemMessage],
        };
      });
      try {
        localStorage.setItem(professionalChatStorageKey, JSON.stringify(next));
        window.dispatchEvent(new Event("professional-chats:changed"));
      } catch (error) {
        console.error("Erro ao salvar chats profissionais:", error);
        toast.error("Não foi possível recusar o fechamento.");
      }
      return next;
    });
    toast.success("Fechamento recusado.");
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeChatId) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const now = new Date().toISOString();
    const resolveKind = (type: string) => {
      if (type.startsWith("image/")) return "image";
      if (type.startsWith("video/")) return "video";
      if (type.startsWith("audio/")) return "audio";
      return "file";
    };

    const messages = files.map((file) => ({
      id: `f-${Date.now()}-${file.name}`,
      sender: "me" as const,
      senderId: ownerId,
      text: file.name,
      createdAt: now,
      kind: resolveKind(file.type),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
    }));
    if (activeChatSource === "professional") {
      appendMessagesToProfessionalChat(activeChatId, messages);
    } else {
      appendMessagesToChat(activeChatId, messages);
    }

    event.target.value = "";
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

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const now = new Date().toISOString();
        const audioMessage: ChatMessage = {
          id: `a-${Date.now()}`,
          sender: "me",
          senderId: ownerId,
          createdAt: now,
          kind: "audio",
          fileName: "Áudio",
          fileUrl: url,
        };
        if (activeChatSource === "professional") {
          appendMessagesToProfessionalChat(activeChatId, [audioMessage]);
        } else {
          appendMessagesToChat(activeChatId, [audioMessage]);
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

  const validateAnnouncement = () => {
    const errors: Record<string, string> = {};
    if (!titleValue.trim()) errors.title = "Título é obrigatório.";
    if (!categoryValue.trim()) errors.category = "Categoria é obrigatória.";
    if (!descriptionValue.trim()) errors.description = "Descrição é obrigatória.";
    if (!cityValue.trim()) errors.city = "Cidade é obrigatória.";
    if (!stateValue.trim()) errors.state = "Estado é obrigatório.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetAnnouncementForm = () => {
    setTitleValue("");
    setCategoryValue("");
    setDescriptionValue("");
    setBudgetValue("");
    setDeadlineValue("");
    setCityValue("");
    setStateValue("");
    setAnnouncementAttachments([]);
    setFormErrors({});
    setSelectedAnnouncementId(null);
    setOriginalAnnouncement(null);
    setIsEditingAnnouncement(false);
  };

  const persistAnnouncements = (nextAnnouncements: Announcement[]) => {
    setAnnouncements(nextAnnouncements);
    let saved = false;
    try {
      localStorage.setItem(announcementStorageKey, JSON.stringify(nextAnnouncements));
      saved = true;
    } catch (error) {
      console.error("Erro ao salvar anuncios no armazenamento local:", error);
      try {
        const slimAnnouncements = nextAnnouncements.map((item) => ({
          ...item,
          attachments: item.attachments?.map((att) => ({
            id: att.id,
            name: att.name,
            type: att.type,
            isPrimary: att.isPrimary,
          })),
          primaryImageUrl: item.primaryImageUrl ?? null,
        }));
        localStorage.setItem(announcementStorageKey, JSON.stringify(slimAnnouncements));
        saved = true;
        toast("Anúncio publicado, mas alguns anexos não puderam ser salvos.");
      } catch (innerError) {
        console.error("Erro ao salvar anuncios reduzidos:", innerError);
        toast.error("Não foi possível salvar o anúncio no armazenamento local.");
      }
    }
    if (saved) {
      window.dispatchEvent(new Event("announcements:changed"));
    }
  };

  const publishAnnouncement = () => {
    const now = new Date().toISOString();
    const budget = budgetValue.trim() ? budgetValue.trim() : "A Combinar";
    const deadline = deadlineValue.trim() ? deadlineValue.trim() : "A Combinar";
    const roleLabel = authUser?.role === "PROFESSIONAL" ? "Profissional" : "Cliente";
    const ownerDisplayName = getDisplayName(authUser, "Cliente");

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      ownerId,
      ownerName: ownerDisplayName,
      ownerEmail: authUser?.email ?? null,
      role: roleLabel,
      title: titleValue.trim(),
      category: categoryValue.trim(),
      description: descriptionValue.trim(),
      city: cityValue.trim(),
      state: stateValue.trim(),
      budget,
      deadline,
      status: "Ativo",
      createdAt: now,
      proposals: 0,
      attachments: announcementAttachments,
      primaryImageUrl: getPrimaryImageUrl(null),
    };

    const nextAnnouncements = [newAnnouncement, ...announcements];
    persistAnnouncements(nextAnnouncements);

    setTitleValue("");
    setCategoryValue("");
    setDescriptionValue("");
    setBudgetValue("");
    setDeadlineValue("");
    setCityValue("");
    setStateValue("");
    setAnnouncementAttachments([]);
    setFormErrors({});

    toast.success("Anúncio publicado com sucesso!");
    setActiveSection("anuncios");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewAnnouncement = (id: string) => {
    const announcement = announcements.find((item) => item.id === id);
    if (!announcement) return;
    setSelectedAnnouncementId(id);
    setOriginalAnnouncement(announcement);
    setTitleValue(announcement.title ?? "");
    setCategoryValue(announcement.category ?? "");
    setDescriptionValue(announcement.description ?? "");
    setBudgetValue(announcement.budget ?? "");
    setDeadlineValue(announcement.deadline ?? "");
    setCityValue(announcement.city ?? "");
    setStateValue(announcement.state ?? "");

    let loadedAttachments = announcement.attachments ?? [];
    if (loadedAttachments.length === 0 && announcement.primaryImageUrl) {
      loadedAttachments = [
        {
          id: `primary-${announcement.id}`,
          name: "Imagem principal",
          type: "image/*",
          url: announcement.primaryImageUrl,
          isPrimary: true,
        },
      ];
    }

    const normalized = normalizeAttachments(loadedAttachments);
    setAnnouncementAttachments(normalized);
    setFormErrors({});
    setIsEditingAnnouncement(false);
    setActiveSection("anunciar");
  };

  const handlePublish = () => {
    if (selectedAnnouncementId) return;
    if (!validateAnnouncement()) return;

    const missing: string[] = [];
    if (!budgetValue.trim()) missing.push("Orçamento");
    if (!deadlineValue.trim()) missing.push("Prazo");

    if (missing.length) {
      setMissingOptional(missing);
      setShowConfirmModal(true);
      return;
    }

    publishAnnouncement();
  };

  const handleConfirmPublish = () => {
    setShowConfirmModal(false);
    publishAnnouncement();
  };

  const resizeImage = (file: File, maxSize = 900, quality = 0.8) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      const image = new Image();

      reader.onload = () => {
        image.onload = () => {
          const maxDimension = Math.max(image.width, image.height);
          const scale = maxDimension > maxSize ? maxSize / maxDimension : 1;
          const width = Math.round(image.width * scale);
          const height = Math.round(image.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Canvas não disponível."));
            return;
          }
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        image.onerror = () => reject(new Error("Não foi possível processar a imagem."));
        image.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("Erro ao ler a imagem."));
      reader.readAsDataURL(file);
    });

  const handleAnnouncementFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      const attachments = await Promise.all(
        files.map(async (file) => {
          const isImage = file.type.startsWith("image/");
          const url = isImage ? await resizeImage(file) : URL.createObjectURL(file);
          return {
            id: `att-${Date.now()}-${file.name}`,
            name: file.name,
            type: isImage ? "image/jpeg" : file.type,
            url,
            isPrimary: false,
          } as AnnouncementAttachment;
        }),
      );

      setAnnouncementAttachments((prev) => normalizeAttachments([...prev, ...attachments]));
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
      toast.error("Não foi possível carregar os anexos.");
    } finally {
      event.target.value = "";
    }
  };

  const handleProfileAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const avatar = await resizeImage(file, 500, 0.85);
      setProfileAvatar(avatar);
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
      toast.error("Não foi possível carregar a foto.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSelectPrimaryAttachment = (id: string) => {
    if (isFormDisabled) return;
    setAnnouncementAttachments((prev) => {
      const selectedIndex = prev.findIndex((item) => item.id === id);
      if (selectedIndex < 0) return prev;
      if (!prev[selectedIndex].type.startsWith("image/")) return prev;
      const next = [...prev];
      const [selected] = next.splice(selectedIndex, 1);
      next.unshift(selected);
      return normalizeAttachments(next, selected.id);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    if (isFormDisabled) return;
    setAnnouncementAttachments((prev) => normalizeAttachments(prev.filter((item) => item.id !== id)));
  };

  const handleDragStartAttachment = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isFormDisabled) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedAttachmentId(id);
  };

  const handleDragOverAttachment = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isFormDisabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverAttachmentId !== id) setDragOverAttachmentId(id);
  };

  const handleDropAttachment = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isFormDisabled) return;
    event.preventDefault();
    const draggedId = draggedAttachmentId || event.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === id) {
      setDragOverAttachmentId(null);
      return;
    }
    setAnnouncementAttachments((prev) => {
      const next = moveAttachment(prev, draggedId, id);
      const droppedIndex = next.findIndex((item) => item.id === draggedId);
      const droppedItem = next[droppedIndex];
      if (droppedIndex === 0 && droppedItem?.type.startsWith("image/")) {
        return normalizeAttachments(next, droppedItem.id);
      }
      return normalizeAttachments(next);
    });
    setDraggedAttachmentId(null);
    setDragOverAttachmentId(null);
  };

  const handleDragEndAttachment = () => {
    setDraggedAttachmentId(null);
    setDragOverAttachmentId(null);
  };

  const handleSaveAnnouncement = () => {
    if (!selectedAnnouncementId || !originalAnnouncement) return;
    if (!validateAnnouncement()) return;

    const updatedAnnouncement: Announcement = {
      ...originalAnnouncement,
      title: titleValue.trim(),
      category: categoryValue.trim(),
      description: descriptionValue.trim(),
      city: cityValue.trim(),
      state: stateValue.trim(),
      budget: normalizedBudget,
      deadline: normalizedDeadline,
      attachments: announcementAttachments,
      primaryImageUrl: getPrimaryImageUrl(originalAnnouncement.primaryImageUrl),
    };

    const nextAnnouncements = announcements.map((item) =>
      item.id === selectedAnnouncementId ? updatedAnnouncement : item,
    );
    persistAnnouncements(nextAnnouncements);
    setOriginalAnnouncement(updatedAnnouncement);
    setIsEditingAnnouncement(false);
    toast.success("Anúncio atualizado com sucesso!");
  };

  const handlePauseAnnouncement = (id: string) => {
    const nextAnnouncements = announcements.map((item) =>
      item.id === id ? { ...item, status: "Pausado" } : item,
    );
    persistAnnouncements(nextAnnouncements);
    toast.success("Anúncio pausado.");
  };

  const handleActivateAnnouncement = (id: string) => {
    const nextAnnouncements = announcements.map((item) =>
      item.id === id ? { ...item, status: "Ativo" } : item,
    );
    persistAnnouncements(nextAnnouncements);
    toast.success("Anúncio ativado.");
  };

  const handleDeleteAnnouncement = (id: string) => {
    const nextAnnouncements = announcements.filter((item) => item.id !== id);
    persistAnnouncements(nextAnnouncements);
    toast.success("Anúncio excluído.");
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
                          resetAnnouncementForm();
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
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleActivateAnnouncement(item.id)}
                                >
                                  Ativar anúncio
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAnnouncement(item.id)}
                                >
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
                <Card>
                  <CardHeader>
                    <CardTitle>{isViewingAnnouncement ? "Detalhes do anúncio" : "Novo anúncio"}</CardTitle>
                    <CardDescription>
                      {isViewingAnnouncement
                        ? "Confira as informações cadastradas para este anúncio."
                        : "Preencha os dados principais do anúncio."}
                    </CardDescription>
                    {isViewingAnnouncement && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditingAnnouncement(true)}
                          disabled={isEditingAnnouncement}
                        >
                          Editar anúncio
                        </Button>
                        {isEditingAnnouncement && hasAnnouncementChanges && (
                          <Button variant="outline" onClick={handleSaveAnnouncement}>
                            Salvar alterações
                          </Button>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Título</label>
                        <Input
                          placeholder="Ex: Reforma completa de apartamento"
                          value={titleValue}
                          disabled={isFormDisabled}
                          onChange={(event) => {
                            setTitleValue(event.target.value);
                            clearError("title");
                          }}
                        />
                        {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Categoria</label>
                        <Input
                          placeholder="Ex: Reforma, Arquitetura, Marcenaria"
                          value={categoryValue}
                          disabled={isFormDisabled}
                          onChange={(event) => {
                            setCategoryValue(event.target.value);
                            clearError("category");
                          }}
                        />
                        {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Descrição</label>
                      <Textarea
                        placeholder="Descreva o que você precisa ou oferece..."
                        className="min-h-[140px]"
                        value={descriptionValue}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          setDescriptionValue(event.target.value);
                          clearError("description");
                        }}
                      />
                      {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Orçamento</label>
                        <Input
                          value={budgetValue}
                          disabled={isFormDisabled}
                          onChange={(event) => setBudgetValue(formatCurrency(event.target.value))}
                          placeholder="R$ 0,00"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cidade</label>
                        <Input
                          placeholder="Digite a cidade"
                          value={cityValue}
                          disabled={isFormDisabled}
                          onChange={(event) => {
                            setCityValue(event.target.value);
                            clearError("city");
                          }}
                        />
                        {formErrors.city && <p className="text-sm text-destructive">{formErrors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Estado</label>
                        <Select
                          value={stateValue}
                          disabled={isFormDisabled}
                          onValueChange={(value) => {
                            setStateValue(value);
                            clearError("state");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {brazilStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.state && <p className="text-sm text-destructive">{formErrors.state}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-3 lg:col-span-1">
                        <label className="text-sm font-medium text-foreground">Prazo</label>
                        <Input
                          placeholder="Ex: 30 dias"
                          value={deadlineValue}
                          disabled={isFormDisabled}
                          onChange={(event) => setDeadlineValue(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">Anexos</label>
                      <Input
                        ref={announcementFileInputRef}
                        type="file"
                        multiple
                        disabled={isFormDisabled}
                        onChange={handleAnnouncementFilesChange}
                      />
                      {announcementAttachments.length > 0 && (
                        <div className="rounded-xl border border-dashed border-border p-3 bg-background/60">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {announcementAttachments.map((attachment) => {
                              const isImage = attachment.type.startsWith("image/");
                              const isVideo = attachment.type.startsWith("video/");
                              const isPrimary = attachment.isPrimary;
                              return (
                                <div
                                  key={attachment.id}
                                  role={isImage && !isFormDisabled ? "button" : undefined}
                                  tabIndex={isImage && !isFormDisabled ? 0 : -1}
                                  draggable={!isFormDisabled}
                                  onDragStart={(event) => handleDragStartAttachment(event, attachment.id)}
                                  onDragOver={(event) => handleDragOverAttachment(event, attachment.id)}
                                  onDrop={(event) => handleDropAttachment(event, attachment.id)}
                                  onDragEnd={handleDragEndAttachment}
                                  onClick={() => {
                                    if (!isImage || isFormDisabled) return;
                                    handleSelectPrimaryAttachment(attachment.id);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      if (!isImage || isFormDisabled) return;
                                      handleSelectPrimaryAttachment(attachment.id);
                                    }
                                  }}
                                  className={`relative overflow-hidden rounded-lg border ${
                                    isPrimary ? "border-primary" : "border-border"
                                  } ${!isFormDisabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${
                                    dragOverAttachmentId === attachment.id ? "ring-2 ring-primary/60" : ""
                                  } group`}
                                >
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveAttachment(attachment.id);
                                    }}
                                    disabled={isFormDisabled}
                                    className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
                                    aria-label={`Remover ${attachment.name}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  {isImage && attachment.url ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="h-28 w-full object-cover"
                                      draggable={false}
                                    />
                                  ) : isVideo && attachment.url ? (
                                    <video
                                      src={attachment.url}
                                      className="h-28 w-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                      draggable={false}
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 h-28 bg-muted text-muted-foreground">
                                      <FileText className="h-6 w-6" />
                                      <span className="text-xs px-2 text-center line-clamp-2">{attachment.name}</span>
                                    </div>
                                  )}
                                  {isImage && (!isFormDisabled || isPrimary) && (
                                    <span
                                      className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        isPrimary
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-background/80 text-foreground"
                                      }`}
                                    >
                                      {isPrimary ? "Principal" : "Definir principal"}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isViewingAnnouncement ? null : (
                        <>
                          <Button variant="secondary" onClick={handlePublish}>
                            Publicar anúncio
                          </Button>
                          <Button variant="outline">Salvar rascunho</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                              <Input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) {
                                    setConfigCnpjCard("");
                                    setConfigCnpjCardName("");
                                    return;
                                  }
                                  setConfigCnpjCardName(file.name);
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setConfigCnpjCard(String(reader.result ?? ""));
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
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

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Campos em branco</DialogTitle>
            <DialogDescription className="text-base">
              {missingOptional.length === 2
                ? "Orçamento e prazo estão em branco."
                : `${missingOptional.join(" e ")} está em branco.`}{" "}
              Deseja prosseguir assim mesmo?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se continuar, essas informações serão cadastradas como "A Combinar".
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={handleConfirmPublish}>
              Prosseguir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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


















