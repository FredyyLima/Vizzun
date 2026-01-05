import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  text: string;
  time: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "other",
    text: "Olá! Vi seu perfil e gostaria de saber mais sobre sua disponibilidade para o projeto de reforma.",
    time: "14:30",
  },
  {
    id: "2",
    sender: "me",
    text: "Olá João! Claro, estou disponível. Qual seria o prazo desejado para início da obra?",
    time: "14:32",
  },
  {
    id: "3",
    sender: "other",
    text: "Idealmente gostaríamos de começar em março. O apartamento estará vazio até lá. Você pode fazer uma visita técnica antes?",
    time: "14:35",
  },
  {
    id: "4",
    sender: "me",
    text: "Perfeito! Março funciona bem para minha agenda. Posso fazer a visita técnica na próxima semana. Qual dia seria melhor para você?",
    time: "14:38",
  },
  {
    id: "5",
    sender: "other",
    text: "Segunda ou terça-feira seriam ideais. Pela manhã, de preferência.",
    time: "14:40",
  },
];

const Chat = () => {
  const { projectId } = useParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: newMessage,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projetos" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
              alt="João Mendes"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-border"
            />
            <div>
              <h2 className="font-semibold text-foreground">João Mendes</h2>
              <p className="text-xs text-muted-foreground">Reforma Apartamento 120m²</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDealModal(true)}
            className="hidden sm:flex"
          >
            Fechar Negócio
          </Button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Phone className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Video className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Project Summary Bar */}
      <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Projeto:</span>
          <Link to={`/projeto/${projectId || "1"}`} className="font-medium text-primary hover:underline">
            Reforma Completa de Apartamento 120m²
          </Link>
          <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-medium">
            R$ 80.000,00
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDealModal(true)}
          className="sm:hidden"
        >
          Fechar Negócio
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-3 ${
                message.sender === "me"
                  ? "bg-gradient-hero text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
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
              Você deseja oficializar o serviço com <strong>João Mendes</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-xl p-4 my-4">
            <p className="text-sm text-muted-foreground mb-2">Projeto:</p>
            <p className="font-medium text-foreground">Reforma Completa de Apartamento 120m²</p>
            <p className="text-sm text-muted-foreground mt-2">Valor acordado:</p>
            <p className="text-2xl font-bold text-primary">R$ 80.000,00</p>
          </div>
          <p className="text-sm text-muted-foreground">
            A outra parte receberá uma notificação para confirmar o acordo. Após a confirmação de ambos, o projeto será marcado como "Em Andamento".
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDealModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => setShowDealModal(false)}>
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
