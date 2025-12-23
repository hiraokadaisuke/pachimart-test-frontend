"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency, loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { SalesInvoice } from "@/types/salesInvoices";

const COMPANY_INFO = {
  name: "p-kanriclub",
  address: "〒169-0075 東京都新宿区高田馬場4-4-17",
  tel: "TEL 03-5389-1955",
  fax: "FAX 03-5389-1956",
  postal: "〒169-0075",
  url: "https://p-kanriclub.jp/",
  mail: "info@p-kanriclub.jp",
};

const PRINT_ACTIONS = ["売却証明書", "請求書", "発送依頼書", "書類一括"];

const SEED_SALES_INVOICES: SalesInvoice[] = [
  {
    invoiceId: "S-V-230001",
    invoiceType: "vendor",
    createdAt: "2023-03-12T09:00:00Z",
    issuedDate: "2023/03/12",
    vendorName: "株式会社あさひ商事",
    staff: "木村",
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

type Props = {
  invoiceId: string;
  title: string;
  expectedType?: SalesInvoice["invoiceType"];
};

const formatFullDate = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

const formatMonthDay = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${month}月${day}日`;
};

const formatNumber = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "―";
  return value.toLocaleString("ja-JP");
};

export function SalesInvoiceDetailView({ invoiceId, title, expectedType }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [inventories, setInventories] = useState<Map<string, InventoryRecord>>(new Map());
  const [attemptedLoad, setAttemptedLoad] = useState(false);

  useEffect(() => {
    const invoices = [...SEED_SALES_INVOICES, ...loadSalesInvoices()];
    const target = invoices.find((entry) => entry.invoiceId === invoiceId);
    setInvoice(target ?? null);
    setAttemptedLoad(true);
  }, [invoiceId]);

  useEffect(() => {
    const records = loadInventoryRecords();
    setInventories(new Map(records.map((record) => [record.id, record])));
  }, []);

  const items = useMemo(() => invoice?.items ?? [], [invoice]);

  const primaryInventory = useMemo(() => {
    if (!invoice) return null;
    return invoice.inventoryIds?.map((id) => inventories.get(id)).find((entry) => Boolean(entry)) ?? null;
  }, [invoice, inventories]);

  const recipientName = useMemo(() => {
    const fromInvoice = invoice?.vendorName || invoice?.buyerName;
    const fromInventory =
      primaryInventory?.supplierCorporate || primaryInventory?.supplierBranch || primaryInventory?.supplier;
    return (fromInvoice || fromInventory || "〇〇商事").trim();
  }, [invoice?.buyerName, invoice?.vendorName, primaryInventory]);

  const staffName = invoice?.staff || "―";
  const manager = invoice?.manager || "―";
  const remarks = invoice?.remarks || "";
  const shippingInsurance = Number(invoice?.insurance || 0);

  const subtotal = useMemo(
    () =>
      invoice?.subtotal ??
      items.reduce((sum, item) => {
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [invoice?.subtotal, items],
  );

  const taxRate = invoice?.invoiceType === "hall" ? 0.05 : 0.1;
  const tax = invoice?.tax ?? Math.floor(subtotal * taxRate);
  const grandTotal = invoice?.totalAmount ?? subtotal + tax + shippingInsurance;

  const issuedDateLabel = formatFullDate(invoice?.issuedDate || invoice?.createdAt);
  const paymentDateLabel = formatMonthDay(invoice?.issuedDate || invoice?.createdAt);
  const warehousingDateLabel = formatMonthDay(invoice?.issuedDate || invoice?.createdAt);

  const handlePrintMenu = (label: string) => {
    if (label === "書類一括") {
      alert("書類一括の印刷は準備中です");
      return;
    }
    alert(`${label}の印刷はデモでは準備中です`);
  };

  const handleMachineDetail = () => {
    alert("販売機械番号明細は準備中です");
  };

  const handleEdit = () => {
    alert("編集機能は準備中です");
  };

  const handleDelete = () => {
    alert("削除機能はデモでは無効です");
  };

  if (!invoice && attemptedLoad) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded border border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-neutral-800">対象の販売伝票が見つかりませんでした。</div>
          <div className="mt-3 text-sm text-neutral-600">一覧に戻って別の伝票を選択してください。</div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-300"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  if (expectedType && invoice.invoiceType !== expectedType) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded border border-amber-300 bg-amber-50 p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-amber-800">別種別の販売伝票が選択されました。</div>
          <div className="mt-3 text-sm text-amber-700">正しい種別の伝票を一覧から選択してください。</div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-300"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => router.push(`/inventory/sales-invoice/list`)}
              className="rounded border border-emerald-500 bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
            >
              一覧へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-[13px] text-neutral-800">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="border-b border-slate-400 pb-2">
          <div className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <span className="text-emerald-700">●</span>
            <span>{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded border border-slate-300 bg-slate-200 px-3 py-2 text-sm font-semibold text-neutral-800">
          <span className="h-5 w-1.5 rounded bg-emerald-700" aria-hidden />
          <span>詳細情報</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-700">印刷メニュー：</span>
            <div className="flex flex-wrap items-center gap-2">
              {PRINT_ACTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handlePrintMenu(label)}
                  className="rounded border border-slate-400 bg-slate-100 px-3 py-1 text-xs font-semibold text-neutral-800 shadow hover:bg-slate-200"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-700">機械番号明細：</span>
            <button
              type="button"
              onClick={handleMachineDetail}
              className="rounded border border-amber-600 bg-amber-200 px-4 py-1.5 text-xs font-semibold text-neutral-900 shadow hover:bg-amber-100"
            >
              販売機械番号明細
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-5xl border border-black bg-white p-6 shadow-sm">
            {invoice.invoiceType === "vendor"
              ? renderVendorSheet({
                  recipientName,
                  staffName,
                  manager,
                  items,
                  subtotal,
                  tax,
                  shippingInsurance,
                  grandTotal,
                  issuedDateLabel,
                })
              : renderHallSheet({
                  recipientName,
                  staffName,
                  manager,
                  items,
                  subtotal,
                  tax,
                  shippingInsurance,
                  grandTotal,
                  issuedDateLabel,
                  paymentDateLabel,
                  warehousingDateLabel,
                })}

            <div className="mb-4 mt-6 min-h-[120px] border border-black p-3 text-[13px]">
              <div className="mb-2 text-sm font-semibold text-neutral-900">備考</div>
              <div className="whitespace-pre-wrap text-neutral-800">{remarks || "―"}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pb-6">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded border border-amber-500 bg-amber-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-amber-200"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-amber-500 bg-amber-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-amber-200"
          >
            削除
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-900 shadow hover:bg-slate-300"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

type VendorSheetProps = {
  recipientName: string;
  staffName: string;
  manager: string;
  items: SalesInvoice["items"];
  subtotal: number;
  tax: number;
  shippingInsurance: number;
  grandTotal: number;
  issuedDateLabel: string;
};

type HallSheetProps = VendorSheetProps & {
  paymentDateLabel: string;
  warehousingDateLabel: string;
};

const renderVendorSheet = ({
  recipientName,
  staffName,
  manager,
  items,
  subtotal,
  tax,
  shippingInsurance,
  grandTotal,
  issuedDateLabel,
}: VendorSheetProps) => {
  return (
    <div className="space-y-4 text-[12px] text-neutral-900">
      <div className="space-y-3 border border-black p-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="min-w-[280px] flex-1 space-y-2">
            <div className="text-lg font-bold text-neutral-900">販売伝票発行（業者）</div>
            <div className="text-lg font-semibold text-neutral-900">{recipientName} 御中</div>
            <div className="flex gap-6 text-sm text-neutral-800">
              <span>FAX ―</span>
              <span>TEL ―</span>
            </div>
            <div className="text-sm font-semibold text-neutral-900">当社の規約に基づき下記の通り売却いたします</div>
            <div className="text-xs leading-relaxed text-neutral-800">
              <div>＊キャンセルは理由の如何にかかわらず承りません。</div>
              <div>＊商品の引き渡し後の故障・損傷・破損などについて弊社は一切の責任を負いません。</div>
              <div>＊同意の上お取引くださいますようお願い申し上げます。</div>
            </div>
          </div>

          <div className="min-w-[260px] space-y-2 text-sm text-neutral-800">
            <div className="flex items-center justify-between border border-black px-3 py-2 text-[13px] font-semibold text-neutral-900">
              <span>日付</span>
              <span>{issuedDateLabel}</span>
            </div>
            <div className="border border-black px-3 py-3 text-neutral-800">
              <div className="text-right text-sm font-semibold text-neutral-900">売主</div>
              <div className="space-y-1 text-left">
                <div>{COMPANY_INFO.postal}</div>
                <div>東京都新宿区高田馬場4-4-17 山根ビル3F</div>
                <div>{COMPANY_INFO.name}</div>
                <div className="flex items-center justify-between text-xs">
                  <span>TEL 03-5389-1955</span>
                  <span>FAX 03-5389-1956</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>担当 {staffName}</span>
                  <span>経理担当 {manager}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[2.3fr_1fr]">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border border-black text-[12px]">
              <thead className="bg-slate-100 text-center font-semibold">
                <tr>
                  <th className="border border-black px-2 py-2">メーカー名</th>
                  <th className="border border-black px-2 py-2">商品名</th>
                  <th className="border border-black px-2 py-2">タイプ</th>
                  <th className="border border-black px-2 py-2 text-right">数量</th>
                  <th className="border border-black px-2 py-2 text-right">単価</th>
                  <th className="border border-black px-2 py-2 text-right">金額</th>
                  <th className="border border-black px-2 py-2">発信</th>
                  <th className="border border-black px-2 py-2">申請適用</th>
                  <th className="border border-black px-2 py-2">申請日</th>
                  <th className="border border-black px-2 py-2">商品補足</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-black px-3 py-6 text-center text-sm text-neutral-600">
                      明細が登録されていません。
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={`${item.productName}-${index}`} className="align-middle text-center">
                      <td className="border border-black px-2 py-2 text-left">{item.maker || ""}</td>
                      <td className="border border-black px-2 py-2 text-left font-semibold">{item.productName || ""}</td>
                      <td className="border border-black px-2 py-2 text-left">{item.type || ""}</td>
                      <td className="border border-black px-2 py-2 text-right">{formatNumber(item.quantity)}</td>
                      <td className="border border-black px-2 py-2 text-right">{formatNumber(item.unitPrice)}</td>
                      <td className="border border-black px-2 py-2 text-right font-semibold">{formatNumber(item.amount)}</td>
                      <td className="border border-black px-2 py-2">―</td>
                      <td className="border border-black px-2 py-2">―</td>
                      <td className="border border-black px-2 py-2">―</td>
                      <td className="border border-black px-2 py-2 text-left">{item.note || ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="border border-black">
              <div className="bg-slate-100 px-3 py-2 text-center text-sm font-semibold">金額集計</div>
              <div className="space-y-1 px-3 py-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span>小計</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>消費税（10%）</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>運送保険（税込）</span>
                  <span className="font-semibold">{formatCurrency(shippingInsurance)}</span>
                </div>
                <div className="border-t border-black pt-2 text-right text-sm font-bold">
                  合計金額 {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            <div className="border border-black p-3 text-[12px]">
              <div className="text-sm font-semibold text-neutral-900">お振込先</div>
              <div className="mt-2 space-y-1 text-neutral-800">
                <div>三菱東京UFJ銀行 高田馬場支店</div>
                <div>普通 0131849 カ)ピーカンクラブ</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[2.3fr_1fr]">
          <div className="space-y-3 text-[12px]">
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">保管先</div>
              <div className="mt-2 h-10 border border-black bg-white" />
            </div>
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">商品引き渡し方法</div>
              <div className="mt-2 space-y-2">
                <div className="h-7 border border-black" />
                <div className="h-7 border border-black" />
              </div>
            </div>
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">売買引き渡し方法</div>
              <div className="mt-2 h-24 border border-black bg-white" />
            </div>
          </div>

          <div className="space-y-3 text-[12px]">
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">機械番号明細</div>
              <div className="mt-2 h-16 border border-black bg-white" />
            </div>
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">案内</div>
              <div className="mt-2 space-y-1 text-center text-[13px] font-bold leading-relaxed">
                <div>URL：{COMPANY_INFO.url}</div>
                <div>Email：{COMPANY_INFO.mail}</div>
                <div>FAX：03-5389-1956</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderHallSheet = ({
  recipientName,
  staffName,
  manager,
  items,
  subtotal,
  tax,
  shippingInsurance,
  grandTotal,
  issuedDateLabel,
  paymentDateLabel,
  warehousingDateLabel,
}: HallSheetProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 text-[13px]">
        <div className="min-w-[280px] flex-1 space-y-1">
          <div className="text-lg font-semibold text-neutral-900">{recipientName} 御中</div>
          <div className="text-sm font-semibold text-neutral-900">
            ＊ p-kanriclubの規約に基づき（別紙参照）下記の通り契約をいたします。
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm font-semibold text-neutral-900">
          <div>{issuedDateLabel}</div>
          <div className="w-[260px] border border-black px-3 py-2 text-[12px]">
            <div className="mb-1 text-base font-bold">【売主】</div>
            <div className="space-y-1 text-left">
              <div>{COMPANY_INFO.address}</div>
              <div>{COMPANY_INFO.name}</div>
              <div className="flex items-center justify-between text-xs">
                <span>TEL 03-5389-1955</span>
                <span>FAX 03-5389-1956</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>担当 {staffName}</span>
                <span>経理担当 {manager}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border border-black text-[12px]">
          <thead className="bg-slate-100 text-center font-semibold">
            <tr>
              <th className="border border-black px-2 py-2">メーカー名</th>
              <th className="border border-black px-2 py-2">商品名</th>
              <th className="border border-black px-2 py-2">タイプ</th>
              <th className="border border-black px-2 py-2 text-right">数量</th>
              <th className="border border-black px-2 py-2 text-right">単価</th>
              <th className="border border-black px-2 py-2 text-right">金額</th>
              <th className="border border-black px-2 py-2">商品補足</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-black px-3 py-6 text-center text-sm text-neutral-600">
                  明細が登録されていません。
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={`${item.productName}-${index}`} className="align-middle text-center">
                  <td className="border border-black px-2 py-2 text-left">{item.maker || ""}</td>
                  <td className="border border-black px-2 py-2 text-left font-semibold">{item.productName || ""}</td>
                  <td className="border border-black px-2 py-2 text-left">{item.type || ""}</td>
                  <td className="border border-black px-2 py-2 text-right">{formatNumber(item.quantity)}</td>
                  <td className="border border-black px-2 py-2 text-right">{formatNumber(item.unitPrice)}</td>
                  <td className="border border-black px-2 py-2 text-right font-semibold">{formatNumber(item.amount)}</td>
                  <td className="border border-black px-2 py-2 text-left">{item.note || ""}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="text-sm font-semibold">
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                小計
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right">
                {formatCurrency(subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                消費税（5%）
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right">
                {formatCurrency(tax)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                運送保険（税込）
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right">
                {formatCurrency(shippingInsurance)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                合計金額
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right font-bold">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-3 text-[12px]">
        <div className="col-span-3 border border-black p-3">
          <div className="text-sm font-semibold text-neutral-900">お振込先</div>
          <div className="mt-2 space-y-1 text-neutral-800">
            <div>三菱東京UFJ銀行 高田馬場支店</div>
            <div>普通 0131849 カ)ピーカンクラブ</div>
          </div>
          <div className="mt-4 text-sm font-semibold text-neutral-900">お支払方法（振込）</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-neutral-800">
            <div className="h-7 border border-black" />
            <div className="h-7 border border-black" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-neutral-800">
            <div>
              <div className="text-sm font-semibold text-neutral-900">お支払日</div>
              <div className="mt-1 h-7 border border-black" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">金額</div>
              <div className="mt-1 h-7 border border-black" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">合計金額</div>
              <div className="mt-1 h-7 border border-black font-bold text-right leading-[28px]">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-[1fr_2.5fr] gap-2">
          <div className="flex flex-col items-center justify-between border border-black px-2 py-3 text-[11px] font-semibold text-neutral-900">
            <div>住所</div>
            <div>会社名</div>
            <div>電話番号</div>
            <div className="mt-6">印</div>
          </div>
          <div className="space-y-2">
            <div className="h-7 border border-black" />
            <div className="h-7 border border-black" />
            <div className="h-7 border border-black" />
            <div className="h-16 border border-black" />
          </div>
        </div>
      </div>

      <div className="space-y-3 text-[12px]">
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">導入店舗名</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">機械納品日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">設置日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">書類着日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">納店日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">書類お届け先</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
        </div>
        <div className="border border-black p-3">
          <div className="text-sm font-semibold text-neutral-900">備考</div>
          <div className="mt-2 h-24 border border-black" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">保管先</div>
            <div className="mt-2 h-10 border border-black" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">入庫日</div>
              <div className="mt-2 h-7 border border-black text-right leading-[26px]">{warehousingDateLabel}</div>
            </div>
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">支払日</div>
              <div className="mt-2 h-7 border border-black text-right leading-[26px]">{paymentDateLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceDetailView;
