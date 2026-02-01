import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { onlyDigits, isValidCNPJ, isValidCPF, isValidPhone } from "./validators.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json({ limit: "10mb" }));

const ensureSchema = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "role" TEXT NOT NULL,
      "personType" TEXT NOT NULL,
      "name" TEXT,
      "birthDate" DATETIME,
      "cpf" TEXT,
      "rg" TEXT,
      "cnpj" TEXT,
      "companyName" TEXT,
      "tradeName" TEXT,
      "contactName" TEXT,
      "contactEmail" TEXT,
      "contactPhone" TEXT,
      "contactCpf" TEXT,
      "contactRg" TEXT,
      "contactBirthDate" DATETIME,
      "cnpjCard" TEXT,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "services" TEXT,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = await prisma.$queryRawUnsafe(`PRAGMA table_info("User");`);
  const hasContactPhone = Array.isArray(columns) && columns.some((col) => col.name === "contactPhone");
  if (!hasContactPhone) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "contactPhone" TEXT;`);
  }
  const hasContactCpf = Array.isArray(columns) && columns.some((col) => col.name === "contactCpf");
  if (!hasContactCpf) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "contactCpf" TEXT;`);
  }
  const hasContactRg = Array.isArray(columns) && columns.some((col) => col.name === "contactRg");
  if (!hasContactRg) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "contactRg" TEXT;`);
  }
  const hasContactBirthDate = Array.isArray(columns) && columns.some((col) => col.name === "contactBirthDate");
  if (!hasContactBirthDate) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "contactBirthDate" DATETIME;`);
  }
  const hasCnpjCard = Array.isArray(columns) && columns.some((col) => col.name === "cnpjCard");
  if (!hasCnpjCard) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "cnpjCard" TEXT;`);
  }

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_key" ON "User"("cpf");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_cnpj_key" ON "User"("cnpj");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");`);
};

const isValidDate = (value) => {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
};

const registerSchema = z
  .object({
    role: z.enum(["client", "professional"]),
    personType: z.enum(["cpf", "cnpj"]),
    name: z.string().trim().optional(),
    birthDate: z.string().optional(),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8),
    cnpj: z.string().optional(),
    companyName: z.string().optional(),
    tradeName: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    contactCpf: z.string().optional(),
    contactRg: z.string().optional(),
    contactBirthDate: z.string().optional(),
    cnpjCard: z.string().optional(),
    services: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const isClient = data.role === "client";
    const isProfessional = data.role === "professional";
    const isCnpj = isProfessional && data.personType === "cnpj";

    const requireField = (condition, field, message) => {
      if (condition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message,
        });
      }
    };

    if (isClient && data.personType !== "cpf") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personType"],
        message: "Cliente deve se cadastrar com CPF.",
      });
    }

    if (isClient) {
      requireField(!data.name?.trim(), "name", "Informe o nome completo.");
      requireField(!data.birthDate || !isValidDate(data.birthDate), "birthDate", "Informe uma data valida.");
      requireField(!data.cpf, "cpf", "Informe o CPF.");
      if (data.cpf && !isValidCPF(data.cpf)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "CPF invalido." });
      }
      requireField(!data.rg?.trim(), "rg", "Informe o RG.");
      requireField(!data.phone, "phone", "Informe o telefone.");
      if (data.phone && !isValidPhone(data.phone)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Telefone invalido." });
      }
    }

    if (isProfessional) {
      if (!data.services || data.services.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["services"],
          message: "Selecione ao menos um servico.",
        });
      }

      if (isCnpj) {
        requireField(!data.cnpj, "cnpj", "Informe o CNPJ.");
        if (data.cnpj && !isValidCNPJ(data.cnpj)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cnpj"], message: "CNPJ invalido." });
        }
        requireField(!data.birthDate || !isValidDate(data.birthDate), "birthDate", "Informe a data de criacao.");
        requireField(!data.companyName?.trim(), "companyName", "Informe a razao social.");
        requireField(!data.tradeName?.trim(), "tradeName", "Informe o nome fantasia.");
        requireField(!data.cnpjCard, "cnpjCard", "Envie o cartao CNPJ.");
        requireField(!data.contactName?.trim(), "contactName", "Informe o responsavel.");
        requireField(!data.contactEmail, "contactEmail", "Informe o email do responsavel.");
        requireField(!data.contactPhone, "contactPhone", "Informe o telefone do responsavel.");
        requireField(!data.contactCpf, "contactCpf", "Informe o CPF do responsavel.");
        if (data.contactCpf && !isValidCPF(data.contactCpf)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactCpf"], message: "CPF invalido." });
        }
        requireField(!data.contactRg?.trim(), "contactRg", "Informe o RG do responsavel.");
        requireField(
          !data.contactBirthDate || !isValidDate(data.contactBirthDate),
          "contactBirthDate",
          "Informe a data de nascimento do responsavel.",
        );
        if (data.contactPhone && !isValidPhone(data.contactPhone)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["contactPhone"],
            message: "Telefone invalido.",
          });
        }
      } else {
        requireField(!data.name?.trim(), "name", "Informe o nome completo.");
        requireField(!data.birthDate || !isValidDate(data.birthDate), "birthDate", "Informe uma data valida.");
        requireField(!data.cpf, "cpf", "Informe o CPF.");
        if (data.cpf && !isValidCPF(data.cpf)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "CPF invalido." });
        }
        requireField(!data.rg?.trim(), "rg", "Informe o RG.");
        requireField(!data.phone, "phone", "Informe o telefone.");
        if (data.phone && !isValidPhone(data.phone)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Telefone invalido." });
        }
      }
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "A senha deve ter letras e numeros.",
      });
    }
  });

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados invalidos.", errors: parsed.error.flatten() });
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const phone = onlyDigits(data.phone ?? "");
  const cpf = data.cpf ? onlyDigits(data.cpf) : null;
  const cnpj = data.cnpj ? onlyDigits(data.cnpj) : null;
  const contactPhone = data.contactPhone ? onlyDigits(data.contactPhone) : null;
  const contactCpf = data.contactCpf ? onlyDigits(data.contactCpf) : null;
  const contactBirthDate = data.contactBirthDate ? new Date(data.contactBirthDate) : null;

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ field: "email", message: "Email ja cadastrado." });
    }

    if (cpf) {
      const existingCpf = await prisma.user.findUnique({ where: { cpf } });
      if (existingCpf) {
        return res.status(409).json({ field: "cpf", message: "CPF ja cadastrado." });
      }
    }

    if (cnpj) {
      const existingCnpj = await prisma.user.findUnique({ where: { cnpj } });
      if (existingCnpj) {
        return res.status(409).json({ field: "cnpj", message: "CNPJ ja cadastrado." });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        role: data.role === "client" ? "CLIENT" : "PROFESSIONAL",
        personType: data.personType === "cnpj" ? "CNPJ" : "CPF",
        name: data.name?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        cpf,
        rg: data.rg?.trim() || null,
        cnpj,
        companyName: data.companyName?.trim() || null,
        tradeName: data.tradeName?.trim() || null,
        contactName: data.contactName?.trim() || null,
        contactEmail: data.contactEmail?.trim().toLowerCase() || null,
        contactPhone,
        contactCpf,
        contactRg: data.contactRg?.trim() || null,
        contactBirthDate,
        cnpjCard: data.cnpjCard ?? null,
        email,
        phone,
        services: data.services?.length ? JSON.stringify(data.services) : null,
        passwordHash,
      },
    });

    return res.status(201).json({ id: user.id, role: user.role, personType: user.personType });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar usuario." });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/api/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Credenciais invalidas.", errors: parsed.error.flatten() });
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    return res.json({
      id: user.id,
      role: user.role,
      personType: user.personType,
      name: user.name,
      tradeName: user.tradeName,
      companyName: user.companyName,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao autenticar usuario." });
  }
});

const updateSchema = z
  .object({
    birthDate: z.string().optional(),
    rg: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    companyName: z.string().optional(),
    tradeName: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    contactCpf: z.string().optional(),
    contactRg: z.string().optional(),
    contactBirthDate: z.string().optional(),
    services: z.array(z.string()).optional(),
    cnpjCard: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.birthDate && !isValidDate(data.birthDate)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["birthDate"], message: "Informe uma data valida." });
    }
    if (data.phone && !isValidPhone(data.phone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Telefone invalido." });
    }
    if (data.contactPhone && !isValidPhone(data.contactPhone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactPhone"], message: "Telefone invalido." });
    }
    if (data.contactCpf && !isValidCPF(data.contactCpf)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactCpf"], message: "CPF invalido." });
    }
    if (data.contactBirthDate && !isValidDate(data.contactBirthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactBirthDate"],
        message: "Data de nascimento invalida.",
      });
    }
    if (data.password && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "A senha deve ter letras e numeros.",
      });
    }
  });

app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }
    return res.json({
      id: user.id,
      role: user.role,
      personType: user.personType,
      name: user.name,
      birthDate: user.birthDate,
      cpf: user.cpf,
      rg: user.rg,
      cnpj: user.cnpj,
      companyName: user.companyName,
      tradeName: user.tradeName,
      contactName: user.contactName,
      contactEmail: user.contactEmail,
      contactPhone: user.contactPhone,
      contactCpf: user.contactCpf,
      contactRg: user.contactRg,
      contactBirthDate: user.contactBirthDate,
      email: user.email,
      phone: user.phone,
      services: user.services ? JSON.parse(user.services) : [],
      hasCnpjCard: Boolean(user.cnpjCard),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao carregar usuario." });
  }
});

app.put("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  if ("name" in req.body || "cpf" in req.body || "cnpj" in req.body) {
    return res.status(400).json({ message: "Nome e CPF/CNPJ nao podem ser atualizados." });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados invalidos.", errors: parsed.error.flatten() });
  }

  const data = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
      if (existingEmail) {
        return res.status(409).json({ field: "email", message: "Email ja cadastrado." });
      }
    }

    if (
      user.personType === "CNPJ" &&
      data.companyName &&
      data.companyName.trim() !== (user.companyName ?? "") &&
      !data.cnpjCard
    ) {
      return res.status(400).json({
        field: "cnpjCard",
        message: "Envie o cartao CNPJ para atualizar a razao social.",
      });
    }

    const updateData = {
      birthDate: data.birthDate ? new Date(data.birthDate) : user.birthDate,
      rg: data.rg?.trim() ?? user.rg,
      phone: data.phone ? onlyDigits(data.phone) : user.phone,
      email: data.email ? data.email.trim().toLowerCase() : user.email,
      companyName: data.companyName?.trim() ?? user.companyName,
      tradeName: data.tradeName?.trim() ?? user.tradeName,
      contactName: data.contactName?.trim() ?? user.contactName,
      contactEmail: data.contactEmail?.trim().toLowerCase() ?? user.contactEmail,
      contactPhone: data.contactPhone ? onlyDigits(data.contactPhone) : user.contactPhone,
      contactCpf: data.contactCpf ? onlyDigits(data.contactCpf) : user.contactCpf,
      contactRg: data.contactRg?.trim() ?? user.contactRg,
      contactBirthDate: data.contactBirthDate ? new Date(data.contactBirthDate) : user.contactBirthDate,
      services: Array.isArray(data.services) ? JSON.stringify(data.services) : user.services,
      cnpjCard: data.cnpjCard ?? user.cnpjCard,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData });

    return res.json({
      id: updated.id,
      role: updated.role,
      personType: updated.personType,
      name: updated.name,
      birthDate: updated.birthDate,
      cpf: updated.cpf,
      rg: updated.rg,
      cnpj: updated.cnpj,
      companyName: updated.companyName,
      tradeName: updated.tradeName,
      contactName: updated.contactName,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
      contactCpf: updated.contactCpf,
      contactRg: updated.contactRg,
      contactBirthDate: updated.contactBirthDate,
      email: updated.email,
      phone: updated.phone,
      services: updated.services ? JSON.parse(updated.services) : [],
      hasCnpjCard: Boolean(updated.cnpjCard),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar usuario." });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 8081;

try {
  await ensureSchema();
} catch (error) {
  console.error("Erro ao preparar o banco de dados:", error);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});



