import type { InventoryItem, InventoryStatus } from "@/types/inventory";

const statusStyles: Record<InventoryStatus, string> = {
  在庫中: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  出品中: "bg-green-50 text-green-700 ring-1 ring-green-200",
  成功済み: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[1200px] w-full border-collapse text-sm text-slate-800">
        <thead className="bg-slate-100 text-left font-semibold text-slate-900">
          <tr>
            <th className="px-4 py-3">ステータス</th>
            <th className="px-4 py-3">カテゴリー</th>
            <th className="px-4 py-3">メーカー</th>
            <th className="px-4 py-3">機種名</th>
            <th className="px-4 py-3">色パネル</th>
            <th className="px-4 py-3">検定番号</th>
            <th className="px-4 py-3">枠シリアル</th>
            <th className="px-4 py-3">基板シリアル</th>
            <th className="px-4 py-3">撤去日</th>
            <th className="px-4 py-3">保管場所</th>
            <th className="px-4 py-3">売却価格</th>
            <th className="px-4 py-3">売却日</th>
            <th className="px-4 py-3">購入者</th>
            <th className="px-4 py-3 text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3">{item.category}</td>
              <td className="px-4 py-3">{item.manufacturer}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{item.modelName}</td>
              <td className="px-4 py-3">{item.colorPanel}</td>
              <td className="px-4 py-3">{item.inspectionNumber}</td>
              <td className="px-4 py-3">{item.frameSerial}</td>
              <td className="px-4 py-3">{item.boardSerial}</td>
              <td className="px-4 py-3">{item.removalDate ?? "-"}</td>
              <td className="px-4 py-3">{item.warehouse}</td>
              <td className="px-4 py-3">{item.salePrice ? `${item.salePrice.toLocaleString()} 円` : "-"}</td>
              <td className="px-4 py-3">{item.saleDate ?? "-"}</td>
              <td className="px-4 py-3">{item.buyer ?? "-"}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      /* TODO: 出品処理を実装 */
                    }}
                    className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    出品
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      /* TODO: 取り下げ処理を実装 */
                    }}
                    className="rounded border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
                  >
                    取り下げ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      /* TODO: 詳細表示処理を実装 */
                    }}
                    className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    詳細
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">在庫データがありません。</div>
      )}
    </div>
  );
}
