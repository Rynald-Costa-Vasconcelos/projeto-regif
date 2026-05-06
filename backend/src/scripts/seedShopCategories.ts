import { prisma } from "../lib/prismaClient";
import { ensureShopCategoriesSeed } from "../modules/shop/shop.categories.seed";

async function main() {
  console.log("🛒 Seed de categorias da lojinha (fixas REGIF)");
  await ensureShopCategoriesSeed();
  console.log("✅ Categorias da lojinha sincronizadas.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed de categorias da lojinha:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
