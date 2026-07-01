import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { useDashboardProfile } from "@/hooks/use-dashboard-profile";

type ProfessionalProfileSectionProps = {
  profileState: ReturnType<typeof useDashboardProfile>;
  ownerDisplayName: string;
};

const ProfessionalProfileSection = ({ profileState, ownerDisplayName }: ProfessionalProfileSectionProps) => {
  const {
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
  } = profileState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Profissional</CardTitle>
        <CardDescription>Complete seu perfil para aparecer na lista de profissionais.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome de exibição</label>
            <Input value={ownerDisplayName} disabled />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Foto de perfil</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl overflow-hidden border border-border bg-muted">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Foto do perfil" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Upload da foto</p>
                  <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WEBP.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => profileAvatarInputRef.current?.click()}
                >
                  Selecionar arquivo
                </Button>
                <input
                  ref={profileAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileAvatarChange}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Profissão</label>
            <Input
              placeholder="Ex: Arquiteto, Engenheiro Civil"
              value={profileSpecialty}
              onChange={(event) => setProfileSpecialty(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cidades atendidas</label>
            <Input
              placeholder="Ex: São Paulo, SP, Campinas, SP"
              value={profileCities}
              onChange={(event) => setProfileCities(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Quem sou eu</label>
          <Textarea
            placeholder="Conte um pouco sobre você, sua experiência e diferencial."
            value={profileBio}
            onChange={(event) => setProfileBio(event.target.value)}
            className="min-h-[140px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Habilidades/serviços</label>
          <Textarea
            placeholder="Ex: Reforma, Arquitetura, Marcenaria"
            value={profileServices}
            onChange={(event) => setProfileServices(event.target.value)}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">Separe por vírgulas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleSaveProfessionalProfile}>
            Salvar perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalProfileSection;
