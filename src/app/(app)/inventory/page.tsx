import Link from "next/link";

import {
  InventoryFlowSteps,
  InventorySectionCard,
  InventorySummaryCard,
} from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatCurrency } from "@/features/inventory/labels";
import { getInventoryDashboardData } from "@/features/inventory/server";

const flowSteps = [
  { title: "購入・仕入", description: "パチマートで購入した取引が入庫予定につながります" },
  { title: "入庫予定", description: "入庫先と予定日を管理し、入庫完了で在庫へ反映します" },
  { title: "在庫管理", description: "在庫数と保管先、価格、見込み粗利を在庫単位で確認します" },
  { title: "パチマート出品", description: "在庫一覧からそのまま出品連携できます" },
  { title: "成約・発送", description: "成約した取引が発送予定につながり、発送完了で在庫を更新します" },
];

const toDate = (value: Date) => value.toISOString().slice(0, 10);

export default async function InventoryPage() {
  const { kpi, recentActivities } = await getInventoryDashboardData();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-3xl font-bold">在庫管理ダッシュボード</h1>
      <p className="mt-2 text-slate-600">在庫・入庫予定・発送予定・パチマート出品を一つの流れで管理できます。</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InventorySummaryCard label="在庫件数" value={`${kpi.inventoryCount}件`} />
        <InventorySummaryCard label="在庫台数" value={`${kpi.inventoryUnitCount}台`} />
        <InventorySummaryCard label="入庫予定件数" value={`${kpi.inboundOpenCount}件`} />
        <InventorySummaryCard label="発送予定件数" value={`${kpi.outboundOpenCount}件`} />
        <InventorySummaryCard label="入庫先未設定件数" value={`${kpi.inboundDestinationMissingCount}件`} />
        <InventorySummaryCard label="見込み粗利合計" value={formatCurrency(kpi.projectedGrossProfitTotal)} />
      </div>

      <InventorySectionCard title="営業デモ向け説明" className="mt-6" description="販売管理と倉庫管理をつなぎ、二重入力を減らす運用を想定しています。">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>在庫・入庫予定・発送予定・パチマート出品を一つの流れで管理できます</li>
          <li>成約した取引は発送予定へ、購入した取引は入庫予定へつながります</li>
          <li>入庫完了・発送完了のタイミングで在庫数が反映されます</li>
          <li>見込み粗利も在庫単位で確認できます</li>
        </ul>
      </InventorySectionCard>

      <InventorySectionCard title="業務フロー" description="購入から入出庫、出品、成約までの実運用フローです。" className="mt-6">
        <InventoryFlowSteps steps={flowSteps} />
      </InventorySectionCard>

      <InventorySectionCard title="最近の在庫の動き" className="mt-6" description="入庫予定・発送予定・完了・取消を統合したイベントフィードです。">
        <div className="mb-3 flex justify-end">
          <Link href="/inventory/activity" className="text-sm font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800">
            すべて見る
          </Link>
        </div>
        <ul className="divide-y rounded-lg border bg-white">
          {recentActivities.map((activity) => (
            <li key={activity.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs text-slate-500">{toDate(activity.occurredAt)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activity.title}</p>
                <p className="mt-1 text-xs text-slate-600">{activity.description}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700">{activity.badgeLabel}</span>
                {typeof activity.quantityDelta === "number" ? (
                  <p className={`mt-2 text-sm font-semibold ${activity.quantityDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {activity.quantityDelta >= 0 ? `+${activity.quantityDelta}` : activity.quantityDelta}台
                  </p>
                ) : null}
                <Link href={activity.href} className="mt-2 block text-xs text-blue-700 underline underline-offset-2 hover:text-blue-800">詳細を見る</Link>
              </div>
            </li>
          ))}
        </ul>
      </InventorySectionCard>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["在庫一覧を見る", "/inventory/items"],
          ["入庫予定を見る", "/inventory/inbound"],
          ["発送予定を見る", "/inventory/outbound"],
          ["入庫先未設定を確認", "/inventory/inbound?filter=destination-missing"],
          ["在庫から出品する", "/inventory/items"],
          ["利益見込みを確認する", "/inventory/items"],
          ["在庫設定を見る", "/inventory/settings"],
        ].map(([label, href]) => (
          <Link key={`${href}-${label}`} href={href} className="rounded-lg border bg-white p-4 text-center text-sm font-semibold hover:bg-slate-50">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
