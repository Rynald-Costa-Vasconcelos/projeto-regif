import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listPublicMock = vi.fn();
const listPublicCategoriesMock = vi.fn();
const getBySlugMock = vi.fn();
const downloadBySlugMock = vi.fn();

vi.mock("./documents.service", () => ({
  listPublic: listPublicMock,
  listPublicCategories: listPublicCategoriesMock,
  getBySlug: getBySlugMock,
  downloadBySlug: downloadBySlugMock,
  listAdmin: vi.fn(),
  getById: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  updateDocumentStatus: vi.fn(),
  deleteDocument: vi.fn(),
  listCategoriesAdmin: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

describe("Documents public API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns categories as {items, meta:null}", async () => {
    listPublicCategoriesMock.mockResolvedValue({
      items: [{ id: "c1", name: "Editais", slug: "editais", sortOrder: 1 }],
    });

    const { createApp } = await import("../../app");
    const app = createApp();
    const res = await request(app).get("/api/documents/public/categories");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items: [{ id: "c1", name: "Editais", slug: "editais", sortOrder: 1 }],
      meta: null,
    });
  });

  it("returns 404 error envelope when document slug is missing", async () => {
    getBySlugMock.mockResolvedValue(null);

    const { createApp } = await import("../../app");
    const app = createApp();
    const res = await request(app).get("/api/documents/slug/inexistente");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("document_not_found");
    expect(res.body.message).toBe("Documento não encontrado");
  });
});
