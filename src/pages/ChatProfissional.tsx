import { Button } from "@/components/ui/button";
import MediaMessage from "@/components/chat/MediaMessage";
import { Send, Paperclip, Mic, Square, Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sanitizeDisplayName } from "@/lib/user";

type Message = {
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
};

type StoredProfile = {
  id: string;
  name: string;
  avatar?: string | null;
  specialty?: string | null;
  location?: string | null;
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
  messages: Message[];
};

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string;
};

const profileStorageKey = "professional_profiles";
const chatStorageKey = "professional_chats";
const professionalChatReadStorageKey = "professional_chat_reads";

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

const loadStoredChats = () => {
  if (typeof window === "undefined") return [] as StoredProfessionalChat[];
  const raw = localStorage.getItem(chatStorageKey);
  if (!raw) return [] as StoredProfessionalChat[];
  try {
    return JSON.parse(raw) as StoredProfessionalChat[];
  } catch {
    return [] as StoredProfessionalChat[];
  }
};

const saveStoredChats = (chats: StoredProfessionalChat[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(chatStorageKey, JSON.stringify(chats));
  window.dispatchEvent(new Event("professional-chats:changed"));
};

const saveChatRead = (userId: string, chatId: string) => {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(professionalChatReadStorageKey);
  let parsed: Record<string, Record<string, string>> = {};
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
  } catch {
    parsed = {};
  }
  parsed[userId] = { ...(parsed[userId] ?? {}), [chatId]: new Date().toISOString() };
  localStorage.setItem(professionalChatReadStorageKey, JSON.stringify(parsed));
  window.dispatchEvent(new Event("professional-reads:changed"));
};

const formatTime = (value: Date | string) =>
  new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const normalizeMessages = (items: Message[]) =>
  items.map((message) => ({
    ...message,
    createdAt: message.createdAt ?? new Date().toISOString(),
    time: message.time ?? formatTime(message.createdAt ?? new Date()),
  }));

const ChatProfissional = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMeta, setChatMeta] = useState({ name: "Profissional", specialty: "" });
  const [chatInfo, setChatInfo] = useState<StoredProfessionalChat | null>(null);
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

  const clientId = authUser?.id ?? authUser?.email ?? "guest";
  const clientName = sanitizeDisplayName(authUser?.name ?? "Usuario", "Usuario");

  useEffect(() => {
    if (!id || !authUser) return;
    const profiles = loadStoredProfiles();
    const profile = profiles.find((item) => item.id === id);
    const professionalName = sanitizeDisplayName(profile?.name ?? "Profissional", "Profissional");
    const professionalId = id;
    const storedChats = loadStoredChats();
    const existingOpenChats = storedChats.filter(
      (chat) =>
        chat.professionalId === professionalId &&
        chat.clientId === clientId &&
        chat.dealStatus !== "closed",
    );
    const sortedOpenChats = [...existingOpenChats].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
    const currentChat = sortedOpenChats[0] ?? null;
    const nextChatId = currentChat?.id ?? `pro-${professionalId}-${clientId}-${Date.now()}`;

    const existingIndex = storedChats.findIndex((chat) => chat.id === nextChatId);
    if (existingIndex >= 0) {
      const existing = storedChats[existingIndex];
      const updated = {
        ...existing,
        professionalName,
        clientName,
        dealStatus: existing.dealStatus ?? "open",
        closePendingFrom: existing.closePendingFrom ?? null,
        messages: normalizeMessages(existing.messages ?? []),
      };
      storedChats[existingIndex] = updated;
      saveStoredChats(storedChats);
      setMessages(updated.messages ?? []);
      setChatInfo(updated);
    } else {
      const newChat: StoredProfessionalChat = {
        id: nextChatId,
        professionalId,
        professionalName,
        clientId,
        clientName,
        dealStatus: "open",
        closePendingFrom: null,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      storedChats.push(newChat);
      saveStoredChats(storedChats);
      setMessages([]);
      setChatInfo(newChat);
    }

    setChatMeta({ name: professionalName, specialty: profile?.specialty ?? "" });
    setChatId(nextChatId);
  }, [authUser, clientId, clientName, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    saveChatRead(clientId, chatId);
  }, [chatId, clientId, messages]);

  useEffect(() => {
    if (!chatId) return;
    const syncChat = () => {
      const storedChats = loadStoredChats();
      const current = storedChats.find((chat) => chat.id === chatId);
      if (!current) return;
      setMessages(normalizeMessages(current.messages ?? []));
      setChatInfo(current);
    };
    window.addEventListener("storage", syncChat);
    window.addEventListener("professional-chats:changed", syncChat as EventListener);
    return () => {
      window.removeEventListener("storage", syncChat);
      window.removeEventListener("professional-chats:changed", syncChat as EventListener);
    };
  }, [chatId]);

  const appendMessages = (newMessages: Message[]) => {
    if (!chatId) return;
    setMessages((prev) => {
      const next = [...prev, ...newMessages];
      const storedChats = loadStoredChats();
      const index = storedChats.findIndex((chat) => chat.id === chatId);
      if (index >= 0) {
        storedChats[index] = {
          ...storedChats[index],
          messages: normalizeMessages(next),
        };
        saveStoredChats(storedChats);
        setChatInfo(storedChats[index]);
      }
      return next;
    });
  };

  const requestCloseDeal = () => {
    if (!chatId) return;
    const storedChats = loadStoredChats();
    const index = storedChats.findIndex((chat) => chat.id === chatId);
    if (index < 0) return;
    const now = new Date();
    storedChats[index] = {
      ...storedChats[index],
      closePendingFrom: clientId,
      messages: normalizeMessages([
        ...(storedChats[index].messages ?? []),
        {
          id: `${Date.now()}-deal`,
          sender: "me",
          senderId: clientId,
          createdAt: now.toISOString(),
          time: formatTime(now),
          kind: "text",
          text: "Solicitação de fechamento enviada. Aguardando confirmação da outra parte.",
        },
      ]),
    };
    saveStoredChats(storedChats);
    setShowDealModal(false);
  };

  const acceptCloseDeal = () => {
    if (!chatId) return;
    const storedChats = loadStoredChats();
    const index = storedChats.findIndex((chat) => chat.id === chatId);
    if (index < 0) return;
    const now = new Date();
    const closedChat = {
      ...storedChats[index],
      closePendingFrom: null,
      dealStatus: "closed",
      messages: normalizeMessages([
        ...(storedChats[index].messages ?? []),
        {
          id: `${Date.now()}-deal`,
          sender: "me",
          senderId: clientId,
          createdAt: now.toISOString(),
          time: formatTime(now),
          kind: "text",
          text: "Negócio fechado.",
        },
      ]),
    };
    const newChat: StoredProfessionalChat = {
      ...storedChats[index],
      id: `pro-${storedChats[index].professionalId}-${storedChats[index].clientId}-${Date.now()}`,
      closePendingFrom: null,
      dealStatus: "open",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    storedChats.splice(index, 1, closedChat, newChat);
    saveStoredChats(storedChats);
  };

  const rejectCloseDeal = () => {
    if (!chatId) return;
    const storedChats = loadStoredChats();
    const index = storedChats.findIndex((chat) => chat.id === chatId);
    if (index < 0) return;
    const now = new Date();
    storedChats[index] = {
      ...storedChats[index],
      closePendingFrom: null,
      messages: normalizeMessages([
        ...(storedChats[index].messages ?? []),
        {
          id: `${Date.now()}-deal`,
          sender: "me",
          senderId: clientId,
          createdAt: now.toISOString(),
          time: formatTime(now),
          kind: "text",
          text: "Fechamento recusado.",
        },
      ]),
    };
    saveStoredChats(storedChats);
  };


  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    const now = new Date();
    const message: Message = {
      id: Date.now().toString(),
      sender: "me",
      senderId: clientId,
      text: newMessage,
      createdAt: now.toISOString(),
      time: formatTime(now),
      kind: "text",
    };
    appendMessages([message]);
    setNewMessage("");
  };

  const handleConfirmDeal = () => {
    requestCloseDeal();
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
      senderId: clientId,
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
    if (!navigator.mediaDevices?.getUserMedia) return;

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
            senderId: clientId,
            createdAt: now.toISOString(),
            time: formatTime(now),
            kind: "audio",
            fileName: "?udio",
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

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Faça login para iniciar um chat</h2>
          <p className="text-sm text-muted-foreground">Para contratar, você precisa entrar ou criar uma conta.</p>
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
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/profissional/${id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Voltar para o perfil"
          >
            &lt;
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {chatMeta.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{chatMeta.name}</h2>
              <p className="text-xs text-muted-foreground">{chatMeta.specialty || "Profissional"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chatInfo?.closePendingFrom && (
            <span className="text-xs text-muted-foreground">Fechamento em andamento</span>
          )}
          {chatInfo?.dealStatus !== "closed" &&
            (chatInfo?.closePendingFrom ? (
              chatInfo.closePendingFrom === clientId ? (
                <Button variant="outline" size="sm" disabled>
                  Aguardando confirmação
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={acceptCloseDeal}>
                    Aceitar fechamento
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejectCloseDeal}>
                    Recusar
                  </Button>
                </>
              )
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowDealModal(true)}>
                Fechar Negócio
              </Button>
            ))}
        </div>
      </div>

      <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Contato profissional</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-12">
            Nenhuma mensagem ainda. Inicie a conversa enviando sua proposta.
          </div>
        )}
        {messages.map((message) => {
          const isMe = message.senderId ? message.senderId === clientId : message.sender === "me";
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
            {isRecording ? <Square className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
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

      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Fechar Negócio</DialogTitle>
            <DialogDescription className="text-base">
              Você deseja oficializar o serviço com <strong>{chatMeta.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A outra parte receberá uma notificação para confirmar o acordo.
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDealModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="secondary" onClick={handleConfirmDeal}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatProfissional;
