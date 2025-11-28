import { NaviTable, NaviTableColumn } from "@/components/transactions/NaviTable";
import { standardNaviColumns } from "@/components/transactions/standardColumns";

const PURCHASE_ROWS = [
  {
    id: "P-2025111401",
    itemName: "P スーパー海物語 IN 沖縄5", // 物件名（機種名）
    quantity: 8,
    partnerName: "株式会社パチテック", // 相手先
    totalAmount: 1180000,
    status: "入金確認中", // 状況
    updatedAt: "2025/11/15 09:20", // 更新日時
  },
  {
    id: "P-2025110802",
    itemName: "P とある魔術の禁書目録",
    quantity: 4,
    partnerName: "有限会社スマイル",
    totalAmount: 760000,
    status: "発送手配中",
    updatedAt: "2025/11/09 17:05",
  },
  {
    id: "P-2025103011",
    itemName: "P ルパン三世 2000カラットの涙",
    quantity: 6,
    partnerName: "株式会社ミドルウェーブ",
    totalAmount: 840000,
    status: "完了",
    updatedAt: "2025/10/31 10:45",
  },
];

export default function PurchasesPage() {
  const statusColumns: NaviTableColumn[] = standardNaviColumns.map((column) => {
    if (column.key !== "status") return column;

    return {
      ...column,
      render: (row: (typeof PURCHASE_ROWS)[number]) => {
        const tone =
          row.status === "完了" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700";

        return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{row.status}</span>;
      },
    };
  });

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900">購入一覧</h1>
        <p className="text-sm text-slate-600">取引Naviの履歴と同じフォーマットで、購入取引の状況を確認できます。</p>
      </header>

      <section className="space-y-3">
        <div className="rounded bg-slate-50 px-4 py-2 text-xs text-slate-600">
          物件名・台数・相手先・税込合計・ステータス・更新日時を共通レイアウトで表示しています。
        </div>

        <NaviTable columns={statusColumns} rows={PURCHASE_ROWS} emptyMessage="購入取引がありません。" />
      </section>
    </main>
  );
}
