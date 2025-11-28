"use client";

type DummyHistoryKind = "sales" | "purchases";

type DummyHistoryRow = {
  id: string;
  date: string;
  partner: string;
  item: string;
  amount: number;
};

const HISTORY_DATA: Record<DummyHistoryKind, DummyHistoryRow[]> = {
  sales: [
    { id: "S-2025110101", date: "2025/11/01", partner: "株式会社アミューズ流通", item: "P 北斗の拳9 闘神", amount: 980000 },
    { id: "S-2025102803", date: "2025/10/28", partner: "有限会社スマイル", item: "P とある魔術の禁書目録", amount: 720000 },
  ],
  purchases: [
    { id: "P-2025110502", date: "2025/11/05", partner: "株式会社パチテック", item: "P スーパー海物語 JAPAN2 L1", amount: 1250000 },
    { id: "P-2025103011", date: "2025/10/30", partner: "株式会社ミドルウェーブ", item: "P ルパン三世 2000カラットの涙", amount: 840000 },
  ],
};

export function DummyHistoryTable({ kind }: { kind: DummyHistoryKind }) {
  const rows = HISTORY_DATA[kind];

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left">日付</th>
            <th className="px-3 py-2 text-left">取引先</th>
            <th className="px-3 py-2 text-left">物件名</th>
            <th className="px-3 py-2 text-right">金額（税込）</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-700">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              <td className="px-3 py-2">{row.date}</td>
              <td className="px-3 py-2">{row.partner}</td>
              <td className="px-3 py-2">{row.item}</td>
              <td className="px-3 py-2 text-right font-semibold">¥{row.amount.toLocaleString("ja-JP")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
