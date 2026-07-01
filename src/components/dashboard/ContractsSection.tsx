import { ArrowLeft, Mic, Paperclip, Send, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import MediaMessage from "@/components/chat/MediaMessage";
import { formatRelativeTime, formatTime } from "@/lib/dashboard-formatters";
import type { useDashboardChats } from "@/hooks/use-dashboard-chats";

type ContractsSectionProps = {
  chatsState: ReturnType<typeof useDashboardChats>;
  ownerId: string;
};

const ContractsSection = ({ chatsState, ownerId }: ContractsSectionProps) => {
  const {
    activeChatId,
    setActiveChatId,
    activeChatSource,
    activeChat,
    groupedMessages,
    chatEndRef,
    fileInputRef,
    draftMessage,
    setDraftMessage,
    isRecording,
    handleFileChange,
    handleSendMessage,
    startRecording,
    stopRecording,
    handleAcceptProfessionalClose,
    handleRejectProfessionalClose,
    handleRequestProfessionalClose,
    sortedProfessionalChats,
    unreadProfessionalCounts,
    handleOpenChat,
  } = chatsState;

  return (
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
  );
};

export default ContractsSection;
