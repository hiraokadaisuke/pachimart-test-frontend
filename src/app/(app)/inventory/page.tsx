"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInventorySummary } from "@/lib/inventory/mock";

const shortcuts = [
  {
    title: "取込データ設定",
    description: "仮登録データの補完・登録確定",
    href: "/inventory/import",
  },
  {
    title: "在庫物件一覧",
    description: "倉庫に保管中の台数",
    href: "/inventory/items?type=stock",
  },
  {
    title: "設置物件一覧",
    description: "ホールに設置中の台数",
    href: "/inventory/items?type=installed",
  },
  {
    title: "非在庫物件一覧",
    description: "撤去・非稼働の台数",
    href: "/inventory/items?type=inactive",
  },
];

export default function InventoryPage() {
  const summary = getInventorySummary();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Inventory TOP</h1>
        <p className="text-sm text-slate-600">
          QR読取→仮登録→補完→登録確定→物件一覧の流れを再現するための骨組みページです。
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>在庫台数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{summary.stock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>設置台数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{summary.installed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>非在庫台数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{summary.inactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>仮登録件数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{summary.pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">ショートカット</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.title} href={shortcut.href} className="group">
              <Card className="transition group-hover:border-slate-300 group-hover:shadow">
                <CardHeader>
                  <CardTitle>{shortcut.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{shortcut.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
