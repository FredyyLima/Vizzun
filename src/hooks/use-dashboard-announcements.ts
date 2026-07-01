import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { apiPath } from "@/lib/api";
import { dataUrlToBlob, resizeImage, uploadFile } from "@/lib/upload";
import { formatCurrency } from "@/lib/dashboard-formatters";
import type { Announcement, AnnouncementAttachment, SectionKey } from "@/lib/dashboard-types";

const normalizeAttachments = (items: AnnouncementAttachment[], primaryId?: string | null) => {
  const next = items.map((item) => ({ ...item }));
  if (primaryId) {
    return next.map((item) => ({
      ...item,
      isPrimary: item.id === primaryId,
    }));
  }
  const existingPrimary = next.find((item) => item.isPrimary && item.type.startsWith("image/"));
  if (existingPrimary) {
    return next.map((item) => ({
      ...item,
      isPrimary: item.id === existingPrimary.id,
    }));
  }
  const firstImageIndex = next.findIndex((item) => item.type.startsWith("image/"));
  if (firstImageIndex >= 0) {
    return next.map((item, index) => ({
      ...item,
      isPrimary: index === firstImageIndex,
    }));
  }
  return next.map((item) => ({ ...item, isPrimary: false }));
};

const moveAttachment = (items: AnnouncementAttachment[], fromId: string, toId: string) => {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

type UseDashboardAnnouncementsArgs = {
  authUserId?: string;
  ownerId: string;
  setActiveSection: (section: SectionKey) => void;
};

export function useDashboardAnnouncements({ authUserId, ownerId, setActiveSection }: UseDashboardAnnouncementsArgs) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [titleValue, setTitleValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [budgetValue, setBudgetValue] = useState("");
  const [deadlineValue, setDeadlineValue] = useState("");
  const [cityValue, setCityValue] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [announcementAttachments, setAnnouncementAttachments] = useState<AnnouncementAttachment[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missingOptional, setMissingOptional] = useState<string[]>([]);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [originalAnnouncement, setOriginalAnnouncement] = useState<Announcement | null>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [draggedAttachmentId, setDraggedAttachmentId] = useState<string | null>(null);
  const [dragOverAttachmentId, setDragOverAttachmentId] = useState<string | null>(null);

  const isViewingAnnouncement = selectedAnnouncementId !== null;
  const isFormDisabled = isViewingAnnouncement && !isEditingAnnouncement;
  const normalizedBudget = budgetValue.trim() ? budgetValue.trim() : "A Combinar";
  const normalizedDeadline = deadlineValue.trim() ? deadlineValue.trim() : "A Combinar";

  useEffect(() => {
    if (!authUserId) {
      setAnnouncements([]);
      return;
    }
    let active = true;
    fetch(apiPath("/api/announcements/me"), { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => {
        if (active) setAnnouncements(items as Announcement[]);
      })
      .catch(() => {
        if (active) setAnnouncements([]);
      });
    return () => {
      active = false;
    };
  }, [authUserId]);

  const userAnnouncements = useMemo(
    () => announcements.filter((item) => item.ownerId === ownerId),
    [announcements, ownerId],
  );

  const hasAnnouncementChanges = useMemo(() => {
    if (!originalAnnouncement) return false;
    const originalAttachments = originalAnnouncement.attachments ?? [];
    const attachmentsChanged =
      JSON.stringify(originalAttachments) !== JSON.stringify(announcementAttachments);
    return (
      titleValue.trim() !== (originalAnnouncement.title ?? "") ||
      categoryValue.trim() !== (originalAnnouncement.category ?? "") ||
      descriptionValue.trim() !== (originalAnnouncement.description ?? "") ||
      cityValue.trim() !== (originalAnnouncement.city ?? "") ||
      stateValue.trim() !== (originalAnnouncement.state ?? "") ||
      normalizedBudget !== (originalAnnouncement.budget ?? "A Combinar") ||
      normalizedDeadline !== (originalAnnouncement.deadline ?? "A Combinar") ||
      attachmentsChanged
    );
  }, [
    originalAnnouncement,
    titleValue,
    categoryValue,
    descriptionValue,
    cityValue,
    stateValue,
    normalizedBudget,
    normalizedDeadline,
    announcementAttachments,
  ]);

  const getPrimaryImageUrl = (fallback?: string | null) => {
    const primary =
      announcementAttachments.find((item) => item.isPrimary && item.type.startsWith("image/")) ??
      announcementAttachments.find((item) => item.type.startsWith("image/"));
    return primary?.url ?? fallback ?? null;
  };

  const clearError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateAnnouncement = () => {
    const errors: Record<string, string> = {};
    if (!titleValue.trim()) errors.title = "Título é obrigatório.";
    if (!categoryValue.trim()) errors.category = "Categoria é obrigatória.";
    if (!descriptionValue.trim()) errors.description = "Descrição é obrigatória.";
    if (!cityValue.trim()) errors.city = "Cidade é obrigatória.";
    if (!stateValue.trim()) errors.state = "Estado é obrigatório.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetAnnouncementForm = () => {
    setTitleValue("");
    setCategoryValue("");
    setDescriptionValue("");
    setBudgetValue("");
    setDeadlineValue("");
    setCityValue("");
    setStateValue("");
    setAnnouncementAttachments([]);
    setFormErrors({});
    setSelectedAnnouncementId(null);
    setOriginalAnnouncement(null);
    setIsEditingAnnouncement(false);
  };

  const publishAnnouncement = async () => {
    const budget = budgetValue.trim() ? budgetValue.trim() : "A Combinar";
    const deadline = deadlineValue.trim() ? deadlineValue.trim() : "A Combinar";

    try {
      const response = await fetch(apiPath("/api/announcements"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: titleValue.trim(),
          category: categoryValue.trim(),
          description: descriptionValue.trim(),
          city: cityValue.trim(),
          state: stateValue.trim(),
          budget,
          deadline,
          primaryImageUrl: getPrimaryImageUrl(null),
          attachments: announcementAttachments.map((att) => ({
            name: att.name,
            type: att.type,
            url: att.url,
            isPrimary: att.isPrimary,
          })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.message ?? "Não foi possível publicar o anúncio.");
        return;
      }

      setAnnouncements((prev) => [result as Announcement, ...prev]);
      setTitleValue("");
      setCategoryValue("");
      setDescriptionValue("");
      setBudgetValue("");
      setDeadlineValue("");
      setCityValue("");
      setStateValue("");
      setAnnouncementAttachments([]);
      setFormErrors({});

      toast.success("Anúncio publicado com sucesso!");
      setActiveSection("anuncios");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Erro ao publicar anuncio:", error);
      toast.error("Não foi possível publicar o anúncio.");
    }
  };

  const handleViewAnnouncement = (id: string) => {
    const announcement = announcements.find((item) => item.id === id);
    if (!announcement) return;
    setSelectedAnnouncementId(id);
    setOriginalAnnouncement(announcement);
    setTitleValue(announcement.title ?? "");
    setCategoryValue(announcement.category ?? "");
    setDescriptionValue(announcement.description ?? "");
    setBudgetValue(announcement.budget ?? "");
    setDeadlineValue(announcement.deadline ?? "");
    setCityValue(announcement.city ?? "");
    setStateValue(announcement.state ?? "");

    let loadedAttachments = announcement.attachments ?? [];
    if (loadedAttachments.length === 0 && announcement.primaryImageUrl) {
      loadedAttachments = [
        {
          id: `primary-${announcement.id}`,
          name: "Imagem principal",
          type: "image/*",
          url: announcement.primaryImageUrl,
          isPrimary: true,
        },
      ];
    }

    const normalized = normalizeAttachments(loadedAttachments);
    setAnnouncementAttachments(normalized);
    setFormErrors({});
    setIsEditingAnnouncement(false);
    setActiveSection("anunciar");
  };

  const handlePublish = () => {
    if (selectedAnnouncementId) return;
    if (!validateAnnouncement()) return;

    const missing: string[] = [];
    if (!budgetValue.trim()) missing.push("Orçamento");
    if (!deadlineValue.trim()) missing.push("Prazo");

    if (missing.length) {
      setMissingOptional(missing);
      setShowConfirmModal(true);
      return;
    }

    publishAnnouncement();
  };

  const handleConfirmPublish = () => {
    setShowConfirmModal(false);
    publishAnnouncement();
  };

  const handleAnnouncementFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      const attachments = await Promise.all(
        files.map(async (file) => {
          const isImage = file.type.startsWith("image/");
          const url = isImage
            ? await uploadFile(dataUrlToBlob(await resizeImage(file)), file.name)
            : await uploadFile(file, file.name);
          return {
            id: `att-${Date.now()}-${file.name}`,
            name: file.name,
            type: isImage ? "image/jpeg" : file.type,
            url,
            isPrimary: false,
          } as AnnouncementAttachment;
        }),
      );

      setAnnouncementAttachments((prev) => normalizeAttachments([...prev, ...attachments]));
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
      toast.error("Não foi possível carregar os anexos.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSelectPrimaryAttachment = (id: string) => {
    if (isFormDisabled) return;
    setAnnouncementAttachments((prev) => {
      const selectedIndex = prev.findIndex((item) => item.id === id);
      if (selectedIndex < 0) return prev;
      if (!prev[selectedIndex].type.startsWith("image/")) return prev;
      const next = [...prev];
      const [selected] = next.splice(selectedIndex, 1);
      next.unshift(selected);
      return normalizeAttachments(next, selected.id);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    if (isFormDisabled) return;
    setAnnouncementAttachments((prev) => normalizeAttachments(prev.filter((item) => item.id !== id)));
  };

  const handleDragStartAttachment = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isFormDisabled) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedAttachmentId(id);
  };

  const handleDragOverAttachment = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isFormDisabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverAttachmentId !== id) setDragOverAttachmentId(id);
  };

  const handleDropAttachment = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isFormDisabled) return;
    event.preventDefault();
    const draggedId = draggedAttachmentId || event.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === id) {
      setDragOverAttachmentId(null);
      return;
    }
    setAnnouncementAttachments((prev) => {
      const next = moveAttachment(prev, draggedId, id);
      const droppedIndex = next.findIndex((item) => item.id === draggedId);
      const droppedItem = next[droppedIndex];
      if (droppedIndex === 0 && droppedItem?.type.startsWith("image/")) {
        return normalizeAttachments(next, droppedItem.id);
      }
      return normalizeAttachments(next);
    });
    setDraggedAttachmentId(null);
    setDragOverAttachmentId(null);
  };

  const handleDragEndAttachment = () => {
    setDraggedAttachmentId(null);
    setDragOverAttachmentId(null);
  };

  const handleSaveAnnouncement = async () => {
    if (!selectedAnnouncementId || !originalAnnouncement) return;
    if (!validateAnnouncement()) return;

    try {
      const response = await fetch(apiPath(`/api/announcements/${selectedAnnouncementId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: titleValue.trim(),
          category: categoryValue.trim(),
          description: descriptionValue.trim(),
          city: cityValue.trim(),
          state: stateValue.trim(),
          budget: normalizedBudget,
          deadline: normalizedDeadline,
          primaryImageUrl: getPrimaryImageUrl(originalAnnouncement.primaryImageUrl),
          attachments: announcementAttachments.map((att) => ({
            name: att.name,
            type: att.type,
            url: att.url,
            isPrimary: att.isPrimary,
          })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.message ?? "Não foi possível atualizar o anúncio.");
        return;
      }
      const updated = result as Announcement;
      setAnnouncements((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setOriginalAnnouncement(updated);
      setIsEditingAnnouncement(false);
      toast.success("Anúncio atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar anuncio:", error);
      toast.error("Não foi possível atualizar o anúncio.");
    }
  };

  const setAnnouncementStatus = async (id: string, status: "ACTIVE" | "PAUSED") => {
    try {
      const response = await fetch(apiPath(`/api/announcements/${id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        toast.error("Não foi possível atualizar o anúncio.");
        return;
      }
      const updated = (await response.json()) as Announcement;
      setAnnouncements((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success(status === "PAUSED" ? "Anúncio pausado." : "Anúncio ativado.");
    } catch (error) {
      console.error("Erro ao atualizar status do anuncio:", error);
      toast.error("Não foi possível atualizar o anúncio.");
    }
  };

  const handlePauseAnnouncement = (id: string) => setAnnouncementStatus(id, "PAUSED");

  const handleActivateAnnouncement = (id: string) => setAnnouncementStatus(id, "ACTIVE");

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const response = await fetch(apiPath(`/api/announcements/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok && response.status !== 204) {
        toast.error("Não foi possível excluir o anúncio.");
        return;
      }
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      toast.success("Anúncio excluído.");
    } catch (error) {
      console.error("Erro ao excluir anuncio:", error);
      toast.error("Não foi possível excluir o anúncio.");
    }
  };

  return {
    userAnnouncements,
    titleValue,
    setTitleValue,
    categoryValue,
    setCategoryValue,
    descriptionValue,
    setDescriptionValue,
    budgetValue,
    setBudgetValue,
    deadlineValue,
    setDeadlineValue,
    cityValue,
    setCityValue,
    stateValue,
    setStateValue,
    announcementAttachments,
    formErrors,
    showConfirmModal,
    setShowConfirmModal,
    missingOptional,
    isViewingAnnouncement,
    isEditingAnnouncement,
    setIsEditingAnnouncement,
    isFormDisabled,
    hasAnnouncementChanges,
    draggedAttachmentId,
    dragOverAttachmentId,
    clearError,
    resetAnnouncementForm,
    handleViewAnnouncement,
    handlePublish,
    handleConfirmPublish,
    handleAnnouncementFilesChange,
    handleSelectPrimaryAttachment,
    handleRemoveAttachment,
    handleDragStartAttachment,
    handleDragOverAttachment,
    handleDropAttachment,
    handleDragEndAttachment,
    handleSaveAnnouncement,
    handlePauseAnnouncement,
    handleActivateAnnouncement,
    handleDeleteAnnouncement,
    formatCurrency,
  };
}
