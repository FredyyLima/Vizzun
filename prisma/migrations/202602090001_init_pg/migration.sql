-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('CPF', 'CNPJ');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "personType" "PersonType" NOT NULL,
    "name" TEXT,
    "birthDate" TIMESTAMP(3),
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
    "contactBirthDate" TIMESTAMP(3),
    "cnpjCard" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "services" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_cnpj_key" ON "User"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

