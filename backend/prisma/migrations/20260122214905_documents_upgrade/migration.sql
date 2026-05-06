/*
  Warnings:

  - You are about to drop the column `fileType` on the `Document` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `filePath` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileType",
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Document_slug_key" ON "Document"("slug");

-- CreateIndex
CREATE INDEX "Document_status_publishedAt_idx" ON "Document"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Document_categoryId_idx" ON "Document"("categoryId");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");
