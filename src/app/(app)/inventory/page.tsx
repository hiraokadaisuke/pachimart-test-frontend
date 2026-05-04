import Link from "next/link";

import {
  InventoryFlowSteps,
  InventoryPlannedBadge,
  InventorySectionCard,
  InventorySummaryCard,
} from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { recentActivities } from "@/features/inventory/mock";

const kpi = [
  ["現在庫", "128台"],
  ["入庫予定", "24台"],
  ["発送予定", "17台"],
  ["出品中", "43台"],
  ["今月販売", "31台"],
  ["粗利", "¥1,240,000"],
] as const;

const flowSteps = [
  { title: "購入・仕入", description: "パチマートで購入した物件を購入伝票として管理" },
  { title: "入庫予定", description: "倉庫への入庫予定日・入庫先を管理" },
  { title: "在庫化", description: "入庫完了後、在庫物件として一覧へ反映" },
  { title: "パチマート出品", description: "在庫からそのまま出品できる導線を用意" },
  { title: "販売・成約", description: "販売伝票として売却情報を管理" },
  { title: "発送予定", description: "成約後は発送予定として管理" },
  { title: "在庫反映・利益管理", description: "仕入額・販売額をもとに利益を確認" },
];

export default function InventoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-3xl font-bold">在庫管理ダッシュボード</h1>
      <p className="mt-2 text-slate-600">Excel管理からの移行を想定し、販売管理と倉庫管理をつなげて二重入力を減らすデモ画面です。</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kpi.map(([l, v]) => <InventorySummaryCard key={l} label={l} value={v} />)}</div>

      <InventorySectionCard title="業務フロー" description="購入から在庫化、出品、成約、発送、利益管理までを一元管理します。" className="mt-6">
        <InventoryFlowSteps steps={flowSteps} />
      </InventorySectionCard>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InventorySectionCard title="販売管理" description="購入・販売・利益管理を取引情報とつなげて管理します。">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between"><span>購入伝票</span><InventoryPlannedBadge /></li>
            <li className="flex items-center justify-between"><span>販売伝票</span><InventoryPlannedBadge /></li>
            <li className="flex items-center justify-between"><span>利益管理</span><InventoryPlannedBadge /></li>
          </ul>
        </InventorySectionCard>
        <InventorySectionCard title="倉庫管理" description="在庫・入出庫・保管を現場業務に沿って管理します。">
          <ul className="space-y-2 text-sm">
            <li>在庫物件一覧</li>
            <li>入庫予定</li>
            <li>発送予定</li>
            <li className="flex items-center justify-between"><span>保管場所管理</span><InventoryPlannedBadge /></li>
          </ul>
        </InventorySectionCard>
      </div>

      <InventorySectionCard title="最近の在庫の動き" className="mt-6">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>日付</th><th>区分</th><th>機種名</th><th>台数</th><th>保管場所</th><th>ステータス</th></tr></thead><tbody>{recentActivities.map((a) => <tr key={`${a.date}${a.modelName}`} className="border-t"><td className="py-3">{a.date}</td><td>{a.category}</td><td>{a.modelName}</td><td>{a.quantity}台</td><td>{a.location}</td><td><InventoryStatusBadge status={a.status} /></td></tr>)}</tbody></table></div>
      </InventorySectionCard>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["在庫物件一覧を見る", "/inventory/items"], ["入庫予定を見る", "/inventory/inbound"], ["発送予定を見る", "/inventory/outbound"]].map(([label, href]) => <Link key={href} href={href} className="rounded-lg border bg-white p-4 text-center font-semibold hover:bg-slate-50">{label}</Link>)}</div>
    </div>
  );
}
