const SALES_ROWS = [
  {
    id: "TRX-2026-00081",
    date: "2026-04-21",
    type: "売却",
    maker: "SANKYO",
    model: "Pフィーバー 機動戦士ガンダムユニコーン2",
    quantity: 4,
    unitPrice: "¥285,000",
    partner: "ホールA（関東）",
    status: "計上済み",
    stock: "反映済み",
  },
  {
    id: "TRX-2026-00079",
    date: "2026-04-20",
    type: "購入",
    maker: "Sammy",
    model: "スマスロ北斗の拳",
    quantity: 6,
    unitPrice: "¥198,000",
    partner: "販社B",
    status: "検収完了",
    stock: "反映済み",
  },
  {
    id: "TRX-2026-00074",
    date: "2026-04-18",
    type: "売却",
    maker: "京楽",
    model: "Pぱちんこ 必殺仕事人",
    quantity: 3,
    unitPrice: "¥149,000",
    partner: "ホールC（中部）",
    status: "入金待ち",
    stock: "引当済み",
  },
];

export default function PortalSalesPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">販売管理デモ</h1>
          <p className="mt-3 text-sm text-slate-600">
            パチマート取引から自動反映された売却・購入データを一覧化した営業デモ画面です。
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  {[
                    "取引ID",
                    "取引日",
                    "区分",
                    "メーカー",
                    "機種名",
                    "台数",
                    "単価",
                    "取引先",
                    "ステータス",
                    "在庫反映",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SALES_ROWS.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">{row.maker}</td>
                    <td className="px-4 py-3">{row.model}</td>
                    <td className="px-4 py-3 text-center">{row.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.unitPrice}</td>
                    <td className="px-4 py-3">{row.partner}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{row.stock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
