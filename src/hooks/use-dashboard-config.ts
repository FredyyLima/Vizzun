import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { apiPath } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import type { UserProfile } from "@/lib/dashboard-types";

type UseDashboardConfigArgs = {
  authUserId?: string;
  refreshAuth: () => Promise<void>;
};

export function useDashboardConfig({ authUserId, refreshAuth }: UseDashboardConfigArgs) {
  const [configProfile, setConfigProfile] = useState<UserProfile | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configBirthDate, setConfigBirthDate] = useState("");
  const [configRg, setConfigRg] = useState("");
  const [configPhone, setConfigPhone] = useState("");
  const [configEmail, setConfigEmail] = useState("");
  const [configCompanyName, setConfigCompanyName] = useState("");
  const [configTradeName, setConfigTradeName] = useState("");
  const [configContactName, setConfigContactName] = useState("");
  const [configContactEmail, setConfigContactEmail] = useState("");
  const [configContactPhone, setConfigContactPhone] = useState("");
  const [configContactCpf, setConfigContactCpf] = useState("");
  const [configContactRg, setConfigContactRg] = useState("");
  const [configContactBirthDate, setConfigContactBirthDate] = useState("");
  const [configServices, setConfigServices] = useState("");
  const [configPassword, setConfigPassword] = useState("");
  const [configPasswordConfirm, setConfigPasswordConfirm] = useState("");
  const [configCnpjCard, setConfigCnpjCard] = useState("");
  const [configCnpjCardName, setConfigCnpjCardName] = useState("");
  const [configHasCnpjCard, setConfigHasCnpjCard] = useState(false);

  const passwordCriteria = {
    minLength: configPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(configPassword),
    hasNumber: /\d/.test(configPassword),
  };

  useEffect(() => {
    if (!authUserId) return;
    const loadProfile = async () => {
      setConfigLoading(true);
      try {
        const response = await fetch(apiPath("/api/me"), { credentials: "include" });
        if (!response.ok) {
          throw new Error("Falha ao carregar dados do usuário.");
        }
        const data = (await response.json()) as UserProfile;
        setConfigProfile(data);
        setConfigBirthDate(data.birthDate ? new Date(data.birthDate).toISOString().slice(0, 10) : "");
        setConfigRg(data.rg ?? "");
        setConfigPhone(data.phone ?? "");
        setConfigEmail(data.email ?? "");
        setConfigCompanyName(data.companyName ?? "");
        setConfigTradeName(data.tradeName ?? "");
        setConfigContactName(data.contactName ?? "");
        setConfigContactEmail(data.contactEmail ?? "");
        setConfigContactPhone(data.contactPhone ?? "");
        setConfigContactCpf(data.contactCpf ?? "");
        setConfigContactRg(data.contactRg ?? "");
        setConfigContactBirthDate(
          data.contactBirthDate ? new Date(data.contactBirthDate).toISOString().slice(0, 10) : "",
        );
        setConfigServices((data.services ?? []).join(", "));
        setConfigHasCnpjCard(Boolean(data.hasCnpjCard));
      } catch (error) {
        toast.error("Não foi possível carregar os dados de cadastro.");
      } finally {
        setConfigLoading(false);
      }
    };
    loadProfile();
  }, [authUserId]);

  const handleConfigCnpjCardChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setConfigCnpjCard("");
      setConfigCnpjCardName("");
      return;
    }
    try {
      const url = await uploadFile(file, file.name);
      setConfigCnpjCard(url);
      setConfigCnpjCardName(file.name);
    } catch (error) {
      console.error("Erro ao enviar cartao CNPJ:", error);
      toast.error("Não foi possível enviar o cartão CNPJ.");
      event.target.value = "";
    }
  };

  const handleSaveConfig = async () => {
    if (!authUserId || !configProfile) return;
    if (configPassword && configPassword !== configPasswordConfirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (
      configProfile.personType === "CNPJ" &&
      configCompanyName.trim() !== (configProfile.companyName ?? "") &&
      !configCnpjCard
    ) {
      toast.error("Envie o cartão CNPJ para atualizar a razão social.");
      return;
    }

    const services = configServices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      birthDate: configBirthDate || undefined,
      rg: configRg || undefined,
      phone: configPhone || undefined,
      email: configEmail || undefined,
      companyName: configCompanyName || undefined,
      tradeName: configTradeName || undefined,
      contactName: configContactName || undefined,
      contactEmail: configContactEmail || undefined,
      contactPhone: configContactPhone || undefined,
      contactCpf: configContactCpf || undefined,
      contactRg: configContactRg || undefined,
      contactBirthDate: configContactBirthDate || undefined,
      services,
      password: configPassword || undefined,
      cnpjCard: configCnpjCard || undefined,
    };

    setConfigSaving(true);
    try {
      const response = await fetch(apiPath("/api/me"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.message ?? "Não foi possível salvar as alterações.");
        return;
      }
      setConfigProfile(result);
      setConfigHasCnpjCard(Boolean(result?.hasCnpjCard));
      setConfigPassword("");
      setConfigPasswordConfirm("");
      setConfigCnpjCard("");
      setConfigCnpjCardName("");
      await refreshAuth();
      toast.success("Dados atualizados com sucesso.");
    } catch (error) {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleCancelConfig = () => {
    if (!configProfile) return;
    setConfigBirthDate(configProfile.birthDate ? new Date(configProfile.birthDate).toISOString().slice(0, 10) : "");
    setConfigRg(configProfile.rg ?? "");
    setConfigPhone(configProfile.phone ?? "");
    setConfigEmail(configProfile.email ?? "");
    setConfigCompanyName(configProfile.companyName ?? "");
    setConfigTradeName(configProfile.tradeName ?? "");
    setConfigContactName(configProfile.contactName ?? "");
    setConfigContactEmail(configProfile.contactEmail ?? "");
    setConfigContactPhone(configProfile.contactPhone ?? "");
    setConfigContactCpf(configProfile.contactCpf ?? "");
    setConfigContactRg(configProfile.contactRg ?? "");
    setConfigContactBirthDate(
      configProfile.contactBirthDate ? new Date(configProfile.contactBirthDate).toISOString().slice(0, 10) : "",
    );
    setConfigServices((configProfile.services ?? []).join(", "));
    setConfigPassword("");
    setConfigPasswordConfirm("");
    setConfigCnpjCard("");
    setConfigCnpjCardName("");
  };

  return {
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
  };
}
