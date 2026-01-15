import type { DraftRow } from "./vendorInvoiceTypes";

export const PRODUCT_NAME_OPTIONS = ["商品名", "ダンボール代", "手数料", "保険料", "その他", "書類代"];
export const APPLICATION_OPTIONS = [
  "--",
  "北海道",
  "東北",
  "東日本（本部）",
  "中部",
  "関西",
  "中国",
  "四国",
  "九州",
  "用途限定",
  "新台用",
  "下取り",
];
export const REMAINING_DEBT_OPTIONS = ["--", "要", "不要"];
export const INVOICE_ORIGINAL_OPTIONS = ["--", "要", "不要"];

export const createDefaultDraftRow = (): DraftRow => ({
  productName: PRODUCT_NAME_OPTIONS[0],
  quantity: 0,
  unitPrice: 0,
  remainingDebt: REMAINING_DEBT_OPTIONS[0],
  applicationRoute: APPLICATION_OPTIONS[0],
  applicationDate: "",
  note: "",
});
