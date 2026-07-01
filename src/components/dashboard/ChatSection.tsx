import { ArrowLeft, Mic, Paperclip, Send, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import MediaMessage from "@/components/chat/MediaMessage";
import { formatRelativeTime, formatTime } from "@/lib/dashboard-formatters";
import type { useDashboardChats } from "@/hooks/use-dashboard-chats";

type ChatSectionProps = {
  chatsState: ReturnType<typeof useDashboardChats>;
  ownerId: string;
};

const ChatSection = ({ chatsState, ownerId }: ChatSectionProps) => {
  const {
    activeChat,
    setActiveChatId,
    groupedMessages,
    chatEndRef,
    fileInputRef,
    draftMessage,
    setDraftMessage,
    isRecording,
    handleFileChange,
    handleSendMessage,
    handleAttachClick,
    startRecording,
    stopRecording,
    handleAcceptProjectClose,
    handleRejectProjectClose,
    handleRequestProjectClose,
    sortedProjectChats,
    unreadProjectCounts,
    handleOpenChat,
  } = chatsState;

  return (
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
  );
};

export default ChatSection;
