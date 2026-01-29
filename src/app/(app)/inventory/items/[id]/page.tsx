"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getItem, type InventoryStatus } from "@/lib/inventory/mock";

const typeLabels: Record<InventoryStatus, string> = {
  stock: "在庫",
  installed: "設置",
  inactive: "非在庫",
};

export default function InventoryItemDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const item = id ? getItem(id) : null;
  const [modalType, setModalType] = useState<"frame" | "cell" | null>(null);

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <p className="text-sm text-slate-600">該当する物件が見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar
        title="物件詳細"
        description={`${item.id} の履歴と状態を確認できます。`}
        actions={
          <Link
            href={`/inventory/items?type=${item.status}`}
            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            一覧へ戻る
          </Link>
        }
      />

      <div className="mt-4 space-y-4">
        <InventoryPanel
          title="基本情報"
          actions={<Badge variant="outline">{typeLabels[item.status]}</Badge>}
        >
          <div className="grid gap-3 text-xs md:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-600">メーカー / 機種</p>
              <p className="text-sm text-slate-900">
                {item.maker} / {item.model}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">拠点 / 場所</p>
              <p className="text-sm text-slate-900">
                {item.storageHub} / {item.storageLocation}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">最終更新</p>
              <p className="text-sm text-slate-900">{item.updatedAt}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">取込日</p>
              <p className="text-sm text-slate-900">{item.stockedAt}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">取引元</p>
              <p className="text-sm text-slate-900">{item.partner}</p>
            </div>
          </div>
        </InventoryPanel>

        <InventoryPanel title="履歴">
          <InventoryTable headers={["日時", "作業", "拠点・場所", "担当"]}>
            {item.history.map((entry, index) => (
              <tr key={entry.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border border-slate-200 px-2 py-1">{entry.date}</td>
                <td className="border border-slate-200 px-2 py-1">{entry.action}</td>
                <td className="border border-slate-200 px-2 py-1">{entry.location}</td>
                <td className="border border-slate-200 px-2 py-1">{entry.operator ?? "-"}</td>
              </tr>
            ))}
          </InventoryTable>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="h-8 rounded-none px-3 text-xs" onClick={() => setModalType("frame")}>
              枠履歴
            </Button>
            <Button variant="outline" className="h-8 rounded-none px-3 text-xs" onClick={() => setModalType("cell")}>
              セル履歴
            </Button>
          </div>
        </InventoryPanel>
      </div>

      <Dialog open={modalType !== null} onOpenChange={() => setModalType(null)}>
        <DialogContent className="rounded-none border border-slate-300">
          <DialogHeader>
            <DialogTitle>{modalType === "frame" ? "枠履歴" : "セル履歴"}</DialogTitle>
            <DialogDescription>ダミーデータのモーダルです。</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 text-sm text-slate-600">
            今後の詳細履歴はここに表示されます。
          </div>
          <DialogFooter>
            <Button onClick={() => setModalType(null)} className="rounded-none">
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
