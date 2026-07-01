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
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiPath } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type ApiChat = {
  id: string;
  projectId: string;
  ownerId: string;
  ownerName: string;
  participantId: string;
  participantName: string;
  projectTitle: string;
  projectBudget?: string;
  pendingDealFrom?: string | null;
  dealStatus?: "pending" | "closed";
  closePendingFrom?: string | null;
  contractStatus?: "pending" | "accepted" | "rejected";
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

const Chat = () => {
  const { projectId } = useParams();
  const location = useLocation();
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
  const participantId = authUser?.id ?? "guest";

  useEffect(() => {
    if (!authUser || !projectId) return;
    let active = true;
    fetch(apiPath("/api/chats"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ announcementId: projectId }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((chat: ApiChat) => {
        if (active) setChatId(chat.id);
      })
      .catch(() => {
        if (active) setInitError(true);
      });
    return () => {
      active = false;
    };
  }, [authUser, projectId]);

  const { data: chat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await fetch(apiPath(`/api/chats/${chatId}`), { credentials: "include" });
      if (!response.ok) throw new Error("Falha ao carregar chat.");
      return (await response.json()) as ApiChat;
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });

  const messages = chat?.messages ?? [];
  const isOwnerView = chat ? chat.ownerId === participantId : false;
  const otherName = chat ? (isOwnerView ? chat.participantName : chat.ownerName) : "Cliente";

  const refetchChat = () => queryClient.invalidateQueries({ queryKey: ["chat", chatId] });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!chatId) return;
    fetch(apiPath(`/api/chats/${chatId}/read`), { method: "POST", credentials: "include" }).catch(() => {
      // marcar como lido nao e critico o suficiente para bloquear a UI em caso de falha
    });
  }, [chatId, messages.length]);

  const postMessage = async (body: Record<string, unknown>) => {
    if (!chatId) return;
    try {
      await fetch(apiPath(`/api/chats/${chatId}/messages`), {
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    postMessage({ text: newMessage, kind: "text" });
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

  const proposeDeal = () => {
    if (!chatId) return;
    fetch(apiPath(`/api/chats/${chatId}/deal`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "propose" }),
    })
      .then(refetchChat)
      .catch((error) => console.error("Erro ao propor negocio:", error));
    setShowDealModal(false);
  };

  const respondContract = (action: "accept" | "reject") => {
    if (!chatId) return;
    fetch(apiPath(`/api/chats/${chatId}/contract`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    })
      .then(refetchChat)
      .catch((error) => console.error("Erro ao responder contrato:", error));
  };

  const projectLink = projectId ? `/projeto/${projectId}` : "/projetos";
  const dealStatus = chat?.dealStatus ?? null;
  const pendingDealFrom = chat?.pendingDealFrom ?? null;
  const contractStatus = chat?.contractStatus ?? null;
  const isDealClosed = dealStatus === "closed";
  const isDealPending = dealStatus === "pending";
  const isPendingFromMe = pendingDealFrom === participantId;
  const isContractContext = new URLSearchParams(location.search).get("context") === "contract";
  const canRespondContract = isContractContext && authUser?.role === "PROFESSIONAL";

  if (authLoading) {
    return null;
  }

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

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Projeto não encontrado</h2>
          <p className="text-sm text-muted-foreground">Este anúncio não está mais disponível.</p>
          <Link to="/projetos">
            <Button variant="secondary">Ver outros projetos</Button>
          </Link>
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
              {otherName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{otherName}</h2>
              <p className="text-xs text-muted-foreground">{chat?.projectTitle ?? "Projeto"}</p>
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
            {chat?.projectTitle ?? "Projeto"}
          </Link>
          {chat?.projectBudget && (
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-medium">
              {chat.projectBudget}
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
              onClick={() => respondContract("accept")}
              disabled={contractStatus === "accepted"}
            >
              Aceitar contrato
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => respondContract("reject")}
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
          const isMe = message.senderId === participantId;
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
              Você deseja oficializar o serviço com <strong>{otherName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-xl p-4 my-4">
            <p className="text-sm text-muted-foreground mb-2">Projeto:</p>
            <p className="font-medium text-foreground">{chat?.projectTitle ?? "Projeto"}</p>
            <p className="text-sm text-muted-foreground mt-2">Valor acordado:</p>
            <p className="text-2xl font-bold text-primary">{chat?.projectBudget || "A combinar"}</p>
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
            <Button variant="secondary" onClick={proposeDeal}>
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
