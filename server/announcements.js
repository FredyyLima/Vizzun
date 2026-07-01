import { Router } from "express";
import { z } from "zod";

const attachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  url: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  category: z.string().trim().min(1, "Categoria e obrigatoria."),
  description: z.string().trim().min(1, "Descricao e obrigatoria."),
  city: z.string().trim().min(1, "Cidade e obrigatoria."),
  state: z.string().trim().min(1, "Estado e obrigatorio."),
  budget: z.string().trim().optional(),
  deadline: z.string().trim().optional(),
  primaryImageUrl: z.string().optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
});

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

const dealSchema = z.object({
  dealStatus: z.enum(["NONE", "PENDING", "CLOSED"]),
});

const roleLabel = (role) => (role === "PROFESSIONAL" ? "Profissional" : "Cliente");
const statusLabel = (status) => (status === "PAUSED" ? "Pausado" : "Ativo");
const dealStatusLabel = (dealStatus) => {
  if (dealStatus === "PENDING") return "pending";
  if (dealStatus === "CLOSED") return "closed";
  return undefined;
};

const serializeAnnouncement = (announcement) => ({
  id: announcement.id,
  ownerId: announcement.ownerId,
  ownerName: announcement.owner?.name ?? null,
  ownerEmail: announcement.owner?.email ?? null,
  role: roleLabel(announcement.role),
  title: announcement.title,
  category: announcement.category,
  description: announcement.description,
  city: announcement.city,
  state: announcement.state,
  budget: announcement.budget,
  deadline: announcement.deadline,
  status: statusLabel(announcement.status),
  dealStatus: dealStatusLabel(announcement.dealStatus),
  createdAt: announcement.createdAt,
  proposals: announcement.proposals,
  primaryImageUrl: announcement.primaryImageUrl,
  attachments: (announcement.attachments ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((att) => ({ id: att.id, name: att.name, type: att.type, url: att.url, isPrimary: att.isPrimary })),
});

export const createAnnouncementsRouter = ({ prisma, requireAuth }) => {
  const router = Router();
  const includeOwner = { owner: { select: { name: true, email: true } }, attachments: true };

  router.get("/announcements", async (req, res) => {
    try {
      const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
      const items = await prisma.announcement.findMany({
        where: {
          status: "ACTIVE",
          NOT: { dealStatus: "CLOSED" },
          ...(ownerId ? { ownerId } : {}),
        },
        include: includeOwner,
        orderBy: { createdAt: "desc" },
      });
      res.json(items.map(serializeAnnouncement));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar anuncios." });
    }
  });

  router.get("/announcements/me", requireAuth, async (req, res) => {
    try {
      const items = await prisma.announcement.findMany({
        where: { ownerId: req.userId },
        include: includeOwner,
        orderBy: { createdAt: "desc" },
      });
      res.json(items.map(serializeAnnouncement));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar seus anuncios." });
    }
  });

  router.get("/announcements/:id", async (req, res) => {
    try {
      const item = await prisma.announcement.findUnique({
        where: { id: req.params.id },
        include: includeOwner,
      });
      if (!item) {
        return res.status(404).json({ message: "Anuncio nao encontrado." });
      }
      res.json(serializeAnnouncement(item));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao carregar anuncio." });
    }
  });

  router.post("/announcements", requireAuth, async (req, res) => {
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados invalidos.", errors: parsed.error.flatten() });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) {
        return res.status(401).json({ message: "Nao autenticado." });
      }
      const data = parsed.data;
      const created = await prisma.announcement.create({
        data: {
          ownerId: req.userId,
          role: user.role,
          title: data.title,
          category: data.category,
          description: data.description,
          city: data.city,
          state: data.state,
          budget: data.budget?.trim() || "A Combinar",
          deadline: data.deadline?.trim() || "A Combinar",
          primaryImageUrl: data.primaryImageUrl ?? null,
          attachments: {
            create: (data.attachments ?? []).map((att, index) => ({
              name: att.name,
              type: att.type,
              url: att.url ?? null,
              isPrimary: Boolean(att.isPrimary),
              position: index,
            })),
          },
        },
        include: includeOwner,
      });
      res.status(201).json(serializeAnnouncement(created));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao publicar anuncio." });
    }
  });

  router.put("/announcements/:id", requireAuth, async (req, res) => {
    try {
      const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ message: "Anuncio nao encontrado." });
      }
      if (existing.ownerId !== req.userId) {
        return res.status(403).json({ message: "Sem permissao para editar este anuncio." });
      }

      const parsed = announcementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados invalidos.", errors: parsed.error.flatten() });
      }
      const data = parsed.data;

      const updated = await prisma.$transaction(async (tx) => {
        await tx.announcementAttachment.deleteMany({ where: { announcementId: existing.id } });
        return tx.announcement.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            category: data.category,
            description: data.description,
            city: data.city,
            state: data.state,
            budget: data.budget?.trim() || "A Combinar",
            deadline: data.deadline?.trim() || "A Combinar",
            primaryImageUrl: data.primaryImageUrl ?? null,
            attachments: {
              create: (data.attachments ?? []).map((att, index) => ({
                name: att.name,
                type: att.type,
                url: att.url ?? null,
                isPrimary: Boolean(att.isPrimary),
                position: index,
              })),
            },
          },
          include: includeOwner,
        });
      });

      res.json(serializeAnnouncement(updated));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar anuncio." });
    }
  });

  router.patch("/announcements/:id/status", requireAuth, async (req, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Status invalido." });
    }
    try {
      const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ message: "Anuncio nao encontrado." });
      }
      if (existing.ownerId !== req.userId) {
        return res.status(403).json({ message: "Sem permissao." });
      }
      const updated = await prisma.announcement.update({
        where: { id: existing.id },
        data: { status: parsed.data.status },
        include: includeOwner,
      });
      res.json(serializeAnnouncement(updated));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar status do anuncio." });
    }
  });

  // NOTA: sem checagem de ownership de proposito - dealStatus e um campo de
  // negociacao mutua (tanto o dono do anuncio quanto quem propos negocio via
  // chat podem fechar/reabrir). A validacao apropriada de "quem pode mudar o
  // que" sera implementada no item 6d, quando o chat de projeto passar a ser
  // a unica via real de alterar esse campo. Ate la, qualquer usuario
  // autenticado pode chamar esta rota - risco aceito, baixo (nao expoe PII,
  // nao movimenta dinheiro, limitado a um enum de status de anuncio publico).
  router.patch("/announcements/:id/deal", requireAuth, async (req, res) => {
    const parsed = dealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Status de negocio invalido." });
    }
    try {
      const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ message: "Anuncio nao encontrado." });
      }
      const updated = await prisma.announcement.update({
        where: { id: existing.id },
        data: { dealStatus: parsed.data.dealStatus },
        include: includeOwner,
      });
      res.json(serializeAnnouncement(updated));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar negocio do anuncio." });
    }
  });

  router.delete("/announcements/:id", requireAuth, async (req, res) => {
    try {
      const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ message: "Anuncio nao encontrado." });
      }
      if (existing.ownerId !== req.userId) {
        return res.status(403).json({ message: "Sem permissao." });
      }
      await prisma.announcement.delete({ where: { id: existing.id } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir anuncio." });
    }
  });

  return router;
};
