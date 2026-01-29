"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function InventoryItemsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = (searchParams?.get("type") as InventoryStatus) ?? "stock";
  const type = typeOptions.includes(typeParam) ? typeParam : "stock";
  const items = listItems(type);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">物件一覧</h1>
          <p className="mt-2 text-sm text-slate-600">{typeDescriptions[type]}</p>
        </div>
        <Link href="/inventory/import">
          <Button variant="outline">取込データ設定へ</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            <span>ステータス</span>
            <div className="flex flex-wrap gap-2">
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>入庫日 / 取込日</TableHead>
                <TableHead>取引元</TableHead>
                <TableHead>メーカー / 機種</TableHead>
                <TableHead>保管拠点 / 保管場所</TableHead>
                <TableHead>外れ日 / 撤去日</TableHead>
                <TableHead>読取日時 / 読取担当</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    該当データがありません。
                  </TableCell>
                </TableRow>
              ) : null}
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/inventory/items/${item.id}`)}
                >
                  <TableCell>{item.stockedAt}</TableCell>
                  <TableCell>{item.partner}</TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-slate-900">{item.maker}</div>
                    <div className="text-xs text-slate-500">{item.model}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-slate-900">{item.storageHub}</div>
                    <div className="text-xs text-slate-500">{item.storageLocation}</div>
                  </TableCell>
                  <TableCell>{item.removedAt || "-"}</TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">{item.readAt ?? "-"}</div>
                    <div className="text-xs text-slate-400">{item.reader ?? "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[item.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
