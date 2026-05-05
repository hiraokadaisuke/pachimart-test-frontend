import Link from "next/link";

import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import {
  INVENTORY_ACTIVITY_RANGE_FILTERS,
  INVENTORY_ACTIVITY_TYPE_FILTERS,
  type InventoryActivityRangeFilter,
  type InventoryActivityTypeFilter,
} from "@/features/inventory/activity-feed";
import { getInventoryActivityData } from "@/features/inventory/server";

const toDate = (value: Date) => value.toISOString().slice(0, 10);

const parseTypeFilter = (value?: string): InventoryActivityTypeFilter => {
  const matched = INVENTORY_ACTIVITY_TYPE_FILTERS.find((filter) => filter.value === value);
  return matched?.value ?? "ALL";
};

const parseRangeFilter = (value?: string): InventoryActivityRangeFilter => {
  const matched = INVENTORY_ACTIVITY_RANGE_FILTERS.find((filter) => filter.value === value);
  return matched?.value ?? "ALL";
};

const parsePage = (value?: string): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
};

export default async function InventoryActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; range?: string; page?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = parseTypeFilter(params.type);
  const rangeFilter = parseRangeFilter(params.range);
  const page = parsePage(params.page);

  const { activities, filteredCount, currentPage, totalPages } = await getInventoryActivityData({
    typeFilter,
    rangeFilter,
    page,
    pageSize: 50,
  });
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-3xl font-bold">在庫の動き</h1>
      <p className="mt-2 text-slate-600">入庫予定・発送予定・入出庫実績・取消履歴を時系列で確認できます</p>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">イベント種別</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INVENTORY_ACTIVITY_TYPE_FILTERS.map((filter) => {
            const isActive = typeFilter === filter.value;
            const href = `/inventory/activity?type=${filter.value}&range=${rangeFilter}&page=1`;
            return (
              <Link key={filter.value} href={href} className={`rounded-md border px-3 py-1 text-sm ${isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>
                {filter.label}
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-900">期間</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INVENTORY_ACTIVITY_RANGE_FILTERS.map((filter) => {
            const isActive = rangeFilter === filter.value;
            const href = `/inventory/activity?type=${typeFilter}&range=${filter.value}&page=1`;
            return (
              <Link key={filter.value} href={href} className={`rounded-md border px-3 py-1 text-sm ${isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">該当 {filteredCount} 件（表示は最大50件）</p>

      <ul className="mt-3 divide-y rounded-lg border bg-white">
        {activities.map((activity) => (
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
              <Link href={activity.href} className="mt-2 block text-xs text-blue-700 underline underline-offset-2 hover:text-blue-800">
                詳細を見る
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-end gap-3 text-sm">
        <Link
          href={`/inventory/activity?type=${typeFilter}&range=${rangeFilter}&page=${prevPage}`}
          className={`rounded-md border px-3 py-1 ${currentPage <= 1 ? "pointer-events-none text-slate-400" : "text-slate-700 hover:bg-slate-50"}`}
        >
          前へ
        </Link>
        <span className="text-slate-600">{currentPage} / {totalPages}ページ</span>
        <Link
          href={`/inventory/activity?type=${typeFilter}&range=${rangeFilter}&page=${nextPage}`}
          className={`rounded-md border px-3 py-1 ${currentPage >= totalPages ? "pointer-events-none text-slate-400" : "text-slate-700 hover:bg-slate-50"}`}
        >
          次へ
        </Link>
      </div>
    </div>
  );
}
