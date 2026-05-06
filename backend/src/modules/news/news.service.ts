// ======================================================
// FACADE / BARREL DE COMPATIBILIDADE
// Mantém compatibilidade com imports antigos
// ======================================================

// Queries / listagens / getters
export * from "./services/news.query.service";

// Mutations (create, update, delete, status)
export * from "./services/news.mutation.service";

// Erros compartilhados
export * from "./services/news.errors";
