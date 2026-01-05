import { calculateStatementTotals, type StatementTotals } from "@/lib/dealings/calcTotals";
import { type StatementItem } from "@/lib/dealings/types";

export type OnlineInquiryAmounts = {
  id?: string;
  unitPriceExclTax: number;
  quantity: number;
  shippingFee?: number;
  handlingFee?: number;
  taxRate?: number;
  makerName?: string | null;
  productName?: string | null;
};

export const buildOnlineInquiryItems = (amounts: OnlineInquiryAmounts): StatementItem[] => {
  const linePrefix = amounts.id ? `inquiry-${amounts.id}` : "inquiry";
  const items: StatementItem[] = [
    {
      lineId: `${linePrefix}-main`,
      maker: amounts.makerName ?? undefined,
      itemName: amounts.productName ?? "商品",
      qty: amounts.quantity,
      unitPrice: amounts.unitPriceExclTax,
      isTaxable: true,
    },
  ];

  if ((amounts.shippingFee ?? 0) !== 0) {
    items.push({
      lineId: `${linePrefix}-shipping`,
      itemName: "送料",
      amount: amounts.shippingFee,
      isTaxable: true,
    });
  }

  if ((amounts.handlingFee ?? 0) !== 0) {
    items.push({
      lineId: `${linePrefix}-handling`,
      itemName: "出庫手数料",
      amount: amounts.handlingFee,
      isTaxable: true,
    });
  }

  return items;
};

export const calculateOnlineInquiryTotals = (
  amounts: OnlineInquiryAmounts
): { items: StatementItem[]; totals: StatementTotals } => {
  const items = buildOnlineInquiryItems(amounts);
  const totals = calculateStatementTotals(items, amounts.taxRate ?? 0.1);
  return { items, totals };
};
