import type { InventoryListingStatus, InventoryMovement, InventoryStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  InventoryPlannedBadge,
  InventorySectionCard,
  InventoryTimeline,
} from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import {
  formatQuantity,
  inventoryListingStatusLabel,
  inventoryMovementStatusLabel,
  inventoryMovementTypeLabel,
  inventoryStatusLabel,
} from "@/features/inventory/labels";
import { getInventoryItemById, resyncInventoryListingStatusAction, updatePaymentRecord, updatePurchaseRecord, updateSalesRecord } from "@/features/inventory/server";
import { getExhibitStatusesByIds } from "@/features/inventory/listing-sync";
import { calculateProjectedProfit } from "@/features/inventory/profit";
import { calculateRealGrossProfit } from "@/features/inventory/real-profit";
import { isAutoRecordMemo } from "@/features/inventory/auto-records";
import { InventoryProfitSummary } from "@/features/inventory/components/InventoryProfit";

const isListingBlocked = (inventoryStatus: InventoryStatus, quantityOnHand: number) =>
  quantityOnHand <= 0 || inventoryStatus === "SOLD" || inventoryStatus === "ARCHIVED";

const isDuplicateListingRisk = (listingStatus: InventoryListingStatus) =>
  listingStatus === "LISTED" || listingStatus === "NEGOTIATING" || listingStatus === "CONTRACTED";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  const item = await getInventoryItemById(params.id);
  if (!item) notFound();

  const activities = item.movements.map(
    (m: InventoryMovement) =>
      `${(m.committedAt ?? m.scheduledAt ?? m.createdAt).toISOString().slice(0, 10)} ${inventoryMovementTypeLabel(
        m.movementType
      )}(${inventoryMovementStatusLabel(m.status)}) ${m.quantityDelta > 0 ? "+" : ""}${m.quantityDelta}台`
  );
  const projectedProfit = calculateProjectedProfit({
    purchaseUnitPrice: item.purchaseUnitPrice,
    plannedSaleUnitPrice: item.plannedSaleUnitPrice,
    quantity: item.quantityOnHand,
  });

  const purchaseTotal = item.purchaseRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.totalCost, 0);
  const salesTotal = item.salesRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.totalSales, 0);
  const purchaseSideCosts = item.purchaseRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.shippingCost + row.otherCost, 0);
  const salesSideFees = item.salesRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.shippingFee + row.platformFee + row.otherFee, 0);
  const realProfit = calculateRealGrossProfit({
    totalSales: salesTotal,
    totalCost: purchaseTotal,
    salesSideFees,
    purchaseSideCosts,
  });

  const latestPurchase = item.purchaseRecords[0] ?? null;
  const latestSales = item.salesRecords[0] ?? null;
  const purchasePayment = latestPurchase ? item.paymentRecords.find((p) => p.sourceType === "PURCHASE_RECORD" && p.sourceId === latestPurchase.id) : null;
  const salesPayment = latestSales ? item.paymentRecords.find((p) => p.sourceType === "SALES_RECORD" && p.sourceId === latestSales.id) : null;

  const exhibitStatuses = await getExhibitStatusesByIds(item.externalLinks.map((link) => link.externalId));

  const canList = !isListingBlocked(item.inventoryStatus, item.quantityOnHand);
  const showDuplicateWarning = isDuplicateListingRisk(item.listingStatus);

  const exhibitType = item.itemType === "PACHINKO" ? "pachinko" : "slot";
  const query = new URLSearchParams({
    inventoryItemId: item.id,
    itemType: item.itemType,
    makerName: item.maker?.name ?? item.makerNameSnapshot ?? "",
    modelName: item.machineModel?.name ?? item.modelNameSnapshot,
    frameColor: item.frameColor ?? "",
    quantity: String(item.quantityOnHand),
    unitPriceExclTax: item.plannedSaleUnitPrice ? String(item.plannedSaleUnitPrice) : "",
    storageLocationId: item.storageLocationId ?? "",
    note: item.note ?? "",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <Link href="/inventory/items" className="text-sm text-blue-600 underline">
        ← 在庫一覧へ戻る
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">在庫詳細 {item.id}</h1>
        <Link
          href={`/inventory/items/${item.id}/edit`}
          className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          在庫情報を編集
        </Link>
      </div>

      <InventorySectionCard title="概要" className="mt-5" description="販売管理・倉庫管理に必要な情報を同時に確認できます。">
        <div className="grid gap-3 text-sm md:grid-cols-3">
          {[
            ["機種名", item.machineModel?.name ?? item.modelNameSnapshot],
            ["メーカー", item.maker?.name ?? item.makerNameSnapshot ?? "-"],
            ["台数", formatQuantity(item.quantityOnHand)],
            ["保管場所", item.storageLocation?.name ?? "-"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-slate-500">{k}</p>
              <p className="font-medium">{v}</p>
            </div>
          ))}
          <div>
            <p className="text-slate-500">ステータス</p>
            <InventoryStatusBadge status={inventoryStatusLabel(item.inventoryStatus)} />
          </div>
          <div>
            <p className="text-slate-500">出品状態</p>
            <InventoryStatusBadge status={inventoryListingStatusLabel(item.listingStatus)} />
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>仕入記録: {latestPurchase ? (isAutoRecordMemo(latestPurchase.memo) ? "自動作成" : "手動作成") : "-"}</p>
          <p>売上記録: {latestSales ? (isAutoRecordMemo(latestSales.memo) ? "自動作成" : "手動作成") : "-"}</p>
          <p>関連取引ID(仕入): {latestPurchase?.dealingId ?? "-"}</p>
          <p>関連取引ID(売上): {latestSales?.dealingId ?? "-"}</p>
          <p>仕入状態: {latestPurchase?.paymentStatus ?? "-"}</p>
          <p>売上状態: {latestSales?.paymentStatus ?? "-"}</p>
          <p>支払予定ステータス: {purchasePayment?.status ?? "-"}</p>
          <p>入金予定ステータス: {salesPayment?.status ?? "-"}</p>
        </div>
      </InventorySectionCard>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <InventorySectionCard title="この在庫でできること">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>在庫情報をもとに、パチマートの出品登録へ進みます</span>
              <InventoryPlannedBadge label="STEP2-G1" />
            </li>
            <li>メーカー・機種名・台数・保管場所・販売予定価格を初期値として引き継ぎます</li>
            <li>出品作成後、在庫との紐付けを自動で作成します</li>
          </ul>
        </InventorySectionCard>

        <InventorySectionCard title="利益見込み" description="税抜基準の参考値です。価格入力で見込み粗利を確認できます。">
          <InventoryProfitSummary
            itemId={item.id}
            purchaseUnitPrice={item.purchaseUnitPrice}
            plannedSaleUnitPrice={item.plannedSaleUnitPrice}
            projected={projectedProfit}
          />
        </InventorySectionCard>
      </div>


            <InventorySectionCard title="実績収支" className="mt-5" description="仕入・売上記録ベースの実粗利です。">
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div><p className="text-slate-500">仕入金額</p><p className="text-lg font-semibold">{purchaseTotal.toLocaleString()}円</p></div>
          <div><p className="text-slate-500">売上金額</p><p className="text-lg font-semibold">{salesTotal.toLocaleString()}円</p></div>
          <div><p className="text-slate-500">費用</p><p className="text-lg font-semibold">{(purchaseSideCosts + salesSideFees).toLocaleString()}円</p></div>
          <div><p className="text-slate-500">実粗利</p><p className="text-lg font-bold">{realProfit.realGrossProfit.toLocaleString()}円</p></div>
          <div><p className="text-slate-500">粗利率</p><p className="text-lg font-bold">{realProfit.profitRate != null ? `${realProfit.profitRate}%` : "-"}</p></div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {item.purchaseRecords.map((record) => (
            <form key={record.id} action={updatePurchaseRecord} className="rounded border p-3 text-xs space-y-2">
              <input type="hidden" name="id" value={record.id} />
              <p className="font-semibold">仕入記録 {record.paymentStatus === "CANCELED" ? "(取消済)" : ""}</p>
              <input name="purchaseDate" type="date" defaultValue={record.purchaseDate.toISOString().slice(0,10)} className="w-full rounded border p-1" />
              <input name="unitCost" type="number" min={0} defaultValue={record.unitCost} className="w-full rounded border p-1" />
              <input name="quantity" type="number" min={1} defaultValue={record.quantity} className="w-full rounded border p-1" />
              <input name="shippingCost" type="number" min={0} defaultValue={record.shippingCost} className="w-full rounded border p-1" />
              <input name="otherCost" type="number" min={0} defaultValue={record.otherCost} className="w-full rounded border p-1" />
              <select name="paymentStatus" defaultValue={record.paymentStatus} className="w-full rounded border p-1"><option value="UNPAID">未払い</option><option value="PARTIAL">一部支払</option><option value="PAID">支払済</option><option value="CANCELED">取消</option></select>
              <input name="memo" defaultValue={record.memo ?? ""} className="w-full rounded border p-1" />
              <Button type="submit">仕入を更新</Button>
            </form>
          ))}
          {item.salesRecords.map((record) => (
            <form key={record.id} action={updateSalesRecord} className="rounded border p-3 text-xs space-y-2">
              <input type="hidden" name="id" value={record.id} />
              <p className="font-semibold">売上記録 {record.paymentStatus === "CANCELED" ? "(取消済)" : ""}</p>
              <input name="salesDate" type="date" defaultValue={record.salesDate.toISOString().slice(0,10)} className="w-full rounded border p-1" />
              <input name="unitPrice" type="number" min={0} defaultValue={record.unitPrice} className="w-full rounded border p-1" />
              <input name="quantity" type="number" min={1} defaultValue={record.quantity} className="w-full rounded border p-1" />
              <input name="shippingFee" type="number" min={0} defaultValue={record.shippingFee} className="w-full rounded border p-1" />
              <input name="platformFee" type="number" min={0} defaultValue={record.platformFee} className="w-full rounded border p-1" />
              <input name="otherFee" type="number" min={0} defaultValue={record.otherFee} className="w-full rounded border p-1" />
              <select name="paymentStatus" defaultValue={record.paymentStatus} className="w-full rounded border p-1"><option value="UNPAID">未払い</option><option value="PARTIAL">一部入金</option><option value="PAID">入金済</option><option value="CANCELED">取消</option></select>
              <input name="memo" defaultValue={record.memo ?? ""} className="w-full rounded border p-1" />
              <Button type="submit">売上を更新</Button>
            </form>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {item.paymentRecords.map((payment) => (
            <form key={payment.id} action={updatePaymentRecord} className="rounded border p-3 text-xs space-y-2">
              <input type="hidden" name="id" value={payment.id} />
              <p className="font-semibold">入出金 {payment.status === "CANCELED" ? "(取消済)" : ""}</p>
              <input name="amount" type="number" min={0} defaultValue={payment.amount} className="w-full rounded border p-1" />
              <select name="status" defaultValue={payment.status} className="w-full rounded border p-1"><option value="PLANNED">予定</option><option value="PAID">完了</option><option value="CANCELED">取消</option></select>
              <input name="paidAt" type="date" defaultValue={payment.paidAt ? payment.paidAt.toISOString().slice(0,10) : ""} className="w-full rounded border p-1" />
              <input name="memo" defaultValue={payment.memo ?? ""} className="w-full rounded border p-1" />
              <Button type="submit">入出金を更新</Button>
            </form>
          ))}
        </div>
      </InventorySectionCard>

      <InventorySectionCard title="関連する動き" className="mt-5">
        <InventoryTimeline items={activities.length ? activities : ["履歴はありません"]} />
      </InventorySectionCard>

      <InventorySectionCard title="出品紐付け情報" className="mt-5">
        {item.externalLinks.length > 0 ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-emerald-700">この在庫はパチマート出品と紐付いています。</p>
            <ul className="space-y-2">
              {item.externalLinks.map((link) => (
                <li key={link.id} className="rounded border border-slate-200 p-3">
                  <p>Exhibit ID: {link.externalId}</p>
                  <p>作成日: {link.createdAt.toISOString().slice(0, 10)}</p>
                  <p>同期状態: {link.syncStatus}</p>
                  <p>最終同期日時: {link.syncedAt ? link.syncedAt.toISOString().slice(0, 19).replace("T", " ") : "-"}</p>
                  <p>Exhibit.status: {exhibitStatuses.get(link.externalId) ?? "-"}</p>
                  <p>InventoryItem.listingStatus: {item.listingStatus}</p>
                  <form action={resyncInventoryListingStatusAction} className="mt-2">
                    <input type="hidden" name="linkId" value={link.id} />
                    <input type="hidden" name="inventoryItemId" value={item.id} />
                    <Button type="submit">出品状態を再同期</Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-sm text-slate-500"><p>まだ出品と紐付いていません。</p><p>在庫から出品登録を行うと、ここに出品情報が表示されます。</p></div>
        )}
      </InventorySectionCard>

      <div className="mt-5 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {canList ? (
            <Link href={`/market/mypage/exhibits/new/${exhibitType}?${query.toString()}`}>
              <Button>パチマートに出品する</Button>
            </Link>
          ) : (
            <Button disabled>パチマートに出品する</Button>
          )}
        </div>
        {!canList ? <p className="text-sm text-rose-600">在庫数が0台、または売却済み/アーカイブ済みの在庫は出品できません。</p> : null}
        {showDuplicateWarning ? (
          <p className="text-sm text-amber-700">すでに出品中の在庫です。重複出品にご注意ください。</p>
        ) : null}
      </div>
    </div>
  );
}
