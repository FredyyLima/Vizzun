export type SectionKey = "chats" | "anunciar" | "anuncios" | "pending" | "contracts" | "profile" | "config";

export type ChatSummary = {
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

export type ChatMessage = {
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

export type StoredChat = {
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
  ownerLastReadAt?: string | null;
  participantLastReadAt?: string | null;
  messages: ChatMessage[];
};

export type StoredProfessionalChat = {
  id: string;
  professionalId: string;
  professionalName: string;
  clientId: string;
  clientName: string;
  dealStatus?: "open" | "closed";
  closePendingFrom?: string | null;
  createdAt?: string;
  professionalLastReadAt?: string | null;
  clientLastReadAt?: string | null;
  messages: ChatMessage[];
};

export type AnnouncementAttachment = {
  id: string;
  name: string;
  type: string;
  url?: string;
  isPrimary?: boolean;
};

export type Announcement = {
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

export type ProfessionalProfile = {
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

export type UserProfile = {
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
