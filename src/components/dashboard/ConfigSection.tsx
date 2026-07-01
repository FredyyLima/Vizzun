import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCnpj } from "@/lib/dashboard-formatters";
import type { useDashboardConfig } from "@/hooks/use-dashboard-config";

type ConfigSectionProps = {
  configState: ReturnType<typeof useDashboardConfig>;
};

const ConfigSection = ({ configState }: ConfigSectionProps) => {
  const {
    configProfile,
    configLoading,
    configSaving,
    configBirthDate,
    setConfigBirthDate,
    configRg,
    setConfigRg,
    configPhone,
    setConfigPhone,
    configEmail,
    setConfigEmail,
    configCompanyName,
    setConfigCompanyName,
    configTradeName,
    setConfigTradeName,
    configContactName,
    setConfigContactName,
    configContactEmail,
    setConfigContactEmail,
    configContactPhone,
    setConfigContactPhone,
    configContactCpf,
    setConfigContactCpf,
    configContactRg,
    setConfigContactRg,
    configContactBirthDate,
    setConfigContactBirthDate,
    configServices,
    setConfigServices,
    configPassword,
    setConfigPassword,
    configPasswordConfirm,
    setConfigPasswordConfirm,
    configCnpjCardName,
    configHasCnpjCard,
    passwordCriteria,
    handleConfigCnpjCardChange,
    handleSaveConfig,
    handleCancelConfig,
  } = configState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Atualize seus dados cadastrais.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {configLoading ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <>
            {configProfile?.personType === "CNPJ" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">CNPJ</label>
                  <Input value={formatCnpj(configProfile?.cnpj ?? "")} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data de criação</label>
                  <Input type="date" value={configBirthDate} onChange={(e) => setConfigBirthDate(e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome completo</label>
                    <Input value={configProfile?.name ?? ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">CPF</label>
                    <Input value={configProfile?.cpf ?? ""} disabled />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Data de nascimento</label>
                    <Input
                      type="date"
                      value={configBirthDate}
                      onChange={(e) => setConfigBirthDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">RG</label>
                    <Input value={configRg} onChange={(e) => setConfigRg(e.target.value)} placeholder="00.000.000-0" />
                  </div>
                </div>
              </>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <Input value={configPhone} onChange={(e) => setConfigPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={configEmail} onChange={(e) => setConfigEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
            </div>

            {configProfile?.personType === "CNPJ" && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Razão Social</label>
                    <Input value={configCompanyName} onChange={(e) => setConfigCompanyName(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Deve ser igual ao cartão CNPJ.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome Fantasia (nome da conta)</label>
                    <Input value={configTradeName} onChange={(e) => setConfigTradeName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cartão CNPJ</label>
                  <Input type="file" accept=".pdf,image/*" onChange={handleConfigCnpjCardChange} />
                  <p className="text-xs text-muted-foreground">
                    {configCnpjCardName
                      ? `Arquivo: ${configCnpjCardName}`
                      : configHasCnpjCard
                        ? "Cartão CNPJ cadastrado. Envie um novo para atualizar."
                        : "Envie o cartão CNPJ (PDF ou imagem)."}
                  </p>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Responsável</label>
                      <Input value={configContactName} onChange={(e) => setConfigContactName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Telefone do responsável</label>
                      <Input value={configContactPhone} onChange={(e) => setConfigContactPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">CPF do responsável</label>
                      <Input value={configContactCpf} onChange={(e) => setConfigContactCpf(e.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">RG do responsável</label>
                      <Input value={configContactRg} onChange={(e) => setConfigContactRg(e.target.value)} placeholder="00.000.000-0" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Data de nascimento do responsável
                      </label>
                      <Input
                        type="date"
                        value={configContactBirthDate}
                        onChange={(e) => setConfigContactBirthDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email do responsável</label>
                      <Input
                        type="email"
                        value={configContactEmail}
                        onChange={(e) => setConfigContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {configProfile?.role === "PROFESSIONAL" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Serviços</label>
                <Textarea
                  value={configServices}
                  onChange={(e) => setConfigServices(e.target.value)}
                  placeholder="Ex: Reforma, Arquitetura, Marcenaria"
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">Separe por vírgulas.</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nova senha</label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={configPassword}
                  onChange={(e) => setConfigPassword(e.target.value)}
                />
                {configPassword.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs">
                    <p className={passwordCriteria.minLength ? "text-emerald-600" : "text-destructive"}>
                      {passwordCriteria.minLength ? "✓" : "✗"} Mínimo de 8 caracteres
                    </p>
                    <p className={passwordCriteria.hasLetter ? "text-emerald-600" : "text-destructive"}>
                      {passwordCriteria.hasLetter ? "✓" : "✗"} Pelo menos 1 letra
                    </p>
                    <p className={passwordCriteria.hasNumber ? "text-emerald-600" : "text-destructive"}>
                      {passwordCriteria.hasNumber ? "✓" : "✗"} Pelo menos 1 número
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                <Input
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={configPasswordConfirm}
                  onChange={(e) => setConfigPasswordConfirm(e.target.value)}
                />
                {(configPassword.length > 0 || configPasswordConfirm.length > 0) && (
                  <div className="mt-2 text-xs">
                    <p
                      className={
                        configPassword &&
                        configPasswordConfirm &&
                        configPassword === configPasswordConfirm
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    >
                      {configPassword &&
                      configPasswordConfirm &&
                      configPassword === configPasswordConfirm
                        ? "✓ Senhas iguais"
                        : "✗ Senhas diferentes"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleSaveConfig} disabled={configSaving}>
                {configSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button variant="outline" onClick={handleCancelConfig}>
                Cancelar
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome completo e CPF/CNPJ não podem ser alterados.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfigSection;
