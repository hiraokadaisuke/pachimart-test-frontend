import React from "react";

import { NaviTableColumn } from "./NaviTable";
import { StatusBadge } from "./StatusBadge";
import { type TradeStatusKey } from "./status";

const currencyFormatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export const standardNaviColumns: NaviTableColumn[] = [
  {
    key: "itemName",
    label: "機種名",
    render: (row) => row.itemName ?? row.item ?? row.productName ?? "-",
    width: "20%",
  },
  {
    key: "quantity",
    label: "台数",
    render: (row) => (row.quantity != null ? row.quantity : row.units ?? "-"),
    width: "72px",
  },
  {
    key: "partnerName",
    label: "相手先",
    render: (row) => row.partnerName ?? row.partner ?? row.buyer ?? row.seller ?? row.counterparty ?? "-",
    width: "18%",
  },
  {
    key: "totalAmount",
    label: "税込合計",
    render: (row) => (row.totalAmount != null ? currencyFormatter.format(row.totalAmount) : "-"),
    width: "140px",
  },
  {
    key: "status",
    label: "状況",
    render: (row) => {
      const value: string | undefined = row.status ?? row.state ?? row.progress;
      if (!value) return "-";

      return <StatusBadge statusKey={value as TradeStatusKey} />;
    },
    width: "120px",
  },
  {
    key: "updatedAt",
    label: "更新日時",
    render: (row) => row.updatedAt ?? row.date ?? row.lastUpdated ?? "-",
    width: "140px",
  },
];
