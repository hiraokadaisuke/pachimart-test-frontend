import React from "react";

import { NaviTableColumn } from "./NaviTable";

const currencyFormatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

const statusBadgeClass = "inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700";

export const standardNaviColumns: NaviTableColumn[] = [
  {
    key: "itemName",
    label: "物件名（機種名）",
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
      return value ? <span className={statusBadgeClass}>{value}</span> : "-";
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
