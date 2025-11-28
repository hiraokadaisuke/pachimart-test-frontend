"use client";

import { NaviTable } from "@/components/transactions/NaviTable";
import { standardNaviColumns } from "@/components/transactions/standardColumns";

type DummyHistoryKind = "sales" | "purchases";

type DummyHistoryRow = {
  id: string;
  date: string;
  partnerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  updatedAt: string;
};

const HISTORY_DATA: Record<DummyHistoryKind, DummyHistoryRow[]> = {
  sales: [
    {
      id: "S-2025110101",
      date: "2025/11/01",
      partnerName: "株式会社アミューズ流通",
      itemName: "P 北斗の拳9 闘神",
      quantity: 6,
      totalAmount: 980000,
      status: "完了",
      updatedAt: "2025/11/02 12:10",
    },
    {
      id: "S-2025102803",
      date: "2025/10/28",
      partnerName: "有限会社スマイル",
      itemName: "P とある魔術の禁書目録",
      quantity: 4,
      totalAmount: 720000,
      status: "完了",
      updatedAt: "2025/10/29 09:30",
    },
  ],
  purchases: [
    {
      id: "P-2025110502",
      date: "2025/11/05",
      partnerName: "株式会社パチテック",
      itemName: "P スーパー海物語 JAPAN2 L1",
      quantity: 10,
      totalAmount: 1250000,
      status: "完了",
      updatedAt: "2025/11/06 17:50",
    },
    {
      id: "P-2025103011",
      date: "2025/10/30",
      partnerName: "株式会社ミドルウェーブ",
      itemName: "P ルパン三世 2000カラットの涙",
      quantity: 3,
      totalAmount: 840000,
      status: "完了",
      updatedAt: "2025/10/31 10:45",
    },
  ],
};

export function DummyHistoryTable({ kind }: { kind: DummyHistoryKind }) {
  const rows = HISTORY_DATA[kind];

  return <NaviTable columns={standardNaviColumns} rows={rows} />;
}
