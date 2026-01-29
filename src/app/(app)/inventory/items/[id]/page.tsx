"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-sm text-slate-600">該当する物件が見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">物件詳細</h1>
          <p className="mt-2 text-sm text-slate-600">{item.id} の履歴と状態を確認できます。</p>
        </div>
        <Link href={`/inventory/items?type=${item.status}`}>
          <Button variant="outline">一覧へ戻る</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            {item.maker} / {item.model}
            <Badge variant="outline">{typeLabels[item.status]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">拠点 / 場所</p>
            <p className="text-sm text-slate-900">
              {item.storageHub} / {item.storageLocation}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">最終更新</p>
            <p className="text-sm text-slate-900">{item.updatedAt}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">取込日</p>
            <p className="text-sm text-slate-900">{item.stockedAt}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">取引元</p>
            <p className="text-sm text-slate-900">{item.partner}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>作業</TableHead>
                <TableHead>拠点・場所</TableHead>
                <TableHead>担当</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>{entry.location}</TableCell>
                  <TableCell>{entry.operator ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setModalType("frame")}
            >
              枠履歴
            </Button>
            <Button variant="outline" onClick={() => setModalType("cell")}
            >
              セル履歴
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalType !== null} onOpenChange={() => setModalType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalType === "frame" ? "枠履歴" : "セル履歴"}</DialogTitle>
            <DialogDescription>ダミーデータのモーダルです。</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 text-sm text-slate-600">
            今後の詳細履歴はここに表示されます。
          </div>
          <DialogFooter>
            <Button onClick={() => setModalType(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
