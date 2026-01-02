import { StatementItem } from "./types";

export type StatementTotals = {
  taxableSubtotal: number;
  totalWithoutTax: number;
  tax: number;
  total: number;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatYen = (value: number) => currencyFormatter.format(value);

export function calculateStatementTotals(items: StatementItem[], taxRate = 0.1): StatementTotals {
  const amounts = items.map((item) => {
    const qty = item.qty ?? 1;
    const unitPrice = item.unitPrice ?? 0;
    const amount = item.amount ?? qty * unitPrice;
    return { ...item, amount };
  });

  const taxableSubtotal = amounts
    .filter((item) => item.isTaxable !== false)
    .reduce((sum, item) => sum + (item.amount ?? 0), 0);

  const totalWithoutTax = amounts.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const tax = Math.round(taxableSubtotal * taxRate);
  const total = totalWithoutTax + tax;

  return { taxableSubtotal, totalWithoutTax, tax, total };
}
