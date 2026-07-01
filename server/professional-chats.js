import { Router } from "express";
import { z } from "zod";

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
  const professional = userMap.get(chat.professionalId);
  const client = userMap.get(chat.clientId);
  return {
    id: chat.id,
    professionalId: chat.professionalId,
    professionalName: displayName(professional) ?? "Profissional",
    clientId: chat.clientId,
    clientName: displayName(client) ?? "Usuario",
    dealStatus: chat.dealStatus,
    closePendingFrom: chat.closePendingFrom ?? null,
    createdAt: chat.createdAt,
    professionalLastReadAt: chat.professionalLastReadAt ?? null,
    clientLastReadAt: chat.clientLastReadAt ?? null,
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

const messageInclude = { messages: { orderBy: { createdAt: "asc" } } };

const createChatSchema = z.object({ professionalId: z.string().min(1) });
const messageSchema = z
  .object({
    text: z.string().trim().optional(),
    kind: z.enum(["text", "file", "audio", "image", "video"]).optional(),
    fileName: z.string().optional(),
    fileUrl: z.string().optional(),
    fileType: z.string().optional(),
  })
  .refine((data) => Boolean(data.text?.trim()) || Boolean(data.fileUrl), { message: "Mensagem vazia." });
const closeActionSchema = z.object({ action: z.enum(["request", "accept", "reject"]) });

export const createProfessionalChatsRouter = ({ prisma, requireAuth }) => {
  const router = Router();

  const loadChatForUser = async (chatId, userId) => {
    const chat = await prisma.professionalChat.findUnique({ where: { id: chatId }, include: messageInclude });
    if (!chat) return { chat: null, allowed: false };
    const allowed = chat.professionalId === userId || chat.clientId === userId;
    return { chat, allowed };
  };

  const appendSystemMessage = (tx, chatId, senderId, text) =>
    tx.message.create({ data: { professionalChatId: chatId, senderId, text, kind: "text" } });

  router.post("/professional-chats", requireAuth, async (req, res) => {
    const parsed = createChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados invalidos." });
    }
    try {
      const professional = await prisma.user.findUnique({ where: { id: parsed.data.professionalId } });
      if (!professional || professional.role !== "PROFESSIONAL") {
        return res.status(404).json({ message: "Profissional nao encontrado." });
      }
      const existing = await prisma.professionalChat.findFirst({
        where: { professionalId: professional.id, clientId: req.userId, NOT: { dealStatus: "closed" } },
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      });
      const chat =
        existing ??
        (await prisma.professionalChat.create({
          data: { professionalId: professional.id, clientId: req.userId },
          include: messageInclude,
        }));
      const userMap = await loadUserMap(prisma, [chat.professionalId, chat.clientId]);
      res.status(existing ? 200 : 201).json(serializeChat(chat, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao iniciar chat." });
    }
  });

  router.get("/professional-chats", requireAuth, async (req, res) => {
    try {
      const chats = await prisma.professionalChat.findMany({
        where: { OR: [{ professionalId: req.userId }, { clientId: req.userId }] },
        include: messageInclude,
        orderBy: { updatedAt: "desc" },
      });
      const userIds = chats.flatMap((chat) => [chat.professionalId, chat.clientId]);
      const userMap = await loadUserMap(prisma, userIds);
      res.json(chats.map((chat) => serializeChat(chat, userMap)));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar chats." });
    }
  });

  router.get("/professional-chats/:id", requireAuth, async (req, res) => {
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });
      const userMap = await loadUserMap(prisma, [chat.professionalId, chat.clientId]);
      res.json(serializeChat(chat, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao carregar chat." });
    }
  });

  router.post("/professional-chats/:id/messages", requireAuth, async (req, res) => {
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
          professionalChatId: chat.id,
          senderId: req.userId,
          text: data.text?.trim() || null,
          kind: data.kind ?? "text",
          fileName: data.fileName ?? null,
          fileUrl: data.fileUrl ?? null,
          fileType: data.fileType ?? null,
        },
      });
      await prisma.professionalChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });

      const updated = await prisma.professionalChat.findUnique({ where: { id: chat.id }, include: messageInclude });
      const userMap = await loadUserMap(prisma, [updated.professionalId, updated.clientId]);
      res.status(201).json(serializeChat(updated, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao enviar mensagem." });
    }
  });

  router.post("/professional-chats/:id/close", requireAuth, async (req, res) => {
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
          prisma.professionalChat.update({ where: { id: chat.id }, data: { closePendingFrom: req.userId } }),
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
          await tx.professionalChat.update({
            where: { id: chat.id },
            data: { dealStatus: "closed", closePendingFrom: null },
          });
          await tx.professionalChat.create({
            data: { professionalId: chat.professionalId, clientId: chat.clientId },
          });
        });
      } else {
        await prisma.$transaction([
          appendSystemMessage(prisma, chat.id, req.userId, "Fechamento recusado."),
          prisma.professionalChat.update({ where: { id: chat.id }, data: { closePendingFrom: null } }),
        ]);
      }

      const updated = await prisma.professionalChat.findUnique({ where: { id: chat.id }, include: messageInclude });
      const userMap = await loadUserMap(prisma, [updated.professionalId, updated.clientId]);
      res.json(serializeChat(updated, userMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar fechamento." });
    }
  });

  router.post("/professional-chats/:id/read", requireAuth, async (req, res) => {
    try {
      const { chat, allowed } = await loadChatForUser(req.params.id, req.userId);
      if (!chat) return res.status(404).json({ message: "Chat nao encontrado." });
      if (!allowed) return res.status(403).json({ message: "Sem permissao." });

      const isProfessional = chat.professionalId === req.userId;
      await prisma.professionalChat.update({
        where: { id: chat.id },
        data: isProfessional ? { professionalLastReadAt: new Date() } : { clientLastReadAt: new Date() },
      });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao marcar como lido." });
    }
  });

  return router;
};
