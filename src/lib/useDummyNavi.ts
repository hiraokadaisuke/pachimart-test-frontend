import { useMemo } from "react";

import { products } from "@/lib/dummyData";
import { type AdditionalFee } from "@/lib/navi/types";

export interface BuyerInfo {
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export interface PropertyInfo {
  modelName: string;
  maker: string;
  quantity: number;
  storageLocation: string;
  machineNumber?: string;
  prefecture?: string;
  hallName?: string;
  salesPrice: number;
  removalDate: string;
  note?: string;
}

type ShippingType = "元払" | "着払" | "引取";
type DocumentShippingType = "元払" | "着払" | "同梱" | "不要";

export interface TransactionConditions {
  price: number;
  quantity: number;
  removalDate: string;
  machineShipmentDate: string;
  machineShipmentType: ShippingType;
  documentShipmentDate: string;
  documentShipmentType: DocumentShippingType;
  paymentDue: string;
  freightCost: number;
  handlingFee: number;
  taxRate: number;
  otherFee1?: AdditionalFee;
  otherFee2?: AdditionalFee;
  notes: string;
  terms: string;
}

export interface MessageLog {
  id: string;
  sender: "buyer" | "seller";
  message: string;
  timestamp: string;
}

const breadcrumbBase = ["ホーム", "マイページ", "取引Navi"];

const buyerInfo: BuyerInfo = {
  companyName: "株式会社パチテック",
  contactPerson: "営業部 田中 太郎",
  phoneNumber: "03-1234-5678",
  email: "tanaka@example.com",
  notes: "平日10-18時に連絡可。",
};

const fallbackRemovalDate = "2025-11-22";

const basePropertyInfo: PropertyInfo = {
  modelName: "P スーパー海物語 JAPAN2 L1",
  maker: "三共",
  quantity: 4,
  storageLocation: "東京都江東区倉庫A-12",
  machineNumber: "#A102-#A105",
  prefecture: "東京都",
  hallName: "東京ベイホール",
  salesPrice: 320000,
  removalDate: fallbackRemovalDate,
  note: "搬出は午後14時以降でお願いします。",
};

const currentConditions: TransactionConditions = {
  price: 1280000,
  quantity: 4,
  removalDate: "2025-11-22",
  machineShipmentDate: "2025-11-25",
  machineShipmentType: "元払",
  documentShipmentDate: "2025-11-20",
  documentShipmentType: "同梱",
  paymentDue: "2025-11-21",
  freightCost: 22000,
  handlingFee: 10000,
  taxRate: 0.1,
  otherFee1: { label: "設置補助", amount: 15000 },
  otherFee2: { label: "下見費用", amount: 8000 },
  notes: "撤去作業は午後14時以降でお願いします。",
  terms:
    "買手都合によるキャンセルの場合、実費精算となります。\n納品後7日以内の初期不良のみ対応。",
};

const updatedConditions: TransactionConditions = {
  price: 1250000,
  quantity: 4,
  removalDate: "2025-11-22",
  machineShipmentDate: "2025-11-24",
  machineShipmentType: "元払",
  documentShipmentDate: "2025-11-19",
  documentShipmentType: "同梱",
  paymentDue: "2025-11-21",
  freightCost: 22000,
  handlingFee: 10000,
  taxRate: 0.1,
  otherFee1: { label: "設置補助", amount: 15000 },
  otherFee2: { label: "下見費用", amount: 8000 },
  notes: "撤去作業は午後14時以降でお願いします。",
  terms:
    "買手都合によるキャンセルの場合、実費精算となります。\n納品後7日以内の初期不良のみ対応。",
};

const documentFiles = ["注文書.pdf", "覚書.docx", "搬出指示書.xlsx"];

const photoThumbnails = ["搬出口周辺写真", "梱包イメージ", "倉庫全景"];

const messageLogs: MessageLog[] = [
  {
    id: "1",
    sender: "buyer",
    message: "搬出日と発送日の目安を教えてください。",
    timestamp: "2025/11/18 10:12",
  },
  {
    id: "2",
    sender: "seller",
    message: "搬出は11/22午後、発送は11/25を予定しています。",
    timestamp: "2025/11/18 10:35",
  },
  {
    id: "3",
    sender: "buyer",
    message: "ありがとうございます。引取でなく元払でお願いします。",
    timestamp: "2025/11/18 10:50",
  },
];

const buildPropertyInfo = (transactionId?: string): PropertyInfo => {
  const product = transactionId
    ? products.find((item) => String(item.id) === transactionId)
    : undefined;

  if (!product) return basePropertyInfo;

  return {
    modelName: product.name,
    maker: product.maker,
    quantity: product.quantity,
    storageLocation: product.warehouseName ?? basePropertyInfo.storageLocation,
    machineNumber: `#${product.id}`,
    prefecture: product.prefecture,
    hallName: product.sellerName,
    salesPrice: product.price,
    removalDate: product.removalDate ?? fallbackRemovalDate,
    note: product.note,
  };
};

const buildConditions = (transactionId?: string) => {
  const product = transactionId
    ? products.find((item) => String(item.id) === transactionId)
    : undefined;

  if (!product) {
    return { currentConditions, updatedConditions };
  }

  const basePrice = product.price * product.quantity;
  const removalDate = product.removalDate ?? fallbackRemovalDate;

  const nextCurrent = {
    ...currentConditions,
    price: basePrice,
    quantity: product.quantity,
    removalDate,
  } satisfies TransactionConditions;

  const nextUpdated = {
    ...updatedConditions,
    price: Math.max(basePrice - 30000, 0),
    quantity: product.quantity,
    removalDate,
  } satisfies TransactionConditions;

  return { currentConditions: nextCurrent, updatedConditions: nextUpdated };
};

export const formatCurrency = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export function useDummyNavi(transactionId?: string) {
  return useMemo(() => {
    const propertyInfo = buildPropertyInfo(transactionId);
    const { currentConditions, updatedConditions } = buildConditions(transactionId);

    return {
      transactionId,
      breadcrumbBase,
      editBreadcrumbItems: [...breadcrumbBase, "編集"],
      confirmBreadcrumbItems: [...breadcrumbBase, "確認"],
      buyerInfo,
      propertyInfo,
      currentConditions,
      updatedConditions,
      documentFiles,
      photoThumbnails,
      messageLogs,
      statusLabel: "依頼中",
    };
  }, [transactionId]);
}

export type { ShippingType, DocumentShippingType };
