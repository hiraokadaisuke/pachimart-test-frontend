"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar title="在庫物件一覧" description={typeDescriptions[type]} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {typeOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => router.push(`/inventory/items?type=${option}`)}
            className={
              option === type
                ? "border border-slate-800 bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
                : "border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            }
          >
            {typeLabels[option]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <InventoryPanel
          title={`${typeLabels[type]}物件一覧`}
          description="出入番頭の業務テーブルで在庫を確認します。"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-8 w-48 rounded-none"
                placeholder="検索キーワード"
              />
              <Button variant="outline" className="h-8 rounded-none px-3 text-xs">
                検索
              </Button>
              <Button variant="outline" className="h-8 rounded-none px-3 text-xs">
                CSV出力
              </Button>
              <Link href="/inventory/import">
                <Button variant="outline" className="h-8 rounded-none px-3 text-xs">
                  取込へ
                </Button>
              </Link>
            </div>
          }
        >
          <InventoryTable
            headers={[
              "",
              "管理ID",
              "入庫日",
              "メーカー",
              "機種名",
              "種別",
              "タイプ",
              "保管先",
              "保管場所",
              "外れ店",
              "外れ日",
              "撤去日",
              "担当",
              "備考",
            ]}
            emptyMessage={items.length === 0 ? "該当データがありません。" : undefined}
            emptyColSpan={14}
          >
            {items.map((item, index) => {
              const kind = index % 2 === 0 ? "P" : "S";
              const typeLabel = index % 3 === 0 ? "本体" : index % 3 === 1 ? "枠" : "セル";
              return (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  onClick={() => router.push(`/inventory/items/${item.id}`)}
                >
                  <td className="border border-slate-200 px-2 py-1">
                    <input type="checkbox" aria-label={`${item.id}を選択`} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1">{item.id}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.stockedAt}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.maker}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.model}</td>
                  <td className="border border-slate-200 px-2 py-1">{kind}</td>
                  <td className="border border-slate-200 px-2 py-1">{typeLabel}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.storageHub}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.storageLocation}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.partner}</td>
                  <td className="border border-slate-200 px-2 py-1">{item.removedAt || "-"}</td>
                  <td className="border border-slate-200 px-2 py-1">
                    {item.status === "installed" ? "-" : item.removedAt || "-"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1">{item.reader ?? "未設定"}</td>
                  <td className="border border-slate-200 px-2 py-1">-</td>
                </tr>
              );
            })}
          </InventoryTable>
        </InventoryPanel>
      </div>
    </div>
  );
}
