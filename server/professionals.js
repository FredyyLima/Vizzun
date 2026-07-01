import { Router } from "express";
import { z } from "zod";

const displayName = (user) => user?.tradeName || user?.companyName || user?.name || null;

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const serializeReview = (review) => ({
  id: review.id,
  author: review.authorName,
  rating: review.rating,
  comment: review.comment,
});

const serializeProfile = (profile) => {
  const cities = parseJsonArray(profile.cities);
  return {
    id: profile.id,
    name: displayName(profile.user) ?? "Profissional",
    avatar: profile.avatar ?? null,
    specialty: profile.specialty ?? null,
    bio: profile.bio ?? null,
    services: parseJsonArray(profile.services),
    cities,
    location: cities[0] ?? "",
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    verified: profile.verified,
    reviews: (profile.reviews ?? []).map(serializeReview),
  };
};

const profileUpdateSchema = z.object({
  avatar: z.string().optional().nullable(),
  specialty: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  services: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
});

export const createProfessionalsRouter = ({ prisma, requireAuth }) => {
  const router = Router();
  const includeAll = { user: { select: { name: true, tradeName: true, companyName: true } }, reviews: true };

  router.get("/professionals", async (_req, res) => {
    try {
      const profiles = await prisma.professionalProfile.findMany({
        include: includeAll,
        orderBy: { createdAt: "desc" },
      });
      res.json(profiles.map(serializeProfile));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar profissionais." });
    }
  });

  router.get("/professionals/:id", async (req, res) => {
    try {
      const profile = await prisma.professionalProfile.findUnique({
        where: { id: req.params.id },
        include: includeAll,
      });
      if (!profile) {
        return res.status(404).json({ message: "Profissional nao encontrado." });
      }
      res.json(serializeProfile(profile));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao carregar profissional." });
    }
  });

  router.put("/me/professional-profile", requireAuth, async (req, res) => {
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados invalidos." });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user || user.role !== "PROFESSIONAL") {
        return res.status(403).json({ message: "Somente contas profissionais podem ter esse perfil." });
      }
      const data = parsed.data;
      const profile = await prisma.professionalProfile.upsert({
        where: { id: req.userId },
        create: {
          id: req.userId,
          avatar: data.avatar ?? null,
          specialty: data.specialty ?? null,
          bio: data.bio ?? null,
          services: JSON.stringify(data.services ?? []),
          cities: JSON.stringify(data.cities ?? []),
          verified: true,
        },
        update: {
          avatar: data.avatar ?? null,
          specialty: data.specialty ?? null,
          bio: data.bio ?? null,
          services: JSON.stringify(data.services ?? []),
          cities: JSON.stringify(data.cities ?? []),
        },
        include: includeAll,
      });
      res.json(serializeProfile(profile));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao salvar perfil profissional." });
    }
  });

  return router;
};
