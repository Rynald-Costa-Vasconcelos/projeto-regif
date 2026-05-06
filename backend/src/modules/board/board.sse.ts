import type { Response } from "express";

type Client = { id: string; res: Response; createdAt: number };

const clients = new Map<string, Client>();

function now() {
  return Date.now();
}

function sseWrite(res: Response, lines: string[]) {
  res.write(lines.join("\n") + "\n\n");
}

export function addBoardSseClient(id: string, res: Response) {
  clients.set(id, { id, res, createdAt: now() });
}

export function removeBoardSseClient(id: string) {
  const c = clients.get(id);
  if (!c) return;
  try {
    c.res.end();
  } catch {
    /* ignore */
  }
  clients.delete(id);
}

export function broadcastBoardUpdate(payload: unknown) {
  const msg = JSON.stringify({ ts: new Date().toISOString(), payload });
  for (const [id, c] of clients) {
    try {
      sseWrite(c.res, ["event: board_update", `data: ${msg}`]);
    } catch {
      clients.delete(id);
    }
  }
}

// keep-alive: alguns proxies encerram conexões “ociosas”
setInterval(() => {
  for (const [id, c] of clients) {
    try {
      sseWrite(c.res, [": ping"]);
    } catch {
      clients.delete(id);
    }
  }
}, 25_000);

