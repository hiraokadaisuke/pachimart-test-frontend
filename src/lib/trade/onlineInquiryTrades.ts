import { NaviType } from "@prisma/client";

import { fetchOnlineInquiries, type OnlineInquiryListItem } from "@/lib/online-inquiries/api";
import { findDevUserById } from "@/lib/dev-user/users";
import { buildTodosFromStatus } from "@/lib/trade/todo";
import { type StatementItem, type TradeRecord } from "@/lib/trade/types";

const buildInquiryItems = (inquiry: OnlineInquiryListItem): StatementItem[] => {
  return [
    {
      lineId: `inquiry-${inquiry.id}`,
      maker: inquiry.makerName ?? undefined,
      itemName: inquiry.machineName ?? "商品",
      qty: inquiry.quantity,
      amount: inquiry.totalAmount,
      isTaxable: false,
    },
  ];
};

const mapInquiryToTradeRecord = (inquiry: OnlineInquiryListItem): TradeRecord => {
  const sellerCompany = findDevUserById(inquiry.sellerUserId)?.companyName ?? inquiry.sellerUserId;
  const buyerCompany = findDevUserById(inquiry.buyerUserId)?.companyName ?? inquiry.buyerUserId;
  const items = buildInquiryItems(inquiry);
  const todos = buildTodosFromStatus("APPROVAL_REQUIRED");

  return {
    id: inquiry.id,
    naviType: NaviType.ONLINE_INQUIRY,
    status: "APPROVAL_REQUIRED",
    sellerUserId: inquiry.sellerUserId,
    buyerUserId: inquiry.buyerUserId,
    sellerName: sellerCompany,
    buyerName: buyerCompany,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    contractDate: inquiry.updatedAt,
    makerName: inquiry.makerName ?? undefined,
    itemName: inquiry.machineName ?? "商品",
    quantity: inquiry.quantity,
    totalAmount: inquiry.totalAmount,
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
    taxRate: 0,
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

    return Array.from(unique.values());
  } catch (error) {
    console.error("Failed to load accepted online inquiries", error);
    return [];
  }
}
