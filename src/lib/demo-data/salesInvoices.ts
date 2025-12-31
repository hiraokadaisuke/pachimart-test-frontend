import type { SalesInvoice } from "@/types/salesInvoices";

export const SEED_SALES_INVOICES: SalesInvoice[] = [
  {
    invoiceId: "S-V-230001",
    invoiceType: "vendor",
    createdAt: "2023-03-12T09:00:00Z",
    issuedDate: "2023/03/12",
    vendorName: "株式会社あさひ商事",
    staff: "木村",
    transferDate: "2023-03-20",
    items: [
      {
        maker: "サミー",
        productName: "パチスロ炎舞",
        type: "スロット",
        quantity: 1,
        unitPrice: 328000,
        amount: 328000,
        note: "―",
      },
    ],
    subtotal: 298182,
    tax: 29818,
    insurance: 0,
    totalAmount: 328000,
    remarks: "",
  },
  {
    invoiceId: "S-H-230014",
    invoiceType: "hall",
    createdAt: "2023-04-02T09:00:00Z",
    issuedDate: "2023/04/02",
    vendorName: "ダイナム渋谷店",
    staff: "佐々木",
    transferDate: "2023-04-10",
    items: [
      {
        maker: "京楽",
        productName: "ぱちんこ銀河伝説",
        type: "パチンコ",
        quantity: 1,
        unitPrice: 742000,
        amount: 742000,
        note: "",
      },
    ],
    subtotal: 707619,
    tax: 35381,
    insurance: 0,
    totalAmount: 742000,
    remarks: "",
  },
  {
    invoiceId: "S-V-230019",
    invoiceType: "vendor",
    createdAt: "2023-05-18T09:00:00Z",
    issuedDate: "2023/05/18",
    vendorName: "株式会社イーストトレーディング",
    staff: "高橋",
    transferDate: "2023-05-28",
    items: [
      {
        maker: "三洋",
        productName: "海物語ライト",
        type: "パチンコ",
        quantity: 1,
        unitPrice: 215000,
        amount: 215000,
        note: "",
      },
    ],
    subtotal: 195455,
    tax: 19545,
    insurance: 0,
    totalAmount: 215000,
    remarks: "",
  },
  {
    invoiceId: "S-H-230025",
    invoiceType: "hall",
    createdAt: "2023-06-01T09:00:00Z",
    issuedDate: "2023/06/01",
    vendorName: "メガガイア新宿店",
    staff: "鈴木",
    transferDate: "2023-06-12",
    items: [
      {
        maker: "平和",
        productName: "ルパン三世MAX",
        type: "パチンコ",
        quantity: 1,
        unitPrice: 980000,
        amount: 980000,
        note: "",
      },
    ],
    subtotal: 933333,
    tax: 46667,
    insurance: 0,
    totalAmount: 980000,
    remarks: "",
  },
  {
    invoiceId: "S-V-230028",
    invoiceType: "vendor",
    createdAt: "2023-06-22T09:00:00Z",
    issuedDate: "2023/06/22",
    vendorName: "北斗商会",
    staff: "田中",
    transferDate: "2023-06-30",
    items: [
      {
        maker: "北電子",
        productName: "ジャグラーSP",
        type: "スロット",
        quantity: 1,
        unitPrice: 465000,
        amount: 465000,
        note: "",
      },
    ],
    subtotal: 422728,
    tax: 42272,
    insurance: 0,
    totalAmount: 465000,
    remarks: "",
  },
  {
    invoiceId: "S-H-230033",
    invoiceType: "hall",
    createdAt: "2023-07-09T09:00:00Z",
    issuedDate: "2023/07/09",
    vendorName: "キング観光難波店",
    staff: "山本",
    transferDate: "2023-07-21",
    items: [
      {
        maker: "大都技研",
        productName: "番長ZERO",
        type: "スロット",
        quantity: 1,
        unitPrice: 588000,
        amount: 588000,
        note: "",
      },
    ],
    subtotal: 560000,
    tax: 28000,
    insurance: 0,
    totalAmount: 588000,
    remarks: "",
  },
  {
    invoiceId: "S-V-230037",
    invoiceType: "vendor",
    createdAt: "2023-08-15T09:00:00Z",
    issuedDate: "2023/08/15",
    vendorName: "株式会社ロータス",
    staff: "加藤",
    transferDate: "2023-08-29",
    items: [
      {
        maker: "SANKYO",
        productName: "フィーバーX",
        type: "パチンコ",
        quantity: 1,
        unitPrice: 312000,
        amount: 312000,
        note: "",
      },
    ],
    subtotal: 283637,
    tax: 28363,
    insurance: 0,
    totalAmount: 312000,
    remarks: "",
  },
  {
    invoiceId: "S-H-230041",
    invoiceType: "hall",
    createdAt: "2023-09-04T09:00:00Z",
    issuedDate: "2023/09/04",
    vendorName: "キコーナ阪神店",
    staff: "斎藤",
    transferDate: "2023-09-18",
    items: [
      {
        maker: "サミー",
        productName: "パチスロ炎舞",
        type: "スロット",
        quantity: 1,
        unitPrice: 702000,
        amount: 702000,
        note: "",
      },
    ],
    subtotal: 668571,
    tax: 33429,
    insurance: 0,
    totalAmount: 702000,
    remarks: "",
  },
];

const STORAGE_KEY = "sales_invoices_v1";

export const loadSalesInvoices = (): SalesInvoice[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as SalesInvoice[];
    }
  } catch (error) {
    console.error("Failed to parse sales invoices", error);
  }

  return [];
};

export const loadAllSalesInvoices = (): SalesInvoice[] => [...SEED_SALES_INVOICES, ...loadSalesInvoices()];

export const saveSalesInvoices = (invoices: SalesInvoice[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
};

export const addSalesInvoice = (invoice: SalesInvoice): void => {
  const current = loadSalesInvoices();
  saveSalesInvoices([invoice, ...current]);
};

export const deleteSalesInvoices = (invoiceIds: string[]): SalesInvoice[] => {
  const current = loadSalesInvoices();
  if (invoiceIds.length === 0) return current;
  const targets = new Set(invoiceIds);
  const remaining = current.filter((invoice) => !targets.has(invoice.invoiceId));
  saveSalesInvoices(remaining);
  return remaining;
};

export const generateSalesInvoiceId = (type: SalesInvoice["invoiceType"]): string => {
  const prefix = type === "vendor" ? "S-V" : "S-H";
  return `${prefix}-${Date.now()}`;
};
