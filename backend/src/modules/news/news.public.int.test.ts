import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listPublicMock = vi.fn();
const listPublicCategoriesMock = vi.fn();
const getBySlugMock = vi.fn();

vi.mock("./news.service", () => ({
  listPublic: listPublicMock,
  listPublicCategories: listPublicCategoriesMock,
  getBySlug: getBySlugMock,
  listAdmin: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  listCategoriesAdmin: vi.fn(),
  deletePost: vi.fn(),
}));

describe("News public API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public list as {items, meta}", async () => {
    listPublicMock.mockResolvedValue({
      items: [{ id: "n1", title: "Noticia A" }],
      meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
    });

    const { createApp } = await import("../../app");
    const app = createApp();
    const res = await request(app).get("/api/news/public");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items: [{ id: "n1", title: "Noticia A" }],
      meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
    });
  });

  it("returns 404 error envelope when slug is missing", async () => {
    getBySlugMock.mockResolvedValue(null);

    const { createApp } = await import("../../app");
    const app = createApp();
    const res = await request(app).get("/api/news/slug/inexistente");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("news_not_found");
    expect(res.body.message).toBe("Notícia não encontrada");
  });
});
