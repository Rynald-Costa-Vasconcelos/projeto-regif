import { prisma } from "../lib/prismaClient"; // ajuste o caminho se seu seed ficar em outro lugar

type Cat = { name: string; slug: string };

async function main() {
  console.log("📄 Seed de Categorias de Documentos (REGIF | schema: DocumentCategory)");

  // Baseadas no Estatuto (Art. 90-92) + categorias amplas para Portal da Transparência
  const categories: Cat[] = [
    // ===== Documentos Administrativos (Art. 90) =====
    { name: "Atas", slug: "atas" },
    { name: "Ofícios", slug: "oficios" },
    { name: "Ofícios Conjuntos", slug: "oficios-conjuntos" },
    { name: "Ofícios Circulares", slug: "oficios-circulares" },
    { name: "Declarações", slug: "declaracoes" },
    { name: "Certificados", slug: "certificados" },

    // ===== Atos Administrativos (Art. 92) =====
    { name: "Resoluções", slug: "resolucoes" },
    { name: "Deliberações", slug: "deliberacoes" },
    { name: "Portarias", slug: "portarias" },

    // ===== Instâncias e Reuniões (estrutura do Estatuto) =====
    { name: "CONEIF (Congresso)", slug: "coneif" },
    { name: "PLEGIF (Plenária)", slug: "plegif" },
    { name: "CODAG (Conselho de Dirigentes)", slug: "codag" },
    { name: "CODIC (Conselhos de Turma)", slug: "codic" },
    { name: "Conselho Fiscal", slug: "conselho-fiscal" },

    // ===== Eleições, Representação e Participação =====
    { name: "Editais", slug: "editais" },
    { name: "Processos Eleitorais", slug: "processos-eleitorais" },
    { name: "Comissões (Eleitoral, Disciplinar etc.)", slug: "comissoes" },
    { name: "Listas de Presença e Credenciamento", slug: "listas-de-presenca-e-credenciamento" },

    // ===== Transparência e Prestação de Contas (Portal) =====
    { name: "Prestação de Contas", slug: "prestacao-de-contas" },
    { name: "Balancetes e Demonstrativos", slug: "balancetes-e-demonstrativos" },
    { name: "Relatórios Financeiros", slug: "relatorios-financeiros" },
    { name: "Notas Fiscais e Recibos", slug: "notas-fiscais-e-recibos" },
    { name: "Contratos, Convênios e Termos", slug: "contratos-convenios-e-termos" },
    { name: "Patrimônio e Inventário", slug: "patrimonio-e-inventario" },
    { name: "Doações e Contribuições", slug: "doacoes-e-contribuicoes" },

    // ===== Gestão e Planejamento =====
    { name: "Planos de Ação", slug: "planos-de-acao" },
    { name: "Relatórios de Gestão", slug: "relatorios-de-gestao" },
    { name: "Calendário e Programação", slug: "calendario-e-programacao" },
    { name: "Comunicados e Informes Oficiais", slug: "comunicados-e-informes-oficiais" },

    // ===== Normas e Regimentos =====
    { name: "Estatuto e Regimentos", slug: "estatuto-e-regimentos" },
    { name: "Normas e Diretrizes", slug: "normas-e-diretrizes" },
    { name: "Políticas (acessibilidade, diversidade, etc.)", slug: "politicas" },

    // ===== Apuração/Disciplina/Integridade (quando houver publicação) =====
    { name: "Procedimentos e Apurações", slug: "procedimentos-e-apuracoes" },

    // ===== Parcerias e Institucional Externo =====
    { name: "Correspondências Externas", slug: "correspondencias-externas" },
    { name: "Parcerias e Relações Institucionais", slug: "parcerias-e-relacoes-institucionais" },

    // ===== Outros =====
    { name: "Modelos e Templates", slug: "modelos-e-templates" },
    { name: "Materiais de Apoio", slug: "materiais-de-apoio" },
    { name: "Geral", slug: "geral" },
  ];

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const existing = await prisma.documentCategory.findFirst({
      where: {
        OR: [{ slug: c.slug }, { name: c.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.documentCategory.update({
        where: { id: existing.id },
        data: {
          name: c.name,
          slug: c.slug,
          sortOrder: i + 1, // ordem fixa e estável
        },
      });
      continue;
    }

    await prisma.documentCategory.create({
      data: {
        name: c.name,
        slug: c.slug,
        sortOrder: i + 1,
      },
    });
  }

  console.log(`✅ ${categories.length} categorias de documentos criadas/atualizadas.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed de categorias de documentos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
