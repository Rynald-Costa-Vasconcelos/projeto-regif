import { prisma } from "../lib/prismaClient";
import { ensureBoardRolesSeed } from "../modules/board/board.roles.seed";

async function main() {
  console.log("👥🌱 Seed de cargos oficiais (Diretorias REGIF)...");
  await ensureBoardRolesSeed();
  const count = await prisma.boardRole.count();
  console.log(`✅ Seed concluído. Total de cargos em BoardRole: ${count}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed de cargos da Diretoria:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

