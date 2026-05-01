import Link from "next/link";

const INVENTORY_ROWS = [
  {
    id: "stk-1001",
    maker: "Sammy",
    model: "スマスロ北斗の拳",
    frameColor: "黒",
    quantity: 12,
    location: "東京第1倉庫 A-03",
    incomingDate: "2026-04-20",
    listingStatus: "一部出品中",
  },
  {
    id: "stk-1002",
    maker: "SANKYO",
    model: "Pフィーバー 機動戦士ガンダムユニコーン2",
    frameColor: "赤",
    quantity: 8,
    location: "埼玉倉庫 B-11",
    incomingDate: "2026-04-21",
    listingStatus: "未出品",
  },
  {
    id: "stk-1003",
    maker: "京楽",
    model: "Pぱちんこ 必殺仕事人",
    frameColor: "金",
    quantity: 5,
    location: "千葉倉庫 C-02",
    incomingDate: "2026-04-18",
    listingStatus: "出品完了",
  },
];

export default function PortalInventoryPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">倉庫・在庫デモ</h1>
          <p className="mt-3 text-sm text-slate-600">倉庫在庫の可視化と、在庫からパチマートへ出品するオペレーションを確認できます。</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  {["メーカー", "機種名", "枠色", "在庫数", "保管場所", "入庫日", "出品状況", "操作"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVENTORY_ROWS.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.maker}</td>
                    <td className="px-4 py-3">{row.model}</td>
                    <td className="px-4 py-3">{row.frameColor}</td>
                    <td className="px-4 py-3 text-center font-semibold">{row.quantity}</td>
                    <td className="px-4 py-3">{row.location}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.incomingDate}</td>
                    <td className="px-4 py-3">{row.listingStatus}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/inventory/${row.id}/list`}
                        className="inline-flex rounded-md bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700"
                      >
                        パチマートに出品
                      </Link>
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
