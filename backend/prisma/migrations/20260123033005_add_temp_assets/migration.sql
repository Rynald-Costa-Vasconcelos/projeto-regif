-- CreateEnum
CREATE TYPE "TempAssetKind" AS ENUM ('NEWS_COVER', 'NEWS_GALLERY');

-- CreateTable
CREATE TABLE "temp_assets" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "TempAssetKind" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "relPath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "originalName" TEXT,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temp_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "temp_assets_ownerId_idx" ON "temp_assets"("ownerId");

-- CreateIndex
CREATE INDEX "temp_assets_expiresAt_idx" ON "temp_assets"("expiresAt");

-- CreateIndex
CREATE INDEX "temp_assets_kind_idx" ON "temp_assets"("kind");

-- AddForeignKey
ALTER TABLE "temp_assets" ADD CONSTRAINT "temp_assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
