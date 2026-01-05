import { NaviType } from "@prisma/client";

import { fetchOnlineInquiries, type OnlineInquiryListItem } from "@/lib/online-inquiries/api";
import { findDevUserById } from "@/lib/dev-user/users";
import { buildTodosFromStatus } from "@/lib/dealings/todo";
import { type TradeRecord } from "@/lib/dealings/types";
import { calculateOnlineInquiryTotals } from "@/lib/online-inquiries/totals";

const buildAmountInput = (inquiry: OnlineInquiryListItem) => ({
    id: inquiry.id,
    unitPriceExclTax: inquiry.unitPriceExclTax,
    quantity: inquiry.quantity,
    shippingFee: inquiry.shippingFee,
    handlingFee: inquiry.handlingFee,
    taxRate: inquiry.taxRate,
    makerName: inquiry.makerName,
    productName: inquiry.productName ?? inquiry.machineName,
  });

const mapInquiryToTradeRecord = (inquiry: OnlineInquiryListItem): TradeRecord => {
  const sellerCompany = findDevUserById(inquiry.sellerUserId)?.companyName ?? inquiry.sellerUserId;
  const buyerCompany = findDevUserById(inquiry.buyerUserId)?.companyName ?? inquiry.buyerUserId;
  const amountInput = buildAmountInput(inquiry);
  const { items, totals } = calculateOnlineInquiryTotals(amountInput);
  const todos = buildTodosFromStatus("PAYMENT_REQUIRED");

  return {
    id: inquiry.id,
    naviType: NaviType.ONLINE_INQUIRY,
    status: "PAYMENT_REQUIRED",
    sellerUserId: inquiry.sellerUserId,
    buyerUserId: inquiry.buyerUserId,
    sellerName: sellerCompany,
    buyerName: buyerCompany,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    contractDate: inquiry.updatedAt,
    makerName: inquiry.makerName ?? undefined,
    itemName: inquiry.productName ?? inquiry.machineName ?? "商品",
    quantity: inquiry.quantity,
    totalAmount: totals.total,
    seller: {
      companyName: sellerCompany,
      userId: inquiry.sellerUserId,
    },
    buyer: {
      companyName: buyerCompany,
      userId: inquiry.buyerUserId,
    },
    todos,
    items,
    taxRate: inquiry.taxRate,
    shipping: {},
  } satisfies TradeRecord;
};

export async function loadAcceptedOnlineInquiryTrades(): Promise<TradeRecord[]> {
  try {
    const [buyer, seller] = await Promise.all([
      fetchOnlineInquiries("buyer"),
      fetchOnlineInquiries("seller"),
    ]);

    const accepted = [...buyer, ...seller].filter((inquiry) => inquiry.status === "ACCEPTED");
    const unique = new Map<string, TradeRecord>();

    accepted.forEach((inquiry) => {
      if (!unique.has(inquiry.id)) {
        unique.set(inquiry.id, mapInquiryToTradeRecord(inquiry));
      }
    });

    const trades = Array.from(unique.values());

    console.table(
      trades.map((trade) => ({
        id: trade.id,
        status: trade.status,
        todoKey: trade.todos?.find((todo) => todo.status === "open")?.kind ?? "-",
      }))
    );

    return trades;
  } catch (error) {
    console.error("Failed to load accepted online inquiries", error);
    return [];
  }
}
