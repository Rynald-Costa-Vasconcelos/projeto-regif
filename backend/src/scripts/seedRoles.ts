import { prisma } from "../lib/prismaClient";

async function main() {
  console.log("🌱 Iniciando Seed Completo (Cargos, Permissões e Institucional)...");

  // 1. CRIAR PERMISSÕES (Mantendo as suas e adicionando as novas do Schema 2.0)
  const permissionsData = [
    // --- Gestão de Pessoas ---
    { slug: 'users.view', description: 'Visualizar lista de usuários', module: 'Pessoas' },
    { slug: 'users.create', description: 'Criar/Convidar usuários', module: 'Pessoas' },
    { slug: 'users.delete', description: 'Remover usuários do sistema', module: 'Pessoas' },
    { slug: 'roles.manage', description: 'Gerenciar cargos e permissões', module: 'Pessoas' },

    // --- Notícias ---
    { slug: 'news.create', description: 'Escrever notícias', module: 'Notícias' },
    { slug: 'news.publish', description: 'Publicar notícias no site', module: 'Notícias' },
    { slug: 'news.delete', description: 'Apagar notícias permanentemente', module: 'Notícias' },
    
    // --- Documentos ---
    { slug: 'documents.upload', description: 'Fazer upload de arquivos', module: 'Documentos' },
    { slug: 'documents.manage', description: 'Gerenciar arquivos (editar/excluir)', module: 'Documentos' },

    // --- Institucional (Novas do Schema 2.0) ---
    { slug: 'guilds.manage', description: 'Gerenciar Grêmios Filiados e suas histórias', module: 'Institucional' },
    { slug: 'team.manage', description: 'Gerenciar Quadro de Gestão da REGIF', module: 'Institucional' },
    { slug: 'shop.manage', description: 'Gerenciar produtos da Lojinha', module: 'Institucional' },
  ];

  console.log(`🔄 Sincronizando ${permissionsData.length} permissões...`);
  
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  // 2. CRIAR/ATUALIZAR CARGO ADMIN
  console.log("👑 Configurando cargo ADMIN...");
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      permissions: {
        set: [], 
        connect: allPermissions.map(p => ({ id: p.id })) 
      }
    },
    create: {
      name: 'ADMIN',
      description: 'Acesso total ao painel',
      color: '#da2128', 
      isSystem: true,
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 3. CRIAR/ATUALIZAR CARGO EDITOR
  console.log("✏️ Configurando cargo EDITOR...");
  const editorPermissions = allPermissions.filter(p => 
    ['news.create', 'news.publish', 'documents.upload', 'users.view', 'guilds.manage', 'shop.manage'].includes(p.slug)
  );

  await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: {
      permissions: {
        set: [],
        connect: editorPermissions.map(p => ({ id: p.id }))
      }
    },
    create: {
      name: 'EDITOR',
      description: 'Gerencia conteúdos (notícias/documentos/grêmios)',
      color: '#10d431', 
      isSystem: false,
      permissions: {
        connect: editorPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 4. INSERIR GRÊMIOS (Conforme Art. 2º do Estatuto)
  console.log("🏛️ Sincronizando Grêmios Filiados...");
  const gremiosData = [
    { name: "Alzira Soriano", campus: "Avançado Lajes" }, // [cite: 28]
    { name: "Antônia Francimar", campus: "Pau dos Ferros" }, // [cite: 29]
    { name: "Benito Barros", campus: "Macau" }, // [cite: 31]
    { name: "Café Filho", campus: "Natal Centro-Histórico" }, // [cite: 32]
    { name: "Djalma Maranhão", campus: "Natal Central" }, // [cite: 34]
    { name: "Francisca Alves", campus: "João Câmara" }, // [cite: 35]
    { name: "Homero Homem", campus: "Canguaretama" }, // [cite: 36]
    { name: "José de Alencar", campus: "Apodi" }, // [cite: 37]
    { name: "José Ernesto Filho", campus: "Parelhas" }, // [cite: 39]
    { name: "Madalena Antunes", campus: "Ceará-Mirim" }, // [cite: 42]
    { name: "Marcel Lúcio", campus: "Ipanguaçu" }, // [cite: 44]
    { name: "Monsenhor Expedito", campus: "São Paulo do Potengi" }, // [cite: 46]
    { name: "Nilo Peçanha", campus: "Parnamirim" }, // [cite: 48]
    { name: "Nísia Floresta", campus: "Nova Cruz" }, // [cite: 50]
    { name: "Paulo Freire", campus: "Natal Zona Norte" }, // [cite: 52]
    { name: "Rady Dias", campus: "Currais Novos" }, // [cite: 54]
    { name: "Samira Delgado", campus: "Santa Cruz" }, // [cite: 56]
    { name: "Seridó Sertão", campus: "Caicó" }, // [cite: 58]
    { name: "Sérvulo Teixeira", campus: "São Gonçalo do Amarante" }, // [cite: 60]
    { name: "Valdemar dos Pássaros", campus: "Mossoró" }, // [cite: 62]
  ];

  for (const g of gremiosData) {
    const slug = g.campus.toLowerCase().replace(/ /g, '-');
    // Upsert nos grêmios para permitir rodar o script várias vezes sem duplicar
    await prisma.guild.upsert({
      where: { id: `guild-${slug}` }, // Usando um ID previsível para o seed
      update: { name: g.name, campus: g.campus },
      create: { 
        id: `guild-${slug}`,
        name: g.name, 
        campus: g.campus,
        isActive: true 
      }
    });
  }

  // 5. CATEGORIAS DE DOCUMENTOS (Ex: Art. 90 e 92 do Estatuto)
  console.log("📂 Criando Categorias de Documentos...");
  const docCats = [
    { name: "Editais", slug: "editais" },
    { name: "Atas", slug: "atas" }, // [cite: 846]
    { name: "Resoluções", slug: "resolucoes" }, // [cite: 859]
    { name: "Portarias", slug: "portarias" }, // [cite: 861]
    { name: "Prestação de Contas", slug: "contas" } // [cite: 112]
  ];

  for (const d of docCats) {
    // Seed idempotente mesmo se slug/name já existirem com combinações diferentes
    // (ex.: base antiga tinha o mesmo name com outro slug).
    const existing = await prisma.documentCategory.findFirst({
      where: { OR: [{ slug: d.slug }, { name: d.name }] },
      select: { id: true },
    });

    if (existing) {
      await prisma.documentCategory.update({
        where: { id: existing.id },
        data: { name: d.name, slug: d.slug },
      });
      continue;
    }

    await prisma.documentCategory.create({ data: d });
  }

  console.log("✅ Roles, Permissões, Grêmios e Categorias sincronizados!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });