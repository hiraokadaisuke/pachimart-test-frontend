import type { BuyerInfo } from "@/lib/demo-data/buyers";

type DetailRow = {
  removalDate: string;
  storeName: string;
  maker: string;
  machineName: string;
  type: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  remainingDebt: string;
};

type Props = {
  title: string;
  issuedDateLabel: string;
  recipientLine: string;
  sellerInvoiceNumber: string;
  buyerInvoiceNumber: string;
  buyer: BuyerInfo;
  staffName: string;
  paymentDateLabel: string;
  detailRows: DetailRow[];
  subtotal: number;
  tax: number;
  grandTotal: number;
};

const formatYen = (value: number): string => `${value.toLocaleString("ja-JP")}円`;

export const PurchaseContractInvoiceSheet = ({
  title,
  issuedDateLabel,
  recipientLine,
  sellerInvoiceNumber,
  buyerInvoiceNumber,
  buyer,
  staffName,
  paymentDateLabel,
  detailRows,
  subtotal,
  tax,
  grandTotal,
}: Props) => {
  return (
    <div className="space-y-4 text-[12px] text-neutral-900">
      <div className="grid grid-cols-[1fr_1.5fr_1fr] items-start">
        <div />
        <div className="text-center text-lg font-semibold">{title}</div>
        <div className="text-right text-[12px]">{issuedDateLabel}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2">
          <div className="text-[13px] font-semibold">{recipientLine}</div>
          <div className="text-[11px] text-neutral-700">インボイス番号 {sellerInvoiceNumber}</div>
        </div>
        <div className="border border-black p-3 text-[11px]">
          <div className="mb-1 text-right text-sm font-semibold">【買主】</div>
          <div className="space-y-0.5">
            <div>{buyer.postalCode}</div>
            <div>{buyer.address}</div>
            <div>{buyer.corporate}</div>
            <div>{buyer.representative}</div>
            <div className="flex items-center justify-between">
              <span>{buyer.tel}</span>
              <span>{buyer.fax}</span>
            </div>
            <div>担当 {staffName}</div>
            <div>インボイス番号 {buyerInvoiceNumber}</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border border-black text-[11px]">
          <thead className="bg-slate-100 text-center font-semibold">
            <tr>
              <th className="border border-black px-2 py-1">合計金額</th>
              <th className="border border-black px-2 py-1">支払日</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center font-semibold">
              <td className="border border-black px-2 py-1 text-[12px]">{formatYen(grandTotal)}</td>
              <td className="border border-black px-2 py-1">{paymentDateLabel || " "}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border border-black text-[11px]">
          <thead className="bg-slate-100 text-center font-semibold">
            <tr>
              <th className="border border-black px-2 py-1">撤去日</th>
              <th className="border border-black px-2 py-1">店舗名</th>
              <th className="border border-black px-2 py-1">メーカー名</th>
              <th className="border border-black px-2 py-1">商品名</th>
              <th className="border border-black px-2 py-1">タイプ</th>
              <th className="border border-black px-2 py-1 text-right">数量</th>
              <th className="border border-black px-2 py-1 text-right">単価</th>
              <th className="border border-black px-2 py-1 text-right">金額</th>
              <th className="border border-black px-2 py-1 text-right">残債</th>
            </tr>
          </thead>
          <tbody>
            {detailRows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="align-middle text-center">
                <td className="border border-black px-2 py-1">{row.removalDate}</td>
                <td className="border border-black px-2 py-1 text-left">{row.storeName}</td>
                <td className="border border-black px-2 py-1 text-left">{row.maker}</td>
                <td className="border border-black px-2 py-1 text-left font-semibold">{row.machineName}</td>
                <td className="border border-black px-2 py-1 text-left">{row.type}</td>
                <td className="border border-black px-2 py-1 text-right">{row.quantity}</td>
                <td className="border border-black px-2 py-1 text-right">{row.unitPrice}</td>
                <td className="border border-black px-2 py-1 text-right font-semibold">{row.amount}</td>
                <td className="border border-black px-2 py-1 text-right">{row.remainingDebt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="border border-black p-3">
          <div className="mb-2 text-sm font-semibold">金額集計</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>小計</span>
              <span className="font-semibold">{formatYen(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>消費税（10%）</span>
              <span className="font-semibold">{formatYen(tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-black pt-1 font-bold">
              <span>合計金額</span>
              <span>{formatYen(grandTotal)}</span>
            </div>
          </div>
        </div>
        <div className="border border-black p-3 text-[11px]">
          <div className="text-sm font-semibold">売主様捺印欄</div>
          <div className="mt-2 grid grid-cols-[100px_1fr] gap-2">
            <div className="flex flex-col justify-between border border-black px-2 py-2 text-center font-semibold">
              <div>住所</div>
              <div>会社名</div>
              <div>電話番号</div>
              <div className="mt-3">印</div>
            </div>
            <div className="space-y-2">
              <div className="h-7 border border-black" />
              <div className="h-7 border border-black" />
              <div className="h-7 border border-black" />
              <div className="h-16 border border-black" />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-black p-3 text-[11px]">
        <div className="text-sm font-semibold">振込先口座</div>
        <div className="mt-2 h-16 border border-black" />
        <div className="mt-2 text-[10px]">必要に応じてご記入ください。</div>
      </div>
    </div>
  );
};
