import { NaviTable, NaviTableColumn } from "@/components/transactions/NaviTable";
import { standardNaviColumns } from "@/components/transactions/standardColumns";

const SALES_ROWS = [
  {
    id: "S-2025111203",
    itemName: "S 押忍！番長ZERO",
    quantity: 12,
    partnerName: "株式会社アミューズ流通",
    totalAmount: 1320000,
    status: "入金待ち",
    updatedAt: "2025/11/13 08:45",
  },
  {
    id: "S-2025110501",
    itemName: "P フィーバー機動戦士ガンダムSEED",
    quantity: 7,
    partnerName: "有限会社スマイル",
    totalAmount: 1520000,
    status: "発送待ち",
    updatedAt: "2025/11/06 16:15",
  },
  {
    id: "S-2025102803",
    itemName: "P 北斗の拳9 闘神",
    quantity: 5,
    partnerName: "株式会社パチテック",
    totalAmount: 980000,
    status: "完了",
    updatedAt: "2025/10/29 09:30",
  },
];

export default function SalesPage() {
  const statusColumns: NaviTableColumn[] = standardNaviColumns.map((column) => {
    if (column.key !== "status") return column;

    return {
      ...column,
      render: (row: (typeof SALES_ROWS)[number]) => {
        let tone = "bg-amber-50 text-amber-700";
        if (row.status === "完了") tone = "bg-slate-100 text-slate-700";
        if (row.status === "発送待ち") tone = "bg-blue-50 text-blue-700";

        return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{row.status}</span>;
      },
    };
  });

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900">売却一覧</h1>
        <p className="text-sm text-slate-600">取引Naviのテーブルと同一コンポーネントで、売却取引の進捗と履歴を確認できます。</p>
      </header>

      <section className="space-y-3">
        <div className="rounded bg-slate-50 px-4 py-2 text-xs text-slate-600">
          物件名 / 台数 / 相手先 / 税込合計 / ステータス / 更新日時 の順で並べ、他タブと世界観を合わせています。
        </div>

        <NaviTable columns={statusColumns} rows={SALES_ROWS} emptyMessage="売却取引がありません。" />
      </section>
    </main>
  );
}
