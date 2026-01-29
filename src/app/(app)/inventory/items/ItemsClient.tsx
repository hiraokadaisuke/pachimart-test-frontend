"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { listItems, type InventoryStatus } from "@/lib/inventory/mock";

const typeLabels: Record<InventoryStatus, string> = {
  stock: "在庫",
  installed: "設置",
  inactive: "非在庫",
};

const typeDescriptions: Record<InventoryStatus, string> = {
  stock: "倉庫で保管中の物件一覧",
  installed: "ホール設置中の物件一覧",
  inactive: "撤去・非稼働の物件一覧",
};

const typeOptions: InventoryStatus[] = ["stock", "installed", "inactive"];

export default function InventoryItemsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = (searchParams?.get("type") as InventoryStatus) ?? "stock";
  const type = typeOptions.includes(typeParam) ? typeParam : "stock";
  const items = listItems(type);
  const tableHeader = "border border-gray-300 bg-slate-600 px-2 py-1 text-xs font-bold text-white";
  const tableCell = "border border-gray-300 px-2 py-1 text-xs text-slate-700";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{typeLabels[type]}物件一覧</h1>
          <p className="mt-2 text-sm text-slate-600">{typeDescriptions[type]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline">CSV出力（ダミー）</Button>
          <Link href="/inventory/import">
            <Button variant="outline">取込データ設定へ</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {typeOptions.map((option) => (
          <Button
            key={option}
            variant={option === type ? "default" : "outline"}
            onClick={() => router.push(`/inventory/items?type=${option}`)}
          >
            {typeLabels[option]}
          </Button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-gray-300 bg-white">
        <table className="min-w-full border-collapse text-xs text-slate-800">
          <thead className="bg-slate-600 text-left text-white">
            <tr>
              <th className={`${tableHeader} w-8`}>
                <input type="checkbox" aria-label="すべて選択" />
              </th>
              <th className={tableHeader}>管理ID</th>
              <th className={tableHeader}>入庫日</th>
              <th className={tableHeader}>メーカー</th>
              <th className={tableHeader}>機種名</th>
              <th className={tableHeader}>種別</th>
              <th className={tableHeader}>タイプ</th>
              <th className={tableHeader}>保管先</th>
              <th className={tableHeader}>保管場所</th>
              <th className={tableHeader}>外れ店</th>
              <th className={tableHeader}>外れ日</th>
              <th className={tableHeader}>撤去日</th>
              <th className={tableHeader}>担当</th>
              <th className={tableHeader}>備考</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-sm text-slate-500">
                  該当データがありません。
                </td>
              </tr>
            ) : null}
            {items.map((item, index) => {
              const kind = index % 2 === 0 ? "P" : "S";
              const typeLabel = index % 3 === 0 ? "本体" : index % 3 === 1 ? "枠" : "セル";
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer odd:bg-white even:bg-[#f8fafc]"
                  onClick={() => router.push(`/inventory/items/${item.id}`)}
                >
                  <td className={tableCell}>
                    <input type="checkbox" aria-label={`${item.id}を選択`} />
                  </td>
                  <td className={tableCell}>{item.id}</td>
                  <td className={tableCell}>{item.stockedAt}</td>
                  <td className={tableCell}>{item.maker}</td>
                  <td className={tableCell}>{item.model}</td>
                  <td className={tableCell}>{kind}</td>
                  <td className={tableCell}>{typeLabel}</td>
                  <td className={tableCell}>{item.storageHub}</td>
                  <td className={tableCell}>{item.storageLocation}</td>
                  <td className={tableCell}>{item.partner}</td>
                  <td className={tableCell}>{item.removedAt || "-"}</td>
                  <td className={tableCell}>{item.status === "installed" ? "-" : item.removedAt || "-"}</td>
                  <td className={tableCell}>{item.reader ?? "未設定"}</td>
                  <td className={tableCell}>-</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
