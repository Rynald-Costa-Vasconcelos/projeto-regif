import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["PUBLISHED", "HIDDEN", "ARCHIVED"]).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").optional(),
  description: z.string().optional().nullable(),
  // ✅ aceita null e evita lixo com cuid quando vier string
  categoryId: z.union([z.string().cuid(), z.null()]).optional(),
  status: z.enum(["PUBLISHED", "HIDDEN", "ARCHIVED"]).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "HIDDEN", "ARCHIVED"]),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  sortOrder: z.number().int().min(0).optional().default(0),
  slug: z.string().optional(), // se não vier, gera pelo nome
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, "Nome obrigatório").optional(),
  sortOrder: z.number().int().min(0).optional(),
  slug: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
