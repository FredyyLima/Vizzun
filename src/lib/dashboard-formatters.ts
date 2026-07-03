import { sanitizeDisplayName } from "@/lib/user";
import { maskCnpj } from "@/lib/masks";
import type { ChatMessage, ChatSummary, StoredChat, StoredProfessionalChat } from "@/lib/dashboard-types";

export const brazilStates = [
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

export const buildChatPreview = (message?: ChatMessage) => {
  if (!message) return "Sem mensagens";
  if (message.text) return message.text;
  if (message.fileName) return `Anexo: ${message.fileName}`;
  if (message.kind === "audio") return "Áudio";
  return "Mensagem";
};

export const buildChatSummaries = (storedChats: StoredChat[], viewerId: string) =>
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

export const buildChatMessages = (storedChats: StoredChat[]) =>
  storedChats.reduce((acc, chat) => {
    const normalized = (chat.messages ?? []).map((message) => ({
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    }));
    acc[chat.id] = normalized;
    return acc;
  }, {} as Record<string, ChatMessage[]>);

export const buildProfessionalChatSummaries = (storedChats: StoredProfessionalChat[], viewerId: string) =>
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

export const buildProfessionalChatMessages = (storedChats: StoredProfessionalChat[]) =>
  storedChats.reduce((acc, chat) => {
    const normalized = (chat.messages ?? []).map((message) => ({
      ...message,
      createdAt: message.createdAt ?? new Date().toISOString(),
    }));
    acc[chat.id] = normalized;
    return acc;
  }, {} as Record<string, ChatMessage[]>);

export const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const formatDayLabel = (value: string) => new Date(value).toLocaleDateString("pt-BR");

export const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} dia${diffDays > 1 ? "s" : ""}`;
};

export const formatCurrency = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
};

export const formatCnpj = (value?: string | null) => {
  return maskCnpj(value);
};
