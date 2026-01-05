import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Calendar,
  CreditCard,
  Building2,
  Search,
} from "lucide-react";
import { useState } from "react";

const services = [
  "Construção Civil",
  "Arquitetura",
  "Marcenaria",
  "Reformas",
  "Paisagismo",
  "Acabamentos",
  "Design de Interiores",
  "Instalações Elétricas",
  "Instalações Hidráulicas",
];

const Cadastro = () => {
  const [isPJ, setIsPJ] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Criar sua conta
              </h1>
              <p className="text-lg text-muted-foreground">
                Junte-se à maior rede de profissionais da construção civil
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 mb-8">
                <TabsTrigger value="cliente" className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Sou Cliente
                </TabsTrigger>
                <TabsTrigger value="profissional" className="text-base data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Sou Profissional
                </TabsTrigger>
              </TabsList>

              {/* Cliente Form */}
              <TabsContent value="cliente">
                <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
                  {/* Social Login */}
                  <div className="space-y-3 mb-6">
                    <Button variant="outline" className="w-full h-12 justify-center gap-3">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continuar com Google
                    </Button>
                    <Button variant="outline" className="w-full h-12 justify-center gap-3">
                      <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Continuar com Facebook
                    </Button>
                  </div>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-card px-4 text-muted-foreground">ou cadastre-se com email</span>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <form className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="nome" placeholder="Seu nome" className="pl-10 h-12" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataNasc">Data de nascimento</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="dataNasc" type="date" className="pl-10 h-12" />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="cpf" placeholder="000.000.000-00" className="pl-10 h-12" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="rg" placeholder="00.000.000-0" className="pl-10 h-12" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="telefone" placeholder="(00) 00000-0000" className="pl-10 h-12" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="seu@email.com" className="pl-10 h-12" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="senha" type="password" placeholder="Mínimo 8 caracteres" className="pl-10 h-12" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="termos" />
                      <label htmlFor="termos" className="text-sm text-muted-foreground">
                        Li e aceito os{" "}
                        <a href="#" className="text-primary hover:underline">
                          Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="#" className="text-primary hover:underline">
                          Política de Privacidade
                        </a>
                      </label>
                    </div>

                    <Button variant="hero" size="lg" className="w-full">
                      Criar conta de Cliente
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* Profissional Form */}
              <TabsContent value="profissional">
                <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
                  {/* PF/PJ Toggle */}
                  <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-xl mb-8">
                    <span className={`text-sm font-medium ${!isPJ ? "text-foreground" : "text-muted-foreground"}`}>
                      Pessoa Física
                    </span>
                    <Switch checked={isPJ} onCheckedChange={setIsPJ} />
                    <span className={`text-sm font-medium ${isPJ ? "text-foreground" : "text-muted-foreground"}`}>
                      Pessoa Jurídica
                    </span>
                  </div>

                  <form className="space-y-5">
                    {isPJ ? (
                      <>
                        {/* PJ Fields */}
                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="cnpj" placeholder="00.000.000/0000-00" className="pl-10 h-12" />
                            </div>
                            <Button variant="outline" type="button" className="h-12">
                              <Search className="h-4 w-4 mr-2" />
                              Buscar
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="razaoSocial">Razão Social</Label>
                          <Input id="razaoSocial" placeholder="Razão Social da empresa" className="h-12" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                          <Input id="nomeFantasia" placeholder="Nome Fantasia" className="h-12" />
                        </div>

                        <div className="border-t border-border pt-5 mt-5">
                          <h3 className="font-semibold text-foreground mb-4">Dados do Responsável</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nomeResp">Nome do responsável</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="nomeResp" placeholder="Nome completo" className="pl-10 h-12" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="telResp">Telefone</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="telResp" placeholder="(00) 00000-0000" className="pl-10 h-12" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="emailResp">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="emailResp" type="email" placeholder="responsavel@empresa.com" className="pl-10 h-12" />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* PF Fields */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomePF">Nome completo</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="nomePF" placeholder="Seu nome" className="pl-10 h-12" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dataNascPF">Data de nascimento</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="dataNascPF" type="date" className="pl-10 h-12" />
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cpfPF">CPF</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="cpfPF" placeholder="000.000.000-00" className="pl-10 h-12" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rgPF">RG</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="rgPF" placeholder="00.000.000-0" className="pl-10 h-12" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefonePF">Telefone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="telefonePF" placeholder="(00) 00000-0000" className="pl-10 h-12" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emailPF">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="emailPF" type="email" placeholder="seu@email.com" className="pl-10 h-12" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Services Multi-select */}
                    <div className="border-t border-border pt-5 mt-5">
                      <Label className="mb-3 block">Quais serviços você presta?</Label>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => (
                          <button
                            key={service}
                            type="button"
                            onClick={() => toggleService(service)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedServices.includes(service)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {service}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senhaPro">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="senhaPro" type="password" placeholder="Mínimo 8 caracteres" className="pl-10 h-12" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="termosPro" />
                      <label htmlFor="termosPro" className="text-sm text-muted-foreground">
                        Li e aceito os{" "}
                        <a href="#" className="text-primary hover:underline">
                          Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="#" className="text-primary hover:underline">
                          Política de Privacidade
                        </a>
                      </label>
                    </div>

                    <Button variant="secondary" size="lg" className="w-full">
                      Criar conta de Profissional
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>

            {/* Login Link */}
            <p className="text-center mt-6 text-muted-foreground">
              Já tem uma conta?{" "}
              <a href="/login" className="text-primary font-medium hover:underline">
                Faça login
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cadastro;
