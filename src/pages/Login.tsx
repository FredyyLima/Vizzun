import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPath } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import SeoHead from "@/components/SeoHead";

const loginSchema = z.object({
  email: z.string().email("Email invalido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const response = await fetch(apiPath("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (result?.errors?.fieldErrors) {
          Object.entries(result.errors.fieldErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : undefined;
            if (message) {
              form.setError(field as keyof LoginValues, { message });
            }
          });
        }
        toast.error(result?.message ?? "Nao foi possivel entrar.");
        return;
      }

      await refresh();
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard-usuario");
    } catch (error) {
      toast.error("Nao foi possivel conectar ao servidor.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title="Entrar" description="Acesse sua conta na Vizzun." />
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h1>
              <p className="text-muted-foreground">Entre na sua conta para continuar</p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
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

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Senha</FormLabel>
                          <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
                            Esqueceu a senha?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input {...field} type="password" placeholder="Sua senha" className="pl-10 h-12" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>

            <p className="text-center mt-6 text-muted-foreground">
              Nao tem uma conta?{" "}
              <Link to="/cadastro" className="text-primary font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
