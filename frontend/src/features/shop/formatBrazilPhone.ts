/** Apenas dígitos, limitado ao máximo usual em celular BR (11). */
export function phoneDigitsOnly(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

/**
 * Máscara dinâmica no formato brasileiro:
 * - até 10 dígitos: (XX) XXXX-XXXX
 * - 11 dígitos: (XX) XXXXX-XXXX
 */
export function maskBrazilPhoneInput(raw: string): string {
  const d = phoneDigitsOnly(raw);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const cc = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${cc}) ${rest}`;
  if (d.length <= 10) return `(${cc}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${cc}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
