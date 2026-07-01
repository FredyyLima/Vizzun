import { Button } from "@/components/ui/button";
import MediaMessage from "@/components/chat/MediaMessage";
import { Send, Paperclip, Mic, Square, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiPath } from "@/lib/api";
import SeoHead from "@/components/SeoHead";

type ApiMessage = {
  id: string;
  senderId?: string;
  text?: string;
  createdAt: string;
  kind?: "text" | "file" | "audio" | "image" | "video";
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
};

type ApiProfessionalChat = {
  id: string;
  professionalId: string;
  professionalName: string;
  clientId: string;
  clientName: string;
  dealStatus: "open" | "closed";
  closePendingFrom?: string | null;
  messages: ApiMessage[];
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const resolveKind = (type: string) => {
  if (type.startsWith("image/")) return "image" as const;
  if (type.startsWith("video/")) return "video" as const;
  if (type.startsWith("audio/")) return "audio" as const;
  return "file" as const;
};

const uploadChatFile = async (file: Blob, filename: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file, filename);
  const response = await fetch(apiPath("/api/uploads"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Falha ao enviar arquivo.");
  }
  const result = (await response.json()) as { url: string };
  return result.url;
};

const ChatProfissional = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initError, setInitError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { user: authUser, loading: authLoading } = useAuth();
  const clientId = authUser?.id ?? "guest";

  useEffect(() => {
    if (!id || !authUser) return;
    let active = true;
    fetch(apiPath("/api/professional-chats"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ professionalId: id }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((chat: ApiProfessionalChat) => {
        if (active) setChatId(chat.id);
      })
      .catch(() => {
        if (active) setInitError(true);
      });
    return () => {
      active = false;
    };
  }, [authUser, id]);

  const { data: chat } = useQuery({
    queryKey: ["professional-chat", chatId],
    queryFn: async () => {
      const response = await fetch(apiPath(`/api/professional-chats/${chatId}`), { credentials: "include" });
      if (!response.ok) throw new Error("Falha ao carregar chat.");
      return (await response.json()) as ApiProfessionalChat;
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });

  const messages = chat?.messages ?? [];
  const refetchChat = () => queryClient.invalidateQueries({ queryKey: ["professional-chat", chatId] });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!chatId) return;
    fetch(apiPath(`/api/professional-chats/${chatId}/read`), { method: "POST", credentials: "include" }).catch(() => {
      // marcar como lido nao e critico o suficiente para bloquear a UI em caso de falha
    });
  }, [chatId, messages.length]);

  const postMessage = async (body: Record<string, unknown>) => {
    if (!chatId) return;
    try {
      await fetch(apiPath(`/api/professional-chats/${chatId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      refetchChat();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const postClose = (action: "request" | "accept" | "reject") => {
    if (!chatId) return;
    fetch(apiPath(`/api/professional-chats/${chatId}/close`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    })
      .then(refetchChat)
      .catch((error) => console.error("Erro ao atualizar fechamento:", error));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    postMessage({ text: newMessage, kind: "text" });
    setNewMessage("");
  };

  const handleConfirmDeal = () => {
    postClose("request");
    setShowDealModal(false);
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!chatId) return;
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const url = await uploadChatFile(file, file.name);
        await postMessage({ kind: resolveKind(file.type), fileName: file.name, fileUrl: url, fileType: file.type });
      } catch (error) {
        console.error("Erro ao enviar anexo:", error);
      }
    }
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

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        try {
          const url = await uploadChatFile(blob, "audio.webm");
          await postMessage({ kind: "audio", fileName: "Áudio", fileUrl: url, fileType: "audio/webm" });
        } catch (error) {
          console.error("Erro ao enviar audio:", error);
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

  if (authLoading) {
    return null;
  }

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

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Profissional não encontrado</h2>
          <p className="text-sm text-muted-foreground">Este perfil não está mais disponível.</p>
          <Link to="/profissionais">
            <Button variant="secondary">Ver outros profissionais</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <SeoHead title="Chat com profissional" description="Converse com o profissional na Vizzun." />
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
              {(chat?.professionalName ?? "Profissional").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{chat?.professionalName ?? "Profissional"}</h2>
              <p className="text-xs text-muted-foreground">Profissional</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chat?.closePendingFrom && (
            <span className="text-xs text-muted-foreground">Fechamento em andamento</span>
          )}
          {chat?.dealStatus !== "closed" &&
            (chat?.closePendingFrom ? (
              chat.closePendingFrom === clientId ? (
                <Button variant="outline" size="sm" disabled>
                  Aguardando confirmação
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => postClose("accept")}>
                    Aceitar fechamento
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => postClose("reject")}>
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
          const isMe = message.senderId === clientId;
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
                  {formatTime(message.createdAt)}
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
              Você deseja oficializar o serviço com <strong>{chat?.professionalName ?? "Profissional"}</strong>?
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
