// src/lib/money.ts
export type TaxMode = "none" | "inclusive" | "exclusive";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcTax(amount: number, mode: TaxMode, rate = 7) {
  const r = rate / 100;
  if (mode === "none") return { base: round2(amount), vat: 0, total: round2(amount) };
  if (mode === "exclusive") return { base: round2(amount), vat: round2(amount * r), total: round2(amount * (1 + r)) };
  // inclusive: amount already includes VAT
  const base = amount / (1 + r);
  return { base: round2(base), vat: round2(amount - base), total: round2(amount) };
}

export const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);