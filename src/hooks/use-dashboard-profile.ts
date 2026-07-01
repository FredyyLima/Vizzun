import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { apiPath } from "@/lib/api";
import { dataUrlToBlob, resizeImage, uploadFile } from "@/lib/upload";
import type { ProfessionalProfile } from "@/lib/dashboard-types";

type UseDashboardProfileArgs = {
  authUserId?: string;
  authUserRole?: string;
  ownerId: string;
};

export function useDashboardProfile({ authUserId, authUserRole, ownerId }: UseDashboardProfileArgs) {
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [profileServices, setProfileServices] = useState("");
  const [profileCities, setProfileCities] = useState("");
  const [profileBio, setProfileBio] = useState("");

  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authUserId || authUserRole !== "PROFESSIONAL") return;
    let active = true;
    fetch(apiPath(`/api/professionals/${authUserId}`))
      .then((response) => (response.ok ? response.json() : null))
      .then((profile: ProfessionalProfile | null) => {
        if (!active || !profile) return;
        setProfileAvatar(profile.avatar ?? "");
        setProfileSpecialty(profile.specialty ?? "");
        setProfileBio(profile.bio ?? "");
        setProfileServices((profile.services ?? []).join(", "));
        setProfileCities((profile.cities ?? []).join(", "));
      })
      .catch(() => {
        // sem perfil ainda cadastrado - formulario fica em branco, comportamento esperado
      });
    return () => {
      active = false;
    };
  }, [authUserId, authUserRole]);

  const handleSaveProfessionalProfile = async () => {
    if (!ownerId) return;
    const services = profileServices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const cities = profileCities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch(apiPath("/api/me/professional-profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          avatar: profileAvatar.trim() || null,
          specialty: profileSpecialty.trim() || null,
          bio: profileBio.trim() || null,
          services,
          cities,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.message ?? "Não foi possível salvar o perfil profissional.");
        return;
      }
      toast.success("Perfil profissional atualizado.");
    } catch (error) {
      console.error("Erro ao salvar perfil profissional:", error);
      toast.error("Não foi possível salvar o perfil profissional.");
    }
  };

  const handleProfileAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file, 500, 0.85);
      const url = await uploadFile(dataUrlToBlob(resized), file.name);
      setProfileAvatar(url);
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
      toast.error("Não foi possível carregar a foto.");
    } finally {
      event.target.value = "";
    }
  };

  return {
    profileAvatar,
    profileSpecialty,
    setProfileSpecialty,
    profileServices,
    setProfileServices,
    profileCities,
    setProfileCities,
    profileBio,
    setProfileBio,
    profileAvatarInputRef,
    handleSaveProfessionalProfile,
    handleProfileAvatarChange,
  };
}
