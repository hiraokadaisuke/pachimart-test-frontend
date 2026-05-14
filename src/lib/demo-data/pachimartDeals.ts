import { loadAllSalesInvoices } from "@/lib/demo-data/salesInvoices";

export type PachimartDeal = {
  pachimartDealId: string;
  dealDate: string;
  makerName: string;
  machineName: string;
  category: string;
  quantity: number;
  customerName: string;
  totalAmount: number;
  warehouseName: string;
  shipmentStatus: "未作成" | "出庫待ち" | "出庫完了";
};

export const PACHIMART_DEMO_DEALS: PachimartDeal[] = [
  {
    pachimartDealId: "PM-DEMO-0001",
    dealDate: "2026-05-07",
    makerName: "平和",
    machineName: "ルパン三世〜復活のマモー〜",
    category: "本体",
    quantity: 1,
    customerName: "大阪商事",
    totalAmount: 60000,
    warehouseName: "埼玉倉庫",
    shipmentStatus: "未作成",
  },
  {
    pachimartDealId: "PM-DEMO-0002",
    dealDate: "2026-05-08",
    makerName: "オリンピア",
    machineName: "パチスロハイビスカス",
    category: "本体",
    quantity: 1,
    customerName: "大阪商事",
    totalAmount: 60000,
    warehouseName: "千葉倉庫",
    shipmentStatus: "未作成",
  },
  {
    pachimartDealId: "PM-DEMO-0003",
    dealDate: "2026-05-09",
    makerName: "藤商事",
    machineName: "とある科学の超電磁砲",
    category: "本体",
    quantity: 1,
    customerName: "北日本物産",
    totalAmount: 60000,
    warehouseName: "埼玉倉庫",
    shipmentStatus: "未作成",
  },
];

export const buildPachimartDealInvoiceMap = () => {
  const map = new Map<string, string>();
  loadAllSalesInvoices().forEach((invoice) => {
    const match = (invoice.remarks ?? "").match(/PachimartDealId:\s*([A-Z0-9-]+)/i);
    if (match?.[1]) map.set(match[1], invoice.invoiceId);
  });
  return map;
};
