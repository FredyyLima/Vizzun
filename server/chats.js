import { Router } from "express";
import { z } from "zod";

const dealStatusToApi = (status) => {
  if (status === "PENDING") return "pending";
  if (status === "CLOSED") return "closed";
  return undefined;
};

const displayName = (user) => user?.tradeName || user?.companyName || user?.name || null;

const serializeMessage = (message) => ({
  id: message.id,
  sender: "other",
  senderId: message.senderId,
  text: message.text ?? undefined,
  createdAt: message.createdAt,
  kind: message.kind,
  fileName: message.fileName ?? undefined,
  fileUrl: message.fileUrl ?? undefined,
  fileType: message.fileType ?? undefined,
});

const serializeChat = (chat, userMap) => {
  const owner = userMap.get(chat.ownerId);
  const participant = userMap.get(chat.participantId);
  return {
    id: chat.id,
    projectId: chat.announcementId,
    ownerId: chat.ownerId,
    ownerName: displayName(owner) ?? "Cliente",
    ownerEmail: owner?.email ?? null,
    participantId: chat.participantId,
    participantName: displayName(participant) ?? "Usuario",
    projectTitle: chat.announcement?.title ?? "Projeto",
    projectBudget: chat.announcement?.budget ?? "",
    pendingDealFrom: chat.pendingDealFrom ?? null,
    dealStatus: dealStatusToApi(chat.dealStatus),
    closePendingFrom: chat.closePendingFrom ?? null,
    contractStatus: chat.contractStatus ?? undefined,
    createdAt: chat.createdAt,
    ownerLastReadAt: chat.ownerLastReadAt ?? null,
    participantLastReadAt: chat.participantLastReadAt ?? null,
    messages: (chat.messages ?? []).map(serializeMessage),
  };
};

const loadUserMap = async (prisma, ids) => {
  const unique = [...new Set(ids)];
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true, tradeName: true, companyName: true },
  });
  return new Map(users.map((user) => [user.id, user]));
};

const messageInclude = { messages: { orderBy: { createdAt: "asc" } }, announcement: { select: { title: true, budget: true } } };

const createChatSchema = z.object({ announcementId: z.string().min(1) });
const messageSchema = z
  .object({
    text: z.string().trim().optional(),
    kind: z.enum(["text", "file", "audio", "image", "video"]).optional(),
    fileName: z.string().optional(),
    fileUrl: z.string().optional(),
    fileType: z.string().optional(),
  })
  .refine((data) => Boolean(data.text?.trim()) || Boolean(data.fileUrl), {
    message: "Mensagem vazia.",
  });
const dealActionSchema = z.object({
  action: z.enum(["propose", "accept", "reject"]),
  reason: z.string().trim().optional(),
});
const closeActionSchema = z.object({ action: z.enum(["request", "accept", "reject"]) });
const contractActionSchema = z.object({ action: z.enum(["accept", "reject"]) });

export const createChatsRouter = ({ prisma, requireAuth }) => {
  const router = Router();

  const loadChatForUser = async (chatId, userId) => {
    const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: messageInclude });
    if (!chat) return { chat: null, allowed: false };
    const allowed = chat.ownerId === userId || chat.participantId === userId;
    return { chat, allowed };
  };

  router.post("/chats", requireAuth, async (req, res) => {
    const parsed = createChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados invalidos." });
    }
    try {
      const announcement = await prisma.announcement.findUnique({ where: { id: parsed.data.announcementId } });
      if (!announcement) {
        return res.status(404).json({ message: "Anuncio nao encontrado." });
      }
      const existing = await prisma.chat.findFirst({
        where: {
          announcementId: announcement.id,
          participantId: req.userId,
          NOT: { dealStatus: "CLOSED" },
        },
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      });
      const chat =
        existing ??
        (await prisma.chat.create({
          data: {
            announcementId: announcement.id,
            ownerId: announcement.ownerId,
            participantId: req.userId,
          },
          include: messageInclude,
        }));
      const userMap = await loadUserMap(prisma, [chat.ownerId, chat.participantId]);
      res.status(existing ? 200 : 201).json(serializeChat(chat, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao iniciar chat." });
    }
  });

  router.get("/chats", requireAuth, async (req, res) => {
    try {
      const chats = await prisma.chat.findMany({
        where: { OR: [{ ownerId: req.userId }, { participantId: req.userId }] },
        include: messageInclude,
        orderBy: { updatedAt: "desc" },
      });
      const userIds = chats.flatMap((chat) => [chat.ownerId, chat.participantId]);
      const userMap = await loadUserMap(prisma, userIds);
      res.json(chats.map((chat) => serializeChat(chat, userMap)));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar chats." });
    }
  });

  router.get("/chats/:id", requireAuth, async (req, res) => {
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });
      const userMap = await loadUserMap(prisma, [chat.ownerId, chat.participantId]);
      res.json(serializeChat(chat, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao carregar chat." });
    }
  });

  router.post("/chats/:id/messages", requireAuth, async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Mensagem invalida." });
    }
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });

      const data = parsed.data;
      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: req.userId,
          text: data.text?.trim() || null,
          kind: data.kind ?? "text",
          fileName: data.fileName ?? null,
          fileUrl: data.fileUrl ?? null,
          fileType: data.fileType ?? null,
        },
      });
      await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });

      const updated = await prisma.chat.findUnique({ where: { id: chat.id }, include: messageInclude });
      const userMap = await loadUserMap(prisma, [updated.ownerId, updated.participantId]);
      res.status(201).json(serializeChat(updated, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao enviar mensagem." });
    }
  });

  const appendSystemMessage = (tx, chatId, senderId, text) =>
    tx.message.create({ data: { chatId, senderId, text, kind: "text" } });

  const spawnFollowUpChat = (tx, chat) =>
    tx.chat.create({
      data: {
        announcementId: chat.announcementId,
        ownerId: chat.ownerId,
        participantId: chat.participantId,
      },
    });

  router.post("/chats/:id/deal", requireAuth, async (req, res) => {
    const parsed = dealActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Acao invalida." });
    }
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });

      const { action, reason } = parsed.data;

      if (action === "propose") {
        if (chat.dealStatus === "CLOSED") {
          return res.status(409).json({ message: "Este chat ja tem um negocio fechado." });
        }
        await prisma.$transaction([
          prisma.chat.update({
            where: { id: chat.id },
            data: { dealStatus: "PENDING", pendingDealFrom: req.userId },
          }),
          prisma.announcement.update({ where: { id: chat.announcementId }, data: { dealStatus: "PENDING" } }),
        ]);
      } else if (action === "accept") {
        if (chat.dealStatus !== "PENDING") {
          return res.status(409).json({ message: "Nao ha negocio pendente para aceitar." });
        }
        if (chat.pendingDealFrom === req.userId) {
          return res.status(403).json({ message: "Quem propos o negocio nao pode aceita-lo." });
        }
        await prisma.$transaction(async (tx) => {
          await appendSystemMessage(tx, chat.id, req.userId, "Negócio aceito. O acordo foi fechado.");
          await tx.chat.update({
            where: { id: chat.id },
            data: { dealStatus: "CLOSED", pendingDealFrom: null, closePendingFrom: null },
          });
          await spawnFollowUpChat(tx, chat);
          await tx.announcement.update({ where: { id: chat.announcementId }, data: { dealStatus: "CLOSED" } });
        });
      } else {
        if (chat.dealStatus !== "PENDING") {
          return res.status(409).json({ message: "Nao ha negocio pendente para recusar." });
        }
        await prisma.$transaction(async (tx) => {
          await appendSystemMessage(
            tx,
            chat.id,
            "system",
            reason ? `Negócio recusado: ${reason}` : "Negócio recusado.",
          );
          await tx.chat.update({
            where: { id: chat.id },
            data: { dealStatus: "NONE", pendingDealFrom: null },
          });
          await tx.announcement.update({ where: { id: chat.announcementId }, data: { dealStatus: "NONE" } });
        });
      }

      const updated = await prisma.chat.findUnique({ where: { id: chat.id }, include: messageInclude });
      const userMap = await loadUserMap(prisma, [updated.ownerId, updated.participantId]);
      res.json(serializeChat(updated, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar negocio." });
    }
  });

  router.post("/chats/:id/close", requireAuth, async (req, res) => {
    const parsed = closeActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Acao invalida." });
    }
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });

      const { action } = parsed.data;

      if (action === "request") {
        await prisma.$transaction([
          appendSystemMessage(
            prisma,
            chat.id,
            req.userId,
            "Solicitação de fechamento enviada. Aguardando confirmação da outra parte.",
          ),
          prisma.chat.update({ where: { id: chat.id }, data: { closePendingFrom: req.userId } }),
        ]);
      } else if (action === "accept") {
        if (!chat.closePendingFrom) {
          return res.status(409).json({ message: "Nao ha solicitacao de fechamento pendente." });
        }
        if (chat.closePendingFrom === req.userId) {
          return res.status(403).json({ message: "Quem solicitou o fechamento nao pode confirma-lo." });
        }
        await prisma.$transaction(async (tx) => {
          await appendSystemMessage(tx, chat.id, req.userId, "Negócio fechado.");
          await tx.chat.update({
            where: { id: chat.id },
            data: { dealStatus: "CLOSED", closePendingFrom: null, pendingDealFrom: null },
          });
          await spawnFollowUpChat(tx, chat);
          await tx.announcement.update({ where: { id: chat.announcementId }, data: { dealStatus: "CLOSED" } });
        });
      } else {
        await prisma.$transaction([
          appendSystemMessage(prisma, chat.id, req.userId, "Fechamento recusado."),
          prisma.chat.update({ where: { id: chat.id }, data: { closePendingFrom: null } }),
        ]);
      }

      const updated = await prisma.chat.findUnique({ where: { id: chat.id }, include: messageInclude });
      const userMap = await loadUserMap(prisma, [updated.ownerId, updated.participantId]);
      res.json(serializeChat(updated, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar fechamento." });
    }
  });

  router.post("/chats/:id/contract", requireAuth, async (req, res) => {
    const parsed = contractActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Acao invalida." });
    }
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });

      const status = parsed.data.action === "accept" ? "accepted" : "rejected";
      const text = status === "accepted" ? "Contrato aceito pelo profissional." : "Contrato recusado pelo profissional.";

      await prisma.$transaction([
        appendSystemMessage(prisma, chat.id, "system", text),
        prisma.chat.update({ where: { id: chat.id }, data: { contractStatus: status } }),
      ]);

      const updated = await prisma.chat.findUnique({ where: { id: chat.id }, include: messageInclude });
      const userMap = await loadUserMap(prisma, [updated.ownerId, updated.participantId]);
      res.json(serializeChat(updated, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar contrato." });
    }
  });

  router.post("/chats/:id/read", requireAuth, async (req, res) => {
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });

      const isOwner = chat.ownerId === req.userId;
      await prisma.chat.update({
        where: { id: chat.id },
        data: isOwner ? { ownerLastReadAt: new Date() } : { participantLastReadAt: new Date() },
      });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao marcar como lido." });
    }
  });

  return router;
};
