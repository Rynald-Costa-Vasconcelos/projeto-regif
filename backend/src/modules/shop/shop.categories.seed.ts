import { prisma } from "../../lib/prismaClient";

type ShopCategorySeedChild = { name: string; slug: string };

type ShopCategorySeedParent = {
  name: string;
  slug: string;
  subcategories: ShopCategorySeedChild[];
};

/** Catálogo fixo REGIF — editar aqui e reiniciar a API (upsert) ou rodar `npm run db:seed:shop-categories`. */
export const SHOP_CATEGORIES_SEED: ShopCategorySeedParent[] = [
  {
    name: "Vestuário e Acessórios",
    slug: "vestuario-e-acessorios",
    subcategories: [
      { name: "Camisetas e Polos", slug: "camisetas-e-polos" },
      { name: "Moletons e Agasalhos", slug: "moletons-e-agasalhos" },
      { name: "Bonés e Toucas", slug: "bones-e-toucas" },
      { name: "Bolsas e Mochilas", slug: "bolsas-e-mochilas" },
      { name: "Meias e Calçados", slug: "meias-e-calcados" },
    ],
  },
  {
    name: "Papelaria e Escritório",
    slug: "papelaria-e-escritorio",
    subcategories: [
      { name: "Cadernos e Agendas", slug: "cadernos-e-agendas" },
      { name: "Canetas e Lápis", slug: "canetas-e-lapis" },
      { name: "Adesivos e Pins", slug: "adesivos-e-pins" },
      { name: "Pastas e Organizadores", slug: "pastas-e-organizadores" },
    ],
  },
  {
    name: "Utensílios e Lifestyle",
    slug: "utensilios-e-lifestyle",
    subcategories: [
      { name: "Copos e Canecas", slug: "copos-e-canecas" },
      { name: "Garrafas e Squeezes", slug: "garrafas-e-squeezes" },
      { name: "Chaveiros e Cordões", slug: "chaveiros-e-cordoes" },
      { name: "Decoração", slug: "decoracao" },
    ],
  },
  {
    name: "Tecnologia e Eletrônicos",
    slug: "tecnologia-e-eletronicos",
    subcategories: [
      { name: "Periféricos", slug: "perifericos" },
      { name: "Proteção", slug: "protecao" },
    ],
  },
  {
    name: "Categorias Especiais e Eventos",
    slug: "categorias-especiais-e-eventos",
    subcategories: [
      { name: "Ingressos e Passes", slug: "ingressos-e-passes" },
      { name: "Kits Promocionais", slug: "kits-promocionais" },
      { name: "Coleções Limitadas", slug: "colecoes-limitadas" },
    ],
  },
  {
    name: "Diversos",
    slug: "diversos",
    subcategories: [{ name: "Outros", slug: "outros" }],
  },
];

/**
 * Garante categorias e subcategorias (idempotente).
 * Chamado na subida da API e pelo script npm `db:seed:shop-categories`.
 */
export async function ensureShopCategoriesSeed(): Promise<void> {
  let parentOrder = 0;
  for (const parent of SHOP_CATEGORIES_SEED) {
    const baseOrder = parentOrder * 100;
    const p = await prisma.shopCategory.upsert({
      where: { slug: parent.slug },
      update: {
        name: parent.name,
        parentId: null,
        sortOrder: baseOrder,
        isActive: true,
      },
      create: {
        name: parent.name,
        slug: parent.slug,
        parentId: null,
        sortOrder: baseOrder,
        isActive: true,
      },
    });

    let childIdx = 0;
    for (const sub of parent.subcategories) {
      await prisma.shopCategory.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          parentId: p.id,
          sortOrder: baseOrder + childIdx + 1,
          isActive: true,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: p.id,
          sortOrder: baseOrder + childIdx + 1,
          isActive: true,
        },
      });
      childIdx += 1;
    }
    parentOrder += 1;
  }
}
