import { Button } from "@/components/ui/button";
import MediaMessage from "@/components/chat/MediaMessage";
import {
  Send,
  Paperclip,
  Mic,
  Square,
  Check,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getDisplayName, sanitizeDisplayName } from "@/lib/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  sender: "me" | "other";
  senderId?: string;
  text?: string;
  createdAt: string;
  time: string;
  kind?: "text" | "file" | "audio" | "image" | "video";
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
}

type StoredAnnouncement = {
  id: string;
  ownerId?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  title: string;
  budget?: string;
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
  messages: Message[];
};

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string;
  personType?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
  role?: string;
};

const announcementStorageKey = "site_announcements";
const chatStorageKey = "site_chats";
const chatReadStorageKey = "chat_reads";

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

const saveStoredAnnouncements = (items: StoredAnnouncement[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(announcementStorageKey, JSON.stringify(items));
  window.dispatchEvent(new Event("announcements:changed"));
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

const saveStoredChats = (chats: StoredChat[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(chatStorageKey, JSON.stringify(chats));
  window.dispatchEvent(new Event("chats:changed"));
};

const saveChatRead = (userId: string, chatId: string) => {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(chatReadStorageKey);
  let parsed: Record<string, Record<string, string>> = {};
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
  } catch {
    parsed = {};
  }
  parsed[userId] = { ...(parsed[userId] ?? {}), [chatId]: new Date().toISOString() };
  localStorage.setItem(chatReadStorageKey, JSON.stringify(parsed));
  window.dispatchEvent(new Event("chat-reads:changed"));
};

const formatTime = (value: Date | string) =>
  new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const normalizeMessages = (items: Message[]) =>
  items.map((message) => ({
    ...message,
    createdAt: message.createdAt ?? new Date().toISOString(),
    time: message.time ?? formatTime(message.createdAt ?? new Date()),
  }));

const Chat = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMeta, setChatMeta] = useState({
    ownerName: "Cliente",
    projectTitle: "Projeto",
    projectBudget: "",
  });
  const [dealStatus, setDealStatus] = useState<"pending" | "closed" | null>(null);
  const [pendingDealFrom, setPendingDealFrom] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<"pending" | "accepted" | "rejected" | null>(null);
  const [storedAnnouncements, setStoredAnnouncements] = useState<StoredAnnouncement[]>(() =>
    loadStoredAnnouncements(),
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const participantId = authUser?.id ?? authUser?.email ?? "guest";
  const participantName = getDisplayName(authUser, "Usuario");

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

  useEffect(() => {
    if (!authUser || !projectId) return;
    const announcement = storedAnnouncements.find((item) => item.id === projectId) ?? null;
    const ownerName = sanitizeDisplayName(announcement?.ownerName?.trim() ?? null, "Cliente");
    const ownerId = announcement?.ownerId ?? announcement?.ownerEmail ?? "owner";
    const projectTitle = announcement?.title ?? "Projeto";
    const projectBudget = announcement?.budget ?? "";
    const storedChats = loadStoredChats();
    const openChats = storedChats.filter(
      (chat) => chat.projectId === projectId && chat.participantId === participantId && chat.dealStatus !== "closed",
    );
    const sortedOpenChats = [...openChats].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
    const nextChatId = sortedOpenChats[0]?.id ?? `chat-${projectId}-${participantId}-${Date.now()}`;
    const isOwnerView = ownerId === participantId;
    const existingIndex = storedChats.findIndex((chat) => chat.id === nextChatId);
    let chatRecord: StoredChat;
    if (existingIndex >= 0) {
      const existing = storedChats[existingIndex];
      const updated = {
        ...existing,
        ownerId,
        ownerName,
        ownerEmail: announcement?.ownerEmail ?? existing.ownerEmail ?? null,
        participantName: isOwnerView ? existing.participantName : participantName,
        projectTitle,
        projectBudget,
        createdAt: existing.createdAt ?? new Date().toISOString(),
        messages: normalizeMessages(existing.messages ?? []),
      };
      storedChats[existingIndex] = updated;
      saveStoredChats(storedChats);
      setMessages(updated.messages ?? []);
      setDealStatus(updated.dealStatus ?? null);
      setPendingDealFrom(updated.pendingDealFrom ?? null);
      setContractStatus(updated.contractStatus ?? null);
      chatRecord = updated;
    } else {
      const newChat: StoredChat = {
        id: nextChatId,
        projectId,
        ownerId,
        ownerName,
        ownerEmail: announcement?.ownerEmail ?? null,
        participantId,
        participantName,
        projectTitle,
        projectBudget,
        pendingDealFrom: null,
        dealStatus: null,
        closePendingFrom: null,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      storedChats.push(newChat);
      saveStoredChats(storedChats);
      setMessages([]);
      setDealStatus(null);
      setPendingDealFrom(null);
      setContractStatus(null);
      chatRecord = newChat;
    }

    const otherName = isOwnerView
      ? sanitizeDisplayName(chatRecord.participantName, "Usuario")
      : sanitizeDisplayName(chatRecord.ownerName, "Cliente");
    setChatMeta({ ownerName: otherName, projectTitle, projectBudget });
    setChatId(nextChatId);
  }, [authUser, projectId, participantId, participantName, storedAnnouncements]);

  useEffect(() => {
    if (!chatId) return;
    const syncChat = () => {
      const storedChats = loadStoredChats();
      const current = storedChats.find((chat) => chat.id === chatId);
      if (!current) return;
      setDealStatus(current.dealStatus ?? null);
      setPendingDealFrom(current.pendingDealFrom ?? null);
      setContractStatus(current.contractStatus ?? null);
      setMessages(normalizeMessages(current.messages ?? []));
    };
    window.addEventListener("storage", syncChat);
    window.addEventListener("chats:changed", syncChat as EventListener);
    return () => {
      window.removeEventListener("storage", syncChat);
      window.removeEventListener("chats:changed", syncChat as EventListener);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    saveChatRead(participantId, chatId);
  }, [chatId, participantId, messages]);

  const persistChatMessages = (nextMessages: Message[]) => {
    if (!chatId) return;
    const storedChats = loadStoredChats();
    const chatIndex = storedChats.findIndex((chat) => chat.id === chatId);
    if (chatIndex < 0) return;
    storedChats[chatIndex] = {
      ...storedChats[chatIndex],
      messages: normalizeMessages(nextMessages),
    };
    saveStoredChats(storedChats);
  };

  const updateChatDealStatus = (status: "pending" | "closed", fromId?: string | null) => {
    if (!chatId) return;
    const storedChats = loadStoredChats();
    const chatIndex = storedChats.findIndex((chat) => chat.id === chatId);
    if (chatIndex < 0) return;
    const updated = {
      ...storedChats[chatIndex],
      dealStatus: status,
      pendingDealFrom: status === "pending" ? fromId ?? participantId : null,
    };
    storedChats[chatIndex] = updated;
    saveStoredChats(storedChats);
    setDealStatus(updated.dealStatus ?? null);
    setPendingDealFrom(updated.pendingDealFrom ?? null);

    if (projectId) {
      const storedAnnouncements = loadStoredAnnouncements();
      const nextAnnouncements = storedAnnouncements.map((item) =>
        item.id === projectId ? { ...item, dealStatus: status } : item,
      );
      saveStoredAnnouncements(nextAnnouncements);
    }
  };

  const updateChatContractStatus = (status: "accepted" | "rejected") => {
    if (!chatId) return;
    const storedChats = loadStoredChats();
    const chatIndex = storedChats.findIndex((chat) => chat.id === chatId);
    if (chatIndex < 0) return;
    const now = new Date().toISOString();
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      sender: "other",
      senderId: "system",
      text: status === "accepted" ? "Contrato aceito pelo profissional." : "Contrato recusado pelo profissional.",
      createdAt: now,
      time: formatTime(now),
      kind: "text",
    };
    const updated = {
      ...storedChats[chatIndex],
      contractStatus: status,
      messages: [...(storedChats[chatIndex].messages ?? []), systemMessage],
    };
    storedChats[chatIndex] = updated;
    saveStoredChats(storedChats);
    setContractStatus(updated.contractStatus ?? null);
    setMessages(normalizeMessages(updated.messages ?? []));
  };

  const appendMessages = (newMessages: Message[]) => {
    if (!chatId) return;
    setMessages((prev) => {
      const next = [...prev, ...newMessages];
      persistChatMessages(next);
      return next;
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    const now = new Date();
    const message: Message = {
      id: Date.now().toString(),
      sender: "me",
      senderId: participantId,
      text: newMessage,
      createdAt: now.toISOString(),
      time: formatTime(now),
      kind: "text",
    };

    appendMessages([message]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!chatId) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const now = new Date();
    const resolveKind = (type: string) => {
      if (type.startsWith("image/")) return "image";
      if (type.startsWith("video/")) return "video";
      if (type.startsWith("audio/")) return "audio";
      return "file";
    };

    const newAttachments = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      sender: "me" as const,
      senderId: participantId,
      createdAt: now.toISOString(),
      time: formatTime(now),
      kind: resolveKind(file.type),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
    }));

    appendMessages(newAttachments);
    event.target.value = "";
  };

  const startRecording = async () => {
    if (isRecording || !chatId) return;
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
        const now = new Date();

        appendMessages([
          {
            id: `${Date.now()}-audio`,
            sender: "me",
            senderId: participantId,
            createdAt: now.toISOString(),
            time: formatTime(now),
            kind: "audio",
            fileName: "Áudio",
            fileUrl: url,
          },
        ]);

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

  const projectLink = projectId ? `/projeto/${projectId}` : "/projetos";
  const isDealClosed = dealStatus === "closed";
  const isDealPending = dealStatus === "pending";
  const isPendingFromMe = pendingDealFrom === participantId;
  const isContractContext = new URLSearchParams(location.search).get("context") === "contract";
  const canRespondContract = isContractContext && authUser?.role === "PROFESSIONAL";

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Faça login para iniciar um chat</h2>
          <p className="text-sm text-muted-foreground">
            Para enviar uma proposta, você precisa entrar ou criar uma conta.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/login">
              <Button variant="secondary">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button variant="outline">Criar conta</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Link
              to={projectLink}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Voltar para o anúncio"
            >
              &lt;
            </Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {chatMeta.ownerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{chatMeta.ownerName}</h2>
              <p className="text-xs text-muted-foreground">{chatMeta.projectTitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDealModal(true)}
            className="hidden sm:flex"
            disabled={isDealClosed || (isDealPending && isPendingFromMe)}
          >
            {isDealClosed ? "Negócio fechado" : isDealPending ? "Negócio pendente" : "Fechar Negócio"}
          </Button>
          
          
        </div>
      </div>

      {/* Project Summary Bar */}
      <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Projeto:</span>
          <Link to={projectLink} className="font-medium text-primary hover:underline">
            {chatMeta.projectTitle}
          </Link>
          {chatMeta.projectBudget && (
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-medium">
              {chatMeta.projectBudget}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDealModal(true)}
          className="sm:hidden"
          disabled={isDealClosed || (isDealPending && isPendingFromMe)}
        >
          {isDealClosed ? "Negócio fechado" : isDealPending ? "Negócio pendente" : "Fechar Negócio"}
        </Button>
      </div>

      {canRespondContract && (
        <div className="bg-muted/50 border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {contractStatus === "accepted"
              ? "Você aceitou este contrato."
              : contractStatus === "rejected"
                ? "Você recusou este contrato."
                : "Contrato aguardando sua resposta."}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateChatContractStatus("accepted")}
              disabled={contractStatus === "accepted"}
            >
              Aceitar contrato
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateChatContractStatus("rejected")}
              disabled={contractStatus === "rejected"}
            >
              Recusar contrato
            </Button>
          </div>
        </div>
      )}

      {isDealPending && !isPendingFromMe && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 flex items-center justify-between">
          <span>Negócio pendente: aceite pelo dashboard.</span>
          <Link to="/dashboard-usuario" className="font-medium text-amber-800 hover:underline">
            Ver pendências
          </Link>
        </div>
      )}

      {isDealClosed && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-sm text-emerald-700">
          Negócio fechado com sucesso.
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-12">
            Nenhuma mensagem ainda. Inicie a conversa enviando sua proposta.
          </div>
        )}
        {messages.map((message) => {
          const isMe = message.senderId ? message.senderId === participantId : message.sender === "me";
          return (
            <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-3 ${
                  isMe
                    ? "bg-gradient-hero text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                <MediaMessage message={message} isMe={isMe} />
                <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {message.time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={handleAttachClick}
            aria-label="Adicionar anexo"
            type="button"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
            type="button"
          >
            {isRecording ? (
              <Square className="h-5 w-5 text-destructive" />
            ) : (
              <Mic className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            variant="secondary"
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="h-11 w-11 rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Deal Confirmation Modal */}
      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Fechar Negócio</DialogTitle>
            <DialogDescription className="text-base">
              Você deseja oficializar o serviço com <strong>{chatMeta.ownerName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-xl p-4 my-4">
            <p className="text-sm text-muted-foreground mb-2">Projeto:</p>
            <p className="font-medium text-foreground">{chatMeta.projectTitle}</p>
            <p className="text-sm text-muted-foreground mt-2">Valor acordado:</p>
            <p className="text-2xl font-bold text-primary">{chatMeta.projectBudget || "A combinar"}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            A outra parte receberá uma notificação para confirmar o acordo. Após a confirmação de ambos, o
            projeto será marcado como "Em Andamento".
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDealModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                updateChatDealStatus("pending", participantId);
                setShowDealModal(false);
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
