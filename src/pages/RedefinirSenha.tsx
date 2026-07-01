import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPath } from "@/lib/api";
import SeoHead from "@/components/SeoHead";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, "A senha deve ter letras e numeros."),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas nao conferem.",
    path: ["passwordConfirm"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", passwordConfirm: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      const response = await fetch(apiPath("/api/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(result?.message ?? "Nao foi possivel redefinir a senha.");
        return;
      }

      toast.success("Senha redefinida com sucesso! Faça login com a nova senha.");
      navigate("/login");
    } catch (error) {
      toast.error("Nao foi possivel conectar ao servidor.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SeoHead title="Redefinir senha" description="Defina uma nova senha para sua conta na Vizzun." />
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Link inválido</h1>
            <p className="text-muted-foreground">
              Este link de redefinição de senha é inválido. Solicite um novo link.
            </p>
            <Link to="/esqueci-senha" className="text-primary font-medium hover:underline">
              Solicitar novo link
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title="Redefinir senha" description="Defina uma nova senha para sua conta na Vizzun." />
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Redefinir senha</h1>
              <p className="text-muted-foreground">Escolha uma nova senha para sua conta.</p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
              <Form {...form}>
                <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input {...field} type="password" placeholder="Mínimo 8 caracteres" className="pl-10 h-12" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nova senha</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input {...field} type="password" placeholder="Confirme a nova senha" className="pl-10 h-12" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    Redefinir senha
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RedefinirSenha;
