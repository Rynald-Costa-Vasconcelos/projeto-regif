/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `NewsAsset` table. All the data in the column will be lost.
  - You are about to drop the column `sizeBytes` on the `NewsAsset` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `NewsAsset` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `NewsAsset` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `NewsPost` table. All the data in the column will be lost.
  - You are about to drop the column `editedAt` on the `NewsPost` table. All the data in the column will be lost.
  - Added the required column `fileType` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "deletedAt",
DROP COLUMN "isFeatured",
ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fileType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "phone",
DROP COLUMN "sortOrder",
ADD COLUMN     "campus" TEXT;

-- AlterTable
ALTER TABLE "NewsAsset" DROP COLUMN "mimeType",
DROP COLUMN "sizeBytes",
DROP COLUMN "sortOrder",
DROP COLUMN "title",
ADD COLUMN     "caption" TEXT;

-- AlterTable
ALTER TABLE "NewsCategory" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "NewsPost" DROP COLUMN "deletedAt",
DROP COLUMN "editedAt",
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "logoUrl" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "purchaseUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
