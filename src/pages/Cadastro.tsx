import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
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
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isStrongPassword, isValidCNPJ, isValidCPF, isValidPhone } from "@/lib/validators";

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

const isValidDate = (value?: string) => {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
};

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];
  if (digits.length <= 2) return parts[0];
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
};

const cadastroSchema = z
  .object({
    role: z.enum(["client", "professional"]),
    personType: z.enum(["cpf", "cnpj"]).optional(),
    name: z.string().trim().optional(),
    birthDate: z.string().optional(),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email inválido.").optional(),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    cnpj: z.string().optional(),
    companyName: z.string().optional(),
    tradeName: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email("Email inválido.").optional(),
    contactPhone: z.string().optional(),
    contactCpf: z.string().optional(),
    contactRg: z.string().optional(),
    contactBirthDate: z.string().optional(),
    cnpjCard: z.string().optional(),
    services: z.array(z.string()).optional(),
    terms: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const isClient = data.role === "client";
    const isProfessional = data.role === "professional";
    const isCnpj = isProfessional && data.personType === "cnpj";

    const requireField = (condition: boolean, field: keyof typeof data, message: string) => {
      if (condition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message,
        });
      }
    };

    if (isClient) {
      requireField(!data.name?.trim(), "name", "Informe o nome completo.");
      requireField(!data.birthDate || !isValidDate(data.birthDate), "birthDate", "Informe uma data válida.");
      requireField(!data.cpf, "cpf", "Informe o CPF.");
      if (data.cpf && !isValidCPF(data.cpf)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "CPF inválido." });
      }
      requireField(!data.rg?.trim(), "rg", "Informe o RG.");
      requireField(!data.phone, "phone", "Informe o telefone.");
      if (data.phone && !isValidPhone(data.phone)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Telefone inválido." });
      }
      requireField(!data.email, "email", "Informe o email.");
    }

    if (isProfessional) {
      requireField(!data.personType, "personType", "Selecione CPF ou CNPJ.");
      if (!data.services || data.services.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["services"],
          message: "Selecione ao menos um serviço.",
        });
      }

      if (isCnpj) {
        requireField(!data.cnpj, "cnpj", "Informe o CNPJ.");
        if (data.cnpj && !isValidCNPJ(data.cnpj)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cnpj"], message: "CNPJ inválido." });
        }
        requireField(!data.birthDate || !isValidDate(data.birthDate), "birthDate", "Informe a data de criação.");
        requireField(!data.companyName?.trim(), "companyName", "Informe a razão social.");
        requireField(!data.tradeName?.trim(), "tradeName", "Informe o nome fantasia.");
        requireField(!data.cnpjCard, "cnpjCard", "Envie o cartão CNPJ.");
        requireField(!data.contactName?.trim(), "contactName", "Informe o responsável.");
        requireField(!data.contactEmail, "contactEmail", "Informe o email do responsável.");
        requireField(!data.contactPhone, "contactPhone", "Informe o telefone do responsável.");
        requireField(!data.contactCpf, "contactCpf", "Informe o CPF do responsável.");
        if (data.contactCpf && !isValidCPF(data.contactCpf)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactCpf"], message: "CPF inválido." });
        }
        requireField(!data.contactRg?.trim(), "contactRg", "Informe o RG do responsável.");
        requireField(
          !data.contactBirthDate || !isValidDate(data.contactBirthDate),
          "contactBirthDate",
          "Informe a data de nascimento do responsável.",
        );
        if (data.contactPhone && !isValidPhone(data.contactPhone)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["contactPhone"],
            message: "Telefone inválido.",
          });
        }
      } else {
        requireField(!data.name?.trim(), "name", "Informe o nome completo.");
        requireField(!data.birthDate || !isValidDate(data.birthDate), "birthDate", "Informe uma data válida.");
        requireField(!data.cpf, "cpf", "Informe o CPF.");
        if (data.cpf && !isValidCPF(data.cpf)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "CPF inválido." });
        }
        requireField(!data.rg?.trim(), "rg", "Informe o RG.");
        requireField(!data.phone, "phone", "Informe o telefone.");
        if (data.phone && !isValidPhone(data.phone)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Telefone inválido." });
        }
        requireField(!data.email, "email", "Informe o email.");
      }
    }

    if (!isStrongPassword(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "A senha deve ter letras e números.",
      });
    }

    if (!data.terms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["terms"],
        message: "Você precisa aceitar os termos.",
      });
    }
  });

type CadastroFormValues = z.infer<typeof cadastroSchema>;

const Cadastro = () => {
  const form = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      role: "client",
      personType: "cpf",
      services: [],
      terms: false,
    },
    mode: "onBlur",
  });

  const role = form.watch("role");
  const personType = form.watch("personType");
  const isPJ = personType === "cnpj";
  const selectedServices = form.watch("services") ?? [];
  const [cnpjCardName, setCnpjCardName] = useState("");
  const passwordValue = form.watch("password") ?? "";
  const passwordChecks = {
    minLength: passwordValue.length >= 8,
    hasLetter: /[A-Za-z]/.test(passwordValue),
    hasNumber: /\d/.test(passwordValue),
  };

  const tabsValue = useMemo(() => (role === "client" ? "cliente" : "profissional"), [role]);

  const handleTabChange = (value: string) => {
    const nextRole = value === "cliente" ? "client" : "professional";
    form.setValue("role", nextRole);
    if (nextRole === "client") {
      form.setValue("personType", "cpf");
    } else if (!form.getValues("personType")) {
      form.setValue("personType", "cpf");
    }
    form.clearErrors();
  };

  const toggleService = (service: string) => {
    const current = form.getValues("services") ?? [];
    if (current.includes(service)) {
      form.setValue(
        "services",
        current.filter((item) => item !== service),
        { shouldValidate: true },
      );
    } else {
      form.setValue("services", [...current, service], { shouldValidate: true });
    }
  };

  const onSubmit = async (values: CadastroFormValues) => {
    const isProfessional = values.role === "professional";
    const isCnpj = isProfessional && values.personType === "cnpj";

    const payload = {
      role: values.role,
      personType: isProfessional ? values.personType : "cpf",
      name: !isCnpj ? values.name : undefined,
      birthDate: values.birthDate,
      cpf: !isCnpj ? values.cpf : undefined,
      rg: !isCnpj ? values.rg : undefined,
      email: isCnpj ? values.contactEmail : values.email,
      phone: isCnpj ? values.contactPhone : values.phone,
      password: values.password,
      cnpj: isCnpj ? values.cnpj : undefined,
      companyName: isCnpj ? values.companyName : undefined,
      tradeName: isCnpj ? values.tradeName : undefined,
      contactName: isCnpj ? values.contactName : undefined,
      contactEmail: isCnpj ? values.contactEmail : undefined,
      contactPhone: isCnpj ? values.contactPhone : undefined,
      contactCpf: isCnpj ? values.contactCpf : undefined,
      contactRg: isCnpj ? values.contactRg : undefined,
      contactBirthDate: isCnpj ? values.contactBirthDate : undefined,
      cnpjCard: isCnpj ? values.cnpjCard : undefined,
      services: isProfessional ? values.services ?? [] : [],
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (result?.field) {
          form.setError(result.field as keyof CadastroFormValues, { message: result.message });
        }
        if (result?.errors?.fieldErrors) {
          Object.entries(result.errors.fieldErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : undefined;
            if (message) {
              form.setError(field as keyof CadastroFormValues, { message });
            }
          });
        }

        toast.error(result?.message ?? "Não foi possível realizar o cadastro.");
        return;
      }

      toast.success("Cadastro realizado com sucesso!");
      form.reset({
        role: "client",
        personType: "cpf",
        services: [],
        terms: false,
      });
      setCnpjCardName("");
    } catch (error) {
      toast.error("Não foi possível conectar ao servidor.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Criar sua conta</h1>
              <p className="text-lg text-muted-foreground">Junte-se à maior rede de profissionais da construção civil</p>
            </div>

            <Form {...form}>
              <Tabs value={tabsValue} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 mb-8">
                  <TabsTrigger value="cliente" className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <User className="h-4 w-4 mr-2" />
                    Sou Cliente
                  </TabsTrigger>
                  <TabsTrigger
                    value="profissional"
                    className="text-base data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Sou Profissional
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <input type="hidden" {...form.register("role")} />
                  <input type="hidden" {...form.register("personType")} />
                  <TabsContent value="cliente">
                    <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 space-y-6">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full h-12 justify-center gap-3" type="button">
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Continuar com Google
                        </Button>
                        <Button variant="outline" className="w-full h-12 justify-center gap-3" type="button">
                          <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Continuar com Facebook
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-card px-4 text-muted-foreground">ou cadastre-se com email</span>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome completo</FormLabel>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input {...field} placeholder="Seu nome" className="pl-10 h-12" />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de nascimento</FormLabel>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input {...field} type="date" className="pl-10 h-12" />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input {...field} placeholder="000.000.000-00" className="pl-10 h-12" />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="rg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RG</FormLabel>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input {...field} placeholder="00.000.000-0" className="pl-10 h-12" />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input {...field} placeholder="(00) 00000-0000" className="pl-10 h-12" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                            <FormLabel>Senha</FormLabel>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input {...field} type="password" placeholder="Mínimo 8 caracteres" className="pl-10 h-12" />
                              </FormControl>
                            </div>
                            <div className="mt-2 space-y-1 text-xs">
                              <p className={passwordChecks.minLength ? "text-emerald-600" : "text-destructive"}>
                                {passwordChecks.minLength ? "✓" : "✗"} Mínimo de 8 caracteres
                              </p>
                              <p className={passwordChecks.hasLetter ? "text-emerald-600" : "text-destructive"}>
                                {passwordChecks.hasLetter ? "✓" : "✗"} Pelo menos 1 letra
                              </p>
                              <p className={passwordChecks.hasNumber ? "text-emerald-600" : "text-destructive"}>
                                {passwordChecks.hasNumber ? "✓" : "✗"} Pelo menos 1 número
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm text-muted-foreground">
                                Li e aceito os{" "}
                                <a href="#" className="text-primary hover:underline">
                                  Termos de Uso
                                </a>{" "}
                                e{" "}
                                <a href="#" className="text-primary hover:underline">
                                  Política de Privacidade
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                        Criar conta de Cliente
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="profissional">
                    <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 space-y-6">
                      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-xl">
                        <span className={`text-sm font-medium ${!isPJ ? "text-foreground" : "text-muted-foreground"}`}>
                          Pessoa Física
                        </span>
                        <Switch
                          checked={isPJ}
                          onCheckedChange={(checked) => {
                            form.setValue("personType", checked ? "cnpj" : "cpf");
                            form.clearErrors();
                          }}
                        />
                        <span className={`text-sm font-medium ${isPJ ? "text-foreground" : "text-muted-foreground"}`}>
                          Pessoa Jurídica
                        </span>
                      </div>

                      {isPJ ? (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="cnpj"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CNPJ</FormLabel>
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="00.000.000/0000-00"
                                          className="pl-10 h-12"
                                          onChange={(event) => field.onChange(formatCnpj(event.target.value))}
                                        />
                                      </FormControl>
                                    </div>
                                    <Button variant="outline" type="button" className="h-12">
                                      <Search className="h-4 w-4 mr-2" />
                                      Buscar
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="birthDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de criação</FormLabel>
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input {...field} type="date" className="pl-10 h-12" />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Razão Social</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Razão Social da empresa" className="h-12" />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Deve ser igual ao cartão CNPJ.</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="cnpjCard"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cartão CNPJ</FormLabel>
                                <FormControl>
                                  <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="h-12"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (!file) {
                                        setCnpjCardName("");
                                        field.onChange("");
                                        return;
                                      }
                                      setCnpjCardName(file.name);
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        field.onChange(String(reader.result ?? ""));
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </FormControl>
                                {cnpjCardName ? (
                                  <p className="text-xs text-muted-foreground">Arquivo: {cnpjCardName}</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Envie o cartão CNPJ (PDF ou imagem).</p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tradeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Fantasia</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nome Fantasia" className="h-12" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="border-t border-border pt-5">
                            <h3 className="font-semibold text-foreground mb-4">Dados do Responsável</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="contactName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome do responsável</FormLabel>
                                    <div className="relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input {...field} placeholder="Nome completo" className="pl-10 h-12" />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <div className="relative">
                                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input {...field} placeholder="(00) 00000-0000" className="pl-10 h-12" />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                              <FormField
                                control={form.control}
                                name="contactCpf"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CPF do responsável</FormLabel>
                                    <div className="relative">
                                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input {...field} placeholder="000.000.000-00" className="pl-10 h-12" />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="contactRg"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>RG do responsável</FormLabel>
                                    <div className="relative">
                                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input {...field} placeholder="00.000.000-0" className="pl-10 h-12" />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                              <FormField
                                control={form.control}
                                name="contactBirthDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data de nascimento do responsável</FormLabel>
                                    <div className="relative">
                                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input {...field} type="date" className="pl-10 h-12" />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <FormControl>
                                        <Input {...field} type="email" placeholder="responsavel@empresa.com" className="pl-10 h-12" />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome completo</FormLabel>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input {...field} placeholder="Seu nome" className="pl-10 h-12" />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="birthDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de nascimento</FormLabel>
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input {...field} type="date" className="pl-10 h-12" />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="cpf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CPF</FormLabel>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input {...field} placeholder="000.000.000-00" className="pl-10 h-12" />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="rg"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>RG</FormLabel>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input {...field} placeholder="00.000.000-0" className="pl-10 h-12" />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <FormControl>
                                    <Input {...field} placeholder="(00) 00000-0000" className="pl-10 h-12" />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="services"
                        render={() => (
                          <FormItem className="border-t border-border pt-5">
                            <FormLabel className="mb-3 block">Quais serviços você presta?</FormLabel>
                            <FormControl>
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
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input {...field} type="password" placeholder="Mínimo 8 caracteres" className="pl-10 h-12" />
                              </FormControl>
                            </div>
                            <div className="mt-2 space-y-1 text-xs">
                              <p className={passwordChecks.minLength ? "text-emerald-600" : "text-destructive"}>
                                {passwordChecks.minLength ? "✓" : "✗"} Mínimo de 8 caracteres
                              </p>
                              <p className={passwordChecks.hasLetter ? "text-emerald-600" : "text-destructive"}>
                                {passwordChecks.hasLetter ? "✓" : "✗"} Pelo menos 1 letra
                              </p>
                              <p className={passwordChecks.hasNumber ? "text-emerald-600" : "text-destructive"}>
                                {passwordChecks.hasNumber ? "✓" : "✗"} Pelo menos 1 número
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm text-muted-foreground">
                                Li e aceito os{" "}
                                <a href="#" className="text-primary hover:underline">
                                  Termos de Uso
                                </a>{" "}
                                e{" "}
                                <a href="#" className="text-primary hover:underline">
                                  Política de Privacidade
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button variant="secondary" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                        Criar conta de Profissional
                      </Button>
                    </div>
                  </TabsContent>
                </form>
              </Tabs>
            </Form>

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
