"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NaviStatus, NaviType } from "@prisma/client";

import { TradeRecord } from "@/lib/dealings/types";
import { calculateStatementTotals } from "@/lib/dealings/calcTotals";
import { loadAllTradesWithApi } from "@/lib/dealings/dataSources";
import { NaviTable, NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type TradeStatusKey } from "@/components/transactions/status";
import { TradeMessageModal } from "@/components/transactions/TradeMessageModal";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { fetchMessagesByNaviId } from "@/lib/messages/api";
import type { TradeMessage } from "@/lib/messages/transform";
import { getInProgressDescription } from "@/lib/dealings/copy";
import { getStatementPath } from "@/lib/dealings/navigation";
import { getTodoPresentation } from "@/lib/dealings/todo";
import { todoUiMap, type TodoUiDef } from "@/lib/todo/todoUiMap";
import { fetchNavis, mapNaviToTradeRecord } from "@/lib/dealings/api";
import {
  fetchOnlineInquiries,
  respondOnlineInquiry,
  type OnlineInquiryListItem,
  type OnlineInquiryStatus,
} from "@/lib/online-inquiries/api";

type DealingSectionWithInquiry = TodoUiDef["section"] | "onlineInquiry";

const APPROVAL_LABEL = todoUiMap["application_sent"];

const ONLINE_INQUIRY_DESCRIPTION = {
  buy: "送信したオンライン問い合わせの回答をお待ちください。不要になった場合はキャンセルできます。",
  sell: "買主から届いたオンライン問い合わせです。内容を確認して受諾または見送りを選択してください。",
};

type DealingRow = {
  id: string;
  naviId?: number;
  naviType?: NaviType;
  status: TradeStatusKey;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  scheduledShipDate: string;
  sellerUserId: string;
  buyerUserId: string;
  sellerName: string;
  buyerName: string;
  kind: "buy" | "sell";
  section: DealingSectionWithInquiry;
  isOpen: boolean;
};

type InquiryRow = {
  id: string;
  naviId?: number;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  sellerUserId: string;
  buyerUserId: string;
  kind: "buy" | "sell";
  status: OnlineInquiryStatus;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCurrency(amount: number) {
  const formatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
  return formatter.format(amount);
}

const toNumericNaviId = (value: string | number | undefined): number | null => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const resolveDealingKind = (
  buyerUserId: string | undefined,
  sellerUserId: string | undefined,
  viewerId: string
) => {
  if (buyerUserId === viewerId) return "buy" as const;
  if (sellerUserId === viewerId) return "sell" as const;
  return "buy" as const;
};

const resolveCounterpartyName = (
  params: {
    buyerUserId: string | undefined;
    sellerUserId: string | undefined;
    buyerCompanyName?: string | null;
    sellerCompanyName?: string | null;
  },
  viewerId: string
) => {
  if (params.buyerUserId === viewerId) return params.sellerCompanyName ?? "（未設定）";
  if (params.sellerUserId === viewerId) return params.buyerCompanyName ?? "（未設定）";
  return "（対象外）";
};

function buildDealingRow(dealing: TradeRecord, viewerId: string): DealingRow {
  const totals = calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1);
  const primaryItem = dealing.items[0];
  const totalQty = dealing.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  const updatedAtLabel = formatDateTime(dealing.updatedAt ?? dealing.createdAt ?? new Date().toISOString());
  const sellerId = dealing.sellerUserId ?? dealing.seller.userId ?? "seller";
  const buyerId = dealing.buyerUserId ?? dealing.buyer.userId ?? "buyer";
  const kind = resolveDealingKind(buyerId, sellerId, viewerId);
  const todo = getTodoPresentation(dealing, kind === "buy" ? "buyer" : "seller");
  const section: DealingSectionWithInquiry =
    dealing.naviType === NaviType.ONLINE_INQUIRY ? "onlineInquiry" : todo.section;

  return {
    id: dealing.id,
    naviId: dealing.naviId,
    naviType: dealing.naviType,
    status: todo.todoKind,
    section,
    updatedAt: updatedAtLabel,
    partnerName: resolveCounterpartyName(
      {
        buyerUserId: buyerId,
        sellerUserId: sellerId,
        buyerCompanyName: dealing.buyer.companyName ?? dealing.buyerName,
        sellerCompanyName: dealing.seller.companyName ?? dealing.sellerName,
      },
      viewerId
    ),
    makerName: primaryItem?.maker ?? "-",
    itemName: primaryItem?.itemName ?? "商品",
    quantity: totalQty,
    totalAmount: totals.total,
    scheduledShipDate: dealing.contractDate ?? "-",
    kind,
    sellerUserId: sellerId,
    buyerUserId: buyerId,
    sellerName: dealing.seller.companyName,
    buyerName: dealing.buyer.companyName,
    isOpen: !!todo.activeTodo,
  };
}

function buildInquiryRowFromDto(dto: OnlineInquiryListItem, viewerId: string): InquiryRow {
  const updatedAtLabel = formatDateTime(dto.updatedAt ?? dto.createdAt);
  const kind = resolveDealingKind(dto.buyerUserId, dto.sellerUserId, viewerId);

  return {
    id: dto.id,
    naviId: undefined,
    status: dto.status,
    partnerName: resolveCounterpartyName(
      {
        buyerUserId: dto.buyerUserId,
        sellerUserId: dto.sellerUserId,
        buyerCompanyName: dto.buyerCompanyName,
        sellerCompanyName: dto.sellerCompanyName,
      },
      viewerId
    ),
    makerName: dto.makerName ?? "-",
    itemName: dto.productName ?? dto.machineName ?? "商品",
    quantity: dto.quantity,
    totalAmount: dto.totalAmount,
    updatedAt: updatedAtLabel,
    sellerUserId: dto.sellerUserId,
    buyerUserId: dto.buyerUserId,
    kind,
  };
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [dealings, setDealings] = useState<TradeRecord[]>([]);
  const [onlineInquiryRows, setOnlineInquiryRows] = useState<InquiryRow[]>([]);
  const [sellerApprovalRows, setSellerApprovalRows] = useState<DealingRow[]>([]);
  const [buyerNaviApprovalRows, setBuyerNaviApprovalRows] = useState<DealingRow[]>([]);
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [messageTarget, setMessageTarget] = useState<string | null>(null);
  const [messageNaviId, setMessageNaviId] = useState<number | null>(null);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [pendingInquiryIds, setPendingInquiryIds] = useState<Set<string>>(new Set());

  const keywordLower = keyword.toLowerCase();

  useEffect(() => {
    loadAllTradesWithApi().then(setDealings).catch((error) => console.error(error));
  }, []);

  const fetchApprovalRows = useCallback(async () => {
    try {
      const apiDealings = await fetchNavis();
      const mappedDealings = apiDealings
        .filter(
          (dealing) =>
            dealing.status === NaviStatus.SENT &&
            (dealing.ownerUserId === currentUser.id || dealing.buyerUserId === currentUser.id)
        )
        .map((dealing) => mapNaviToTradeRecord(dealing))
        .filter((dealing): dealing is TradeRecord => Boolean(dealing));

      const rows = mappedDealings
        .map((dealing) => buildDealingRow(dealing, currentUser.id))
        .filter((row) => row.section === "approval" && row.isOpen);

      setSellerApprovalRows(rows.filter((row) => row.kind === "sell"));
      setBuyerNaviApprovalRows(rows.filter((row) => row.kind === "buy"));
    } catch (error) {
      console.error(error);
      setSellerApprovalRows([]);
      setBuyerNaviApprovalRows([]);
    }
  }, [currentUser.id]);

  const loadInquiries = useCallback(async () => {
    try {
      const [buyer, seller] = await Promise.all([
        fetchOnlineInquiries("buyer"),
        fetchOnlineInquiries("seller"),
      ]);

      const rows = [
        ...buyer.map((inquiry) => buildInquiryRowFromDto(inquiry, currentUser.id)),
        ...seller.map((inquiry) => buildInquiryRowFromDto(inquiry, currentUser.id)),
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setOnlineInquiryRows(rows);
    } catch (error) {
      console.error(error);
      setOnlineInquiryRows([]);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchApprovalRows();
  }, [fetchApprovalRows]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const mappedDealingRows = useMemo(
    () => dealings.map((dealing) => buildDealingRow(dealing, currentUser.id)),
    [currentUser.id, dealings]
  );

  const naviIds = useMemo(
    () =>
      new Set(
        mappedDealingRows
          .map((row) => toNumericNaviId(row.naviId))
          .filter((id): id is number => id !== null)
      ),
    [mappedDealingRows]
  );

  const filteredDealingRows = useMemo(
    () =>
      mappedDealingRows
        .filter((dealing) => dealing.section === "approval" && dealing.isOpen)
        .filter(
          (dealing) =>
            dealing.sellerUserId === currentUser.id || dealing.buyerUserId === currentUser.id
        )
        .filter((dealing) => {
          if (!keywordLower) return true;
          return (
            dealing.itemName.toLowerCase().includes(keywordLower) ||
            dealing.partnerName.toLowerCase().includes(keywordLower)
          );
        }),
    [currentUser.id, keywordLower, mappedDealingRows]
  );
  const buyerApprovalRowsFromDealings = filteredDealingRows.filter(
    (row) => row.kind === "buy" && row.section === "approval"
  );

  const filteredSellerApprovalRows = useMemo(
    () =>
      sellerApprovalRows.filter((dealing) => {
        if (!keywordLower) return true;
        return (
          dealing.itemName.toLowerCase().includes(keywordLower) ||
          dealing.partnerName.toLowerCase().includes(keywordLower)
        );
      }),
    [keywordLower, sellerApprovalRows]
  );

  const filteredBuyerNaviApprovalRows = useMemo(
    () =>
      buyerNaviApprovalRows.filter((dealing) => {
        if (!keywordLower) return true;
        return (
          dealing.itemName.toLowerCase().includes(keywordLower) ||
          dealing.partnerName.toLowerCase().includes(keywordLower)
        );
      }),
    [keywordLower, buyerNaviApprovalRows]
  );

  const buyerApprovalRows = useMemo(() => {
    const rows: DealingRow[] = [];
    const naviIds = new Set<number>();
    const ids = new Set<string>();

    buyerApprovalRowsFromDealings.forEach((row) => {
      rows.push(row);
      if (typeof row.naviId === "number") {
        naviIds.add(row.naviId);
      }
      ids.add(row.id);
    });

    filteredBuyerNaviApprovalRows.forEach((row) => {
      const hasNaviId = typeof row.naviId === "number";
      if (hasNaviId) {
        const naviId = row.naviId as number;
        if (naviIds.has(naviId)) return;
        naviIds.add(naviId);
      } else {
        if (ids.has(row.id)) return;
        ids.add(row.id);
      }
      rows.push(row);
    });

    return rows;
  }, [buyerApprovalRowsFromDealings, filteredBuyerNaviApprovalRows]);

  const mappedInquiryRows = useMemo(
    () =>
      onlineInquiryRows.filter((inquiry) => {
        const naviId = toNumericNaviId(inquiry.naviId ?? inquiry.id);
        if (naviId === null) return true;
        return !naviIds.has(naviId);
      }),
    [onlineInquiryRows, naviIds]
  );

  const filteredInquiryRows = useMemo(
    () =>
      mappedInquiryRows
        .filter((inquiry) => inquiry.status === "INQUIRY_RESPONSE_REQUIRED")
        .filter(
          (inquiry) => inquiry.sellerUserId === currentUser.id || inquiry.buyerUserId === currentUser.id
        )
        .filter((inquiry) => {
          if (!keywordLower) return true;
          return (
            inquiry.itemName.toLowerCase().includes(keywordLower) ||
            inquiry.partnerName.toLowerCase().includes(keywordLower)
          );
        }),
    [currentUser.id, keywordLower, mappedInquiryRows]
  );

  const buyerInquiryRows = filteredInquiryRows.filter((row) => row.kind === "buy");
  const sellerInquiryRows = filteredInquiryRows.filter((row) => row.kind === "sell");

  const getStatementDestination = (row: DealingRow) =>
    getStatementPath(row.id, row.status, row.kind === "buy" ? "buyer" : "seller", {
      naviId: row.naviId,
    });

  const inquiryStatusBadge = (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
      回答待ち
    </span>
  );

  const resolveNaviId = (rowId: string | number | undefined) => {
    if (typeof rowId === "string") return rowId;
    if (typeof rowId === "number") return String(rowId);
    return null;
  };

  const handleCancelInquiry = async (inquiryId: string | number | undefined) => {
    const targetId = resolveNaviId(inquiryId);
    if (!targetId) return;
    setPendingInquiryIds((prev) => new Set(prev).add(targetId));
    try {
      await respondOnlineInquiry(targetId, "cancel");
      await loadInquiries();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingInquiryIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const handleAcceptInquiry = async (inquiryId: string | number | undefined) => {
    const targetId = resolveNaviId(inquiryId);
    if (!targetId) return;
    setPendingInquiryIds((prev) => new Set(prev).add(targetId));
    try {
      await respondOnlineInquiry(targetId, "accept");
      await loadInquiries();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingInquiryIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const handleDeclineInquiry = async (inquiryId: string | number | undefined) => {
    const targetId = resolveNaviId(inquiryId);
    if (!targetId) return;
    setPendingInquiryIds((prev) => new Set(prev).add(targetId));
    try {
      await respondOnlineInquiry(targetId, "decline");
      await loadInquiries();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingInquiryIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const dealingColumnBase: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: (row: DealingRow) => (
        <StatusBadge statusKey={row.status} context="inProgress" />
      ),
    },
    {
      key: "updatedAt",
      label: "更新日時",
      width: "160px",
    },
    {
      key: "partnerName",
      label: "取引先",
      width: "18%",
    },
    {
      key: "makerName",
      label: "メーカー",
      width: "140px",
    },
    {
      key: "itemName",
      label: "機種名",
      width: "22%",
    },
    {
      key: "quantity",
      label: "台数",
      width: "80px",
      render: (row: DealingRow) => `${row.quantity}台`,
    },
    {
      key: "totalAmount",
      label: "合計金額（税込）",
      width: "140px",
      render: (row: DealingRow) => formatCurrency(row.totalAmount),
    },
    {
      key: "scheduledShipDate",
      label: "発送予定日",
      width: "140px",
    },
    {
      key: "document",
      label: "明細書",
      width: "110px",
      render: (row: DealingRow) => {
        const statementPath = getStatementDestination(row);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(statementPath);
            }}
            className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
          >
            PDF
          </button>
        );
      },
    },
  ];

  const messageColumn: NaviTableColumn = {
    key: "message",
    label: "メッセージ",
    width: "110px",
    render: (row: DealingRow) => (
      <button
        type="button"
        className="inline-flex items-center justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenMessage(row);
        }}
      >
        メッセージ
      </button>
    ),
  };

  const dealingColumnsWithoutAction: NaviTableColumn[] = [
    ...dealingColumnBase,
    messageColumn,
  ];

  const buyerApprovalColumns: NaviTableColumn[] = dealingColumnsWithoutAction.map((col) =>
    col.key === "document"
      ? {
          ...col,
          label: "発送先入力",
          render: (row: DealingRow) => {
            const statementPath = getStatementDestination(row);
            return (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(statementPath);
                }}
              >
                入力
              </button>
            );
          },
        }
      : col
  );

  const inquiryColumnBase: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: () => inquiryStatusBadge,
    },
    {
      key: "updatedAt",
      label: "更新日時",
      width: "160px",
    },
    {
      key: "partnerName",
      label: "取引先",
      width: "18%",
    },
    {
      key: "makerName",
      label: "メーカー",
      width: "140px",
    },
    {
      key: "itemName",
      label: "機種名",
      width: "22%",
    },
    {
      key: "quantity",
      label: "台数",
      width: "80px",
      render: (row: InquiryRow) => `${row.quantity}台`,
    },
    {
      key: "totalAmount",
      label: "合計金額（税込）",
      width: "140px",
      render: (row: InquiryRow) => formatCurrency(row.totalAmount),
    },
  ];

  const buyerInquiryColumns: NaviTableColumn[] = [
    ...inquiryColumnBase,
    {
      key: "action",
      label: "操作",
      width: "120px",
      render: (row: InquiryRow) => {
        const targetId = resolveNaviId(row.naviId ?? row.id);
        const isPending = targetId ? pendingInquiryIds.has(targetId) : false;

        return (
          <button
            type="button"
            disabled={isPending}
            className="inline-flex w-full justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              handleCancelInquiry(row.naviId ?? row.id);
            }}
          >
            キャンセル
          </button>
        );
      },
    },
  ];

  const sellerInquiryColumns: NaviTableColumn[] = [
    ...inquiryColumnBase,
    {
      key: "action",
      label: "操作",
      width: "180px",
      render: (row: InquiryRow) => {
        const targetId = resolveNaviId(row.naviId ?? row.id);
        const isPending = targetId ? pendingInquiryIds.has(targetId) : false;

        return (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              className="inline-flex flex-1 justify-center rounded bg-indigo-700 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800"
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptInquiry(row.naviId ?? row.id);
              }}
            >
              受諾
            </button>
            <button
              type="button"
              disabled={isPending}
              className="inline-flex flex-1 justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                handleDeclineInquiry(row.naviId ?? row.id);
              }}
            >
              見送り
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    if (messageNaviId === null) {
      setMessages([]);
      return;
    }

    if (!Number.isInteger(messageNaviId)) {
      console.error("Invalid navi id for messages", messageTarget);
      setMessages([]);
      return;
    }

    fetchMessagesByNaviId(messageNaviId)
      .then(setMessages)
      .catch((error) => {
        console.error(error);
        setMessages([]);
      });
  }, [messageNaviId, messageTarget]);

  const handleOpenMessage = (row: DealingRow) => {
    setMessageTarget(row.id);

    const naviId = toNumericNaviId(row.naviId ?? row.id);
    if (naviId !== null) {
      setMessageNaviId(naviId);
      return;
    }

    console.error("Invalid navi id for messages", row.id);
    setMessageNaviId(null);
  };

  const messageThread = messages;

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-8 px-4 md:px-6 xl:px-8">
      <TransactionFilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        hideStatusFilter
      />

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">
          購入中の商品
        </h2>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("buy", "application_sent")}
          >
            {APPROVAL_LABEL.title}
          </SectionHeader>
          <NaviTable
            columns={buyerApprovalColumns}
            rows={buyerApprovalRows}
            emptyMessage="現在承認待ちの取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as DealingRow))}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={ONLINE_INQUIRY_DESCRIPTION.buy}>
            オンライン問い合わせ
          </SectionHeader>
          <NaviTable
            columns={buyerInquiryColumns}
            rows={buyerInquiryRows}
            emptyMessage="現在オンライン問い合わせはありません。"
            onRowClick={(row) => row.id && router.push(`/navi/inquiries/${(row as InquiryRow).id}`)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">
          売却中の商品
        </h2>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("sell", "application_sent")}
          >
            {APPROVAL_LABEL.title}
          </SectionHeader>
          <NaviTable
            columns={dealingColumnsWithoutAction}
            rows={filteredSellerApprovalRows}
            emptyMessage="現在承認待ちの送信済み取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as DealingRow))}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={ONLINE_INQUIRY_DESCRIPTION.sell}>
            オンライン問い合わせ
          </SectionHeader>
          <NaviTable
            columns={sellerInquiryColumns}
            rows={sellerInquiryRows}
            emptyMessage="現在オンライン問い合わせはありません。"
            onRowClick={(row) => row.id && router.push(`/navi/inquiries/${(row as InquiryRow).id}`)}
          />
        </div>
      </section>

      <TradeMessageModal
        open={messageTarget !== null}
        tradeId={messageTarget}
        messages={messageThread}
        onClose={() => {
          setMessageTarget(null);
          setMessageNaviId(null);
        }}
      />
    </section>
  );
}
