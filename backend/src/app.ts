import express from "express";
import cors from "cors";
import path from "path";
import { router } from "./routes";
import { errorMiddleware } from "./core/http/error-middleware";

export function createApp() {
  const app = express();

  const ALLOWED_ORIGINS = new Set<string>([
    "https://regif.com.br",
    "https://www.regif.com.br",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
        return callback(new Error(`CORS bloqueado para origem: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "10mb" }));

  const UPLOADS_DIR = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(process.cwd(), "uploads");

  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      fallthrough: false,
      maxAge: "30d",
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "REGIF API" });
  });

  app.use("/api", router);

  app.use("/api", (_req, res) => {
    res.status(404).json({
      code: "route_not_found",
      message: "Rota não encontrada",
      details: null,
    });
  });

  app.use(errorMiddleware);

  return app;
}
