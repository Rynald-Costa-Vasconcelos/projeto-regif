-- Textos opcionais da gestão para exibição pública (Quem somos)
ALTER TABLE "board_mandates" ADD COLUMN IF NOT EXISTS "public_tagline" TEXT;
ALTER TABLE "board_mandates" ADD COLUMN IF NOT EXISTS "public_intro" TEXT;
ALTER TABLE "board_mandates" ADD COLUMN IF NOT EXISTS "public_mission" TEXT;
ALTER TABLE "board_mandates" ADD COLUMN IF NOT EXISTS "public_activities" TEXT;
ALTER TABLE "board_mandates" ADD COLUMN IF NOT EXISTS "public_contact" TEXT;
ALTER TABLE "board_mandates" ADD COLUMN IF NOT EXISTS "public_closing_note" TEXT;
