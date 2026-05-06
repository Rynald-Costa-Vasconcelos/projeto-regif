// backend/src/server.ts
import "dotenv/config";
import { createApp } from "./app";
import { ensureShopCategoriesSeed } from "./modules/shop/shop.categories.seed";
import { ensureBoardRolesSeed } from "./modules/board/board.roles.seed";

const app = createApp();

// ------------------------------------------------------
// Start
// ------------------------------------------------------
const PORT = Number(process.env.PORT) || 3000;

void Promise.all([ensureShopCategoriesSeed(), ensureBoardRolesSeed()])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API REGIF rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Falha ao sincronizar seeds essenciais:", err);
    process.exit(1);
  });
