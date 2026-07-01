import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPath } from "@/lib/api";
import SeoHead from "@/components/SeoHead";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const EsqueciSenha = () => {
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      const response = await fetch(apiPath("/api/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(result?.message ?? "Nao foi possivel processar a solicitacao.");
        return;
      }

      setSubmittedMessage(result?.message ?? "Se este email estiver cadastrado, voce recebera instrucoes para redefinir a senha.");
      setDevResetUrl(result?.resetUrl ?? null);
    } catch (error) {
      toast.error("Nao foi possivel conectar ao servidor.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title="Recuperar senha" description="Solicite a redefinição da sua senha na Vizzun." />
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Esqueceu a senha?</h1>
              <p className="text-muted-foreground">
                Informe seu email e enviaremos instruções para redefinir sua senha.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
              {submittedMessage ? (
                <div className="space-y-4 text-center">
                  <p className="text-foreground">{submittedMessage}</p>
                  {devResetUrl && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm">
                      <p className="font-medium text-amber-800 mb-1">
                        Modo de desenvolvimento: envio de email ainda não configurado.
                      </p>
                      <p className="text-amber-700 mb-2">Use o link abaixo para redefinir a senha:</p>
                      <Link to={devResetUrl.replace(window.location.origin, "")} className="text-primary underline break-all">
                        {devResetUrl}
                      </Link>
                    </div>
                  )}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Voltar para o login
                  </Link>
                </div>
              ) : (
                <Form {...form}>
                  <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input {...field} type="email" placeholder="seu@email.com" className="pl-10 h-12" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                      Enviar instruções
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              )}
            </div>

            <p className="text-center mt-6 text-muted-foreground">
              Lembrou a senha?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EsqueciSenha;
