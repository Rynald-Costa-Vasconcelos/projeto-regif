import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  productId: string;
  productSlug: string;
  productTitle: string;
  unitPrice: string;
  imageUrl?: string | null;
  quantity: number;
};

type ShopCartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQty: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
  subtotal: number;
};

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

function parseMoney(s: string) {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addLine = useCallback((line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
    const qty = line.quantity ?? 1;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === line.productId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i]!, quantity: next[i]!.quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: line.productId,
          productSlug: line.productSlug,
          productTitle: line.productTitle,
          unitPrice: line.unitPrice,
          imageUrl: line.imageUrl,
          quantity: qty,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, quantity: number) => {
    const q = Math.max(0, Math.min(999, Math.floor(quantity)));
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, quantity: q } : l));
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + parseMoney(l.unitPrice) * l.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({ lines, addLine, setQty, removeLine, clear, subtotal }),
    [lines, addLine, setQty, removeLine, clear, subtotal]
  );

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error("useShopCart deve ser usado dentro de ShopCartProvider");
  return ctx;
}
