import { prisma } from "../lib/prismaClient";

async function main() {
  console.log("📘 Seed de Categorias de Notícias (baseado no Estatuto da REGIF)");

  const categories = [
    { name: "Institucional", slug: "institucional", color: "#1e3a8a" },
    { name: "Comunicados Oficiais", slug: "comunicados-oficiais", color: "#2563eb" },
    { name: "Congressos e Instâncias", slug: "congressos-e-instancias", color: "#7c3aed" },
    { name: "Atos Administrativos", slug: "atos-administrativos", color: "#111827" },
    { name: "Grêmios Filiados", slug: "gremios-filiados", color: "#059669" },
    { name: "Assistência Estudantil e Direitos", slug: "assistencia-estudantil-e-direitos", color: "#dc2626" },
    { name: "Formação Política e Movimento Estudantil", slug: "formacao-politica-e-movimento-estudantil", color: "#ea580c" },
    { name: "Cultura, Esporte e Qualidade de Vida", slug: "cultura-esporte-e-qualidade-de-vida", color: "#db2777" },
    { name: "Diversidade e Direitos Humanos", slug: "diversidade-e-direitos-humanos", color: "#7c2d12" },
    { name: "Meio Ambiente e Saúde", slug: "meio-ambiente-e-saude", color: "#15803d" },
    { name: "Transparência e Prestação de Contas", slug: "transparencia-e-prestacao-de-contas", color: "#334155" },
    { name: "Geral", slug: "geral", color: "#475569" },
  ] as const;

  for (const category of categories) {
    await prisma.newsCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        color: category.color,
      },
      create: {
        name: category.name,
        slug: category.slug,
        color: category.color,
      },
    });
  }

  console.log(`✅ ${categories.length} categorias criadas/atualizadas com base no Estatuto.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed de categorias:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
