import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Profissionais from "./pages/Profissionais";
import Projetos from "./pages/Projetos";
import ProjetoDetalhe from "./pages/ProjetoDetalhe";
import ProfissionalDetalhe from "./pages/ProfissionalDetalhe";
import Chat from "./pages/Chat";
import ChatProfissional from "./pages/ChatProfissional";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import ComoFunciona from "./pages/ComoFunciona";
import NotFound from "./pages/NotFound";
import DashboardUsuario from "./pages/DashboardUsuario";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profissionais" element={<Profissionais />} />
          <Route path="/profissional/:id" element={<ProfissionalDetalhe />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/projeto/:id" element={<ProjetoDetalhe />} />
          <Route path="/chat/:projectId" element={<Chat />} />
          <Route path="/chat-profissional/:id" element={<ChatProfissional />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-usuario" element={<DashboardUsuario />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
