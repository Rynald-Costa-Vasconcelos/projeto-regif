-- AlterTable
ALTER TABLE "guilds" ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "history" TEXT;

-- CreateTable
CREATE TABLE "guild_assets" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_assets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "guild_assets" ADD CONSTRAINT "guild_assets_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
