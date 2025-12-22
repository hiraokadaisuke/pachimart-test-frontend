export default function HallSalesInvoiceCreatePage() {
  return (
    <div className="space-y-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="h-3.5 w-3.5 rounded-full bg-emerald-600" aria-hidden />
        <h1 className="text-xl font-bold text-slate-800">販売伝票登録（ホール）</h1>
      </div>
      <div className="rounded-sm border border-dashed border-slate-400 bg-white px-4 py-6 text-sm text-slate-700 shadow-inner">
        このページは現在準備中です。販売伝票作成ページから遷移できるようにしています。
      </div>
      <div>
        <a
          href="/inventory/sales-invoice/create"
          className="inline-flex items-center rounded-sm border border-gray-400 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 shadow-inner hover:bg-slate-200"
        >
          ※ 販売伝票作成に戻る
        </a>
      </div>
    </div>
  );
}
