import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { apiPath } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import {
  buildChatMessages,
  buildChatSummaries,
  buildProfessionalChatMessages,
  buildProfessionalChatSummaries,
  formatDayLabel,
} from "@/lib/dashboard-formatters";
import type { ChatMessage, SectionKey, StoredChat, StoredProfessionalChat } from "@/lib/dashboard-types";

type UseDashboardChatsArgs = {
  authUserId?: string;
  ownerId: string;
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
};

export function useDashboardChats({ authUserId, ownerId, activeSection, setActiveSection }: UseDashboardChatsArgs) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatSource, setActiveChatSource] = useState<"project" | "professional">("project");
  const [draftMessage, setDraftMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showRejectDealModal, setShowRejectDealModal] = useState(false);
  const [rejectDealReason, setRejectDealReason] = useState("");
  const [rejectDealChatId, setRejectDealChatId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const queryClient = useQueryClient();

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
    enabled: Boolean(authUserId),
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
    enabled: Boolean(authUserId),
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

  const markChatAsRead = (chatId: string, source: "project" | "professional") => {
    const path = source === "project" ? `/api/chats/${chatId}/read` : `/api/professional-chats/${chatId}/read`;
    const refetch = source === "project" ? refetchChats : refetchProfessionalChats;
    fetch(apiPath(path), { method: "POST", credentials: "include" })
      .then(refetch)
      .catch(() => {
        // marcar como lido nao e critico o suficiente para bloquear a UI em caso de falha
      });
  };

  useEffect(() => {
    if (!activeChatId) return;
    markChatAsRead(activeChatId, activeChatSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return {
    activeChatId,
    setActiveChatId,
    activeChatSource,
    draftMessage,
    setDraftMessage,
    isRecording,
    showRejectDealModal,
    setShowRejectDealModal,
    rejectDealReason,
    setRejectDealReason,
    chatEndRef,
    fileInputRef,
    pendingDeals,
    contractDeals,
    sortedProjectChats,
    sortedProfessionalChats,
    activeChat,
    groupedMessages,
    unreadProjectCounts,
    unreadProfessionalCounts,
    totalUnreadProjects,
    totalUnreadProfessionals,
    handleAcceptDeal,
    handleOpenRejectModal,
    handleOpenPendingChat,
    handleRejectDeal,
    handleOpenChat,
    handleRequestProfessionalClose,
    handleAcceptProfessionalClose,
    handleRejectProfessionalClose,
    handleRequestProjectClose,
    handleAcceptProjectClose,
    handleRejectProjectClose,
    handleSendMessage,
    handleAttachClick,
    handleFileChange,
    startRecording,
    stopRecording,
  };
}
