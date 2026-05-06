declare namespace Express {
  export interface Request {
    // Essa propriedade é injetada pelo authMiddleware
    user?: {
      userId: string; // Mudamos de 'id' para 'userId' para bater com o JWT
      role: string;   // Ex: "ADMIN", "EDITOR"
    };
    /** E-mail normalizado (JWT “Meus pedidos” da lojinha) — injetado por `shopGuestAuthMiddleware`. */
    shopGuestEmail?: string;
  }
}