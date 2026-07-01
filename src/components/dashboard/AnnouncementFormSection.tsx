import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, X } from "lucide-react";
import { brazilStates, formatCurrency } from "@/lib/dashboard-formatters";
import type { useDashboardAnnouncements } from "@/hooks/use-dashboard-announcements";

type AnnouncementFormSectionProps = {
  announcementsState: ReturnType<typeof useDashboardAnnouncements>;
};

const AnnouncementFormSection = ({ announcementsState }: AnnouncementFormSectionProps) => {
  const {
    isViewingAnnouncement,
    isEditingAnnouncement,
    setIsEditingAnnouncement,
    hasAnnouncementChanges,
    handleSaveAnnouncement,
    titleValue,
    setTitleValue,
    categoryValue,
    setCategoryValue,
    descriptionValue,
    setDescriptionValue,
    budgetValue,
    setBudgetValue,
    cityValue,
    setCityValue,
    stateValue,
    setStateValue,
    deadlineValue,
    setDeadlineValue,
    formErrors,
    clearError,
    isFormDisabled,
    announcementAttachments,
    handleAnnouncementFilesChange,
    handleSelectPrimaryAttachment,
    handleRemoveAttachment,
    handleDragStartAttachment,
    handleDragOverAttachment,
    handleDropAttachment,
    handleDragEndAttachment,
    draggedAttachmentId,
    dragOverAttachmentId,
    handlePublish,
    handleConfirmPublish,
    showConfirmModal,
    setShowConfirmModal,
    missingOptional,
  } = announcementsState;

  const announcementFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isViewingAnnouncement ? "Detalhes do anúncio" : "Novo anúncio"}</CardTitle>
          <CardDescription>
            {isViewingAnnouncement
              ? "Confira as informações cadastradas para este anúncio."
              : "Preencha os dados principais do anúncio."}
          </CardDescription>
          {isViewingAnnouncement && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsEditingAnnouncement(true)}
                disabled={isEditingAnnouncement}
              >
                Editar anúncio
              </Button>
              {isEditingAnnouncement && hasAnnouncementChanges && (
                <Button variant="outline" onClick={handleSaveAnnouncement}>
                  Salvar alterações
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input
                placeholder="Ex: Reforma completa de apartamento"
                value={titleValue}
                disabled={isFormDisabled}
                onChange={(event) => {
                  setTitleValue(event.target.value);
                  clearError("title");
                }}
              />
              {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <Input
                placeholder="Ex: Reforma, Arquitetura, Marcenaria"
                value={categoryValue}
                disabled={isFormDisabled}
                onChange={(event) => {
                  setCategoryValue(event.target.value);
                  clearError("category");
                }}
              />
              {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Textarea
              placeholder="Descreva o que você precisa ou oferece..."
              className="min-h-[140px]"
              value={descriptionValue}
              disabled={isFormDisabled}
              onChange={(event) => {
                setDescriptionValue(event.target.value);
                clearError("description");
              }}
            />
            {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Orçamento</label>
              <Input
                value={budgetValue}
                disabled={isFormDisabled}
                onChange={(event) => setBudgetValue(formatCurrency(event.target.value))}
                placeholder="R$ 0,00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cidade</label>
              <Input
                placeholder="Digite a cidade"
                value={cityValue}
                disabled={isFormDisabled}
                onChange={(event) => {
                  setCityValue(event.target.value);
                  clearError("city");
                }}
              />
              {formErrors.city && <p className="text-sm text-destructive">{formErrors.city}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Estado</label>
              <Select
                value={stateValue}
                disabled={isFormDisabled}
                onValueChange={(value) => {
                  setStateValue(value);
                  clearError("state");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brazilStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.state && <p className="text-sm text-destructive">{formErrors.state}</p>}
            </div>
            <div className="space-y-2 sm:col-span-3 lg:col-span-1">
              <label className="text-sm font-medium text-foreground">Prazo</label>
              <Input
                placeholder="Ex: 30 dias"
                value={deadlineValue}
                disabled={isFormDisabled}
                onChange={(event) => setDeadlineValue(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Anexos</label>
            <Input
              ref={announcementFileInputRef}
              type="file"
              multiple
              disabled={isFormDisabled}
              onChange={handleAnnouncementFilesChange}
            />
            {announcementAttachments.length > 0 && (
              <div className="rounded-xl border border-dashed border-border p-3 bg-background/60">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {announcementAttachments.map((attachment) => {
                    const isImage = attachment.type.startsWith("image/");
                    const isVideo = attachment.type.startsWith("video/");
                    const isPrimary = attachment.isPrimary;
                    return (
                      <div
                        key={attachment.id}
                        role={isImage && !isFormDisabled ? "button" : undefined}
                        tabIndex={isImage && !isFormDisabled ? 0 : -1}
                        draggable={!isFormDisabled}
                        onDragStart={(event) => handleDragStartAttachment(event, attachment.id)}
                        onDragOver={(event) => handleDragOverAttachment(event, attachment.id)}
                        onDrop={(event) => handleDropAttachment(event, attachment.id)}
                        onDragEnd={handleDragEndAttachment}
                        onClick={() => {
                          if (!isImage || isFormDisabled) return;
                          handleSelectPrimaryAttachment(attachment.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            if (!isImage || isFormDisabled) return;
                            handleSelectPrimaryAttachment(attachment.id);
                          }
                        }}
                        className={`relative overflow-hidden rounded-lg border ${
                          isPrimary ? "border-primary" : "border-border"
                        } ${!isFormDisabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${
                          dragOverAttachmentId === attachment.id ? "ring-2 ring-primary/60" : ""
                        } group`}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveAttachment(attachment.id);
                          }}
                          disabled={isFormDisabled}
                          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
                          aria-label={`Remover ${attachment.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {isImage && attachment.url ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="h-28 w-full object-cover"
                            draggable={false}
                          />
                        ) : isVideo && attachment.url ? (
                          <video
                            src={attachment.url}
                            className="h-28 w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 h-28 bg-muted text-muted-foreground">
                            <FileText className="h-6 w-6" />
                            <span className="text-xs px-2 text-center line-clamp-2">{attachment.name}</span>
                          </div>
                        )}
                        {isImage && (!isFormDisabled || isPrimary) && (
                          <span
                            className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isPrimary ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground"
                            }`}
                          >
                            {isPrimary ? "Principal" : "Definir principal"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isViewingAnnouncement ? null : (
              <>
                <Button variant="secondary" onClick={handlePublish}>
                  Publicar anúncio
                </Button>
                <Button variant="outline">Salvar rascunho</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Campos em branco</DialogTitle>
            <DialogDescription className="text-base">
              {missingOptional.length === 2
                ? "Orçamento e prazo estão em branco."
                : `${missingOptional.join(" e ")} está em branco.`}{" "}
              Deseja prosseguir assim mesmo?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se continuar, essas informações serão cadastradas como "A Combinar".
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={handleConfirmPublish}>
              Prosseguir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouncementFormSection;
