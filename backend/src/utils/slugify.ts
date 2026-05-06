export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Separa acentos das letras base
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/\s+/g, "-") // Troca espaços por hífens
    .replace(/[^\w\-]+/g, "") // Remove caracteres especiais
    .replace(/\-\-+/g, "-") // Remove hífens duplicados
    .replace(/^-+/, "") // Remove hífen do começo
    .replace(/-+$/, ""); // Remove hífen do fim
}