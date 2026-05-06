/**
 * Textos e estilos de badges para status de pedido e pagamento (lojinha).
 * Valores internos permanecem em inglês (API); interface sempre em português.
 */

export const ORDER_STATUS_LABELS_PT: Record<string, string> = {
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_RECEIVED: "Pagamento recebido",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em separação",
  READY_FOR_PICKUP: "Pronto para retirada",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export const PAYMENT_STATUS_LABELS_PT: Record<string, string> = {
  PENDING: "Pagamento pendente",
  AUTHORIZED: "Pagamento autorizado",
  PAID: "Pago",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  REFUNDED: "Reembolsado",
  FAILED: "Pagamento falhou",
};

export const PAYMENT_METHOD_LABELS_PT: Record<string, string> = {
  UNKNOWN: "Não informado",
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BOLETO: "Boleto",
  CASH_ON_DELIVERY: "Pagamento na entrega",
  MANUAL: "Registro manual",
  OTHER: "Outro",
};

const ORDER_STATUS_BADGE: Record<string, string> = {
  AWAITING_PAYMENT: "bg-amber-100 text-amber-950 ring-1 ring-amber-300/60 shadow-sm",
  PAYMENT_RECEIVED: "bg-sky-100 text-sky-950 ring-1 ring-sky-300/60 shadow-sm",
  CONFIRMED: "bg-blue-100 text-blue-950 ring-1 ring-blue-300/60 shadow-sm",
  PROCESSING: "bg-violet-100 text-violet-950 ring-1 ring-violet-300/60 shadow-sm",
  READY_FOR_PICKUP: "bg-teal-100 text-teal-950 ring-1 ring-teal-300/60 shadow-sm",
  SHIPPED: "bg-cyan-100 text-cyan-950 ring-1 ring-cyan-300/60 shadow-sm",
  DELIVERED: "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/70 shadow-sm",
  CANCELLED: "bg-red-100 text-red-900 ring-1 ring-red-300/70 shadow-sm",
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-950 ring-1 ring-amber-300/60",
  AUTHORIZED: "bg-indigo-100 text-indigo-950 ring-1 ring-indigo-300/60",
  PAID: "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/70",
  PARTIALLY_REFUNDED: "bg-orange-100 text-orange-950 ring-1 ring-orange-300/60",
  REFUNDED: "bg-slate-200 text-slate-800 ring-1 ring-slate-300/80",
  FAILED: "bg-red-100 text-red-900 ring-1 ring-red-300/70",
};

export function orderStatusBadgePt(status: string): { label: string; className: string } {
  return {
    label: ORDER_STATUS_LABELS_PT[status] ?? status,
    className: ORDER_STATUS_BADGE[status] ?? "bg-slate-100 text-slate-800 ring-1 ring-slate-200/90",
  };
}

export function paymentStatusBadgePt(payment: string): { label: string; className: string } {
  return {
    label: PAYMENT_STATUS_LABELS_PT[payment] ?? payment,
    className: PAYMENT_STATUS_BADGE[payment] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90",
  };
}

export function paymentMethodLabelPt(method: string): string {
  return PAYMENT_METHOD_LABELS_PT[method] ?? method;
}
