import { z } from "zod";

export const newsLinkSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, "URL obrigatória").url("URL inválida"),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

export const createPostSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  excerpt: z.string().optional(),
  contentHtml: z.string().min(10, "O conteúdo é obrigatório"),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),

  showFeaturedImage: z.boolean().default(true),
  enableGallery: z.boolean().default(false),
  enableLinks: z.boolean().default(false),

  links: z.array(newsLinkSchema).optional().default([]),

  // legado (mantido por compatibilidade)
  coverAssetId: z.string().optional().nullable(),

  // commit atômico
  coverTmpId: z.string().optional().nullable(),
  galleryTmpIds: z
    .array(z.string())
    .max(10, "Limite de 10 imagens na galeria")
    .optional()
    .default([]),
});

export const updatePostSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres").optional(),
  excerpt: z.string().optional(),
  contentHtml: z.string().min(10, "O conteúdo é obrigatório").optional(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional(),
  isFeatured: z.boolean().optional(),

  showFeaturedImage: z.boolean().optional(),
  enableGallery: z.boolean().optional(),
  enableLinks: z.boolean().optional(),

  links: z.array(newsLinkSchema).optional(),

  coverAssetId: z.string().optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
