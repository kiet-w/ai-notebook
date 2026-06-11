-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('COOKING', 'TECH', 'LEARNING', 'WORK', 'FINANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "userInput" TEXT,
    "aiTitle" TEXT,
    "aiSummary" TEXT,
    "aiBullets" JSONB,
    "content" TEXT,
    "category" "Category" NOT NULL DEFAULT 'OTHER',
    "status" "Status" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);
