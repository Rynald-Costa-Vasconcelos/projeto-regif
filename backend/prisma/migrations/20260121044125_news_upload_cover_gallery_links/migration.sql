/*
  Warnings:

  - You are about to drop the column `coverImageUrl` on the `NewsPost` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NewsAssetRole" AS ENUM ('COVER', 'GALLERY', 'ATTACHMENT');

-- AlterTable
ALTER TABLE "NewsAsset" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "NewsAssetRole" NOT NULL DEFAULT 'GALLERY',
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "thumbUrl" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "NewsPost" DROP COLUMN "coverImageUrl",
ADD COLUMN     "coverAssetId" TEXT,
ADD COLUMN     "enableGallery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableLinks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showFeaturedImage" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "NewsLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsLink_postId_order_idx" ON "NewsLink"("postId", "order");

-- CreateIndex
CREATE INDEX "NewsLink_postId_idx" ON "NewsLink"("postId");

-- CreateIndex
CREATE INDEX "NewsAsset_postId_type_idx" ON "NewsAsset"("postId", "type");

-- CreateIndex
CREATE INDEX "NewsAsset_postId_role_idx" ON "NewsAsset"("postId", "role");

-- CreateIndex
CREATE INDEX "NewsAsset_postId_order_idx" ON "NewsAsset"("postId", "order");

-- CreateIndex
CREATE INDEX "NewsPost_status_publishedAt_idx" ON "NewsPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "NewsPost_categoryId_idx" ON "NewsPost"("categoryId");

-- CreateIndex
CREATE INDEX "NewsPost_authorId_idx" ON "NewsPost"("authorId");

-- CreateIndex
CREATE INDEX "NewsPost_isFeatured_idx" ON "NewsPost"("isFeatured");

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "NewsAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsLink" ADD CONSTRAINT "NewsLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
