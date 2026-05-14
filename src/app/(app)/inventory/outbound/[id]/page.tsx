import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, outboundStatusLabel, shippingMethodLabel } from "@/features/inventory/labels";
import { cancelCompletedOutboundSchedule, cancelOutboundSchedule, completeOutboundSchedule, getOutboundScheduleById } from "@/features/inventory/server";

type InvoiceRouteInfo = { href: string; label: string };

const extractPachimartDealId = (note: string | null | undefined): string | null => {
  if (!note) return null;
  const explicit = note.match(/PM-DEMO-[A-Za-z0-9-]+/i)?.[0];
  if (explicit) return explicit;
  const labelMatch = note.match(/PachimartDealId\s*[:：]\s*([A-Za-z0-9-]+)/i);
  return labelMatch?.[1] ?? null;
};

const buildSalesInvoiceRoute = (sourceId: string | null | undefined): InvoiceRouteInfo | null => {
  if (!sourceId) return null;
  if (sourceId.startsWith("S-V-")) return { href: `/sales/sales-invoice/vendor/${sourceId}`, label: "販売伝票詳細へ（業者）" };
  if (sourceId.startsWith("S-H-")) return { href: `/sales/sales-invoice/hall/${sourceId}`, label: "販売伝票詳細へ（ホール）" };
  if (sourceId.startsWith("S-G-")) return { href: `/sales/sales-invoice/group/${sourceId}`, label: "販売伝票詳細へ（グループ）" };
  return null;
};

export default async function OutboundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await getOutboundScheduleById(id);
  if (!schedule) notFound();

  const unit = schedule.inventoryUnits[0] ?? null;
  const isSalesDerived =
    schedule.sourceId?.startsWith("S-V-") ||
    schedule.sourceId?.startsWith("S-H-") ||
    schedule.sourceId?.startsWith("S-G-") ||
    schedule.note?.includes("販売伝票連携");
  const pmDealId = extractPachimartDealId(schedule.note);
  const salesInvoiceRoute = buildSalesInvoiceRoute(schedule.sourceId);
  const sourceLabel = isSalesDerived ? "販売伝票" : schedule.sourceType ?? "MANUAL";
  const linkMissing = !schedule.inventoryItemId || !unit;

  return <div className="mx-auto max-w-5xl space-y-4 px-4 py-6"><InventoryTabs /><h1 className="text-2xl font-bold">出庫予定詳細</h1>
    {linkMissing ? <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">紐付け在庫なし / Unit未紐付け</p><p className="mt-1">この出庫予定は販売伝票から作成されていますが、まだ在庫・Unitに紐付いていません。</p><p>在庫未紐付けのため出庫完了できません。対象在庫またはUnitを紐付けてください。</p></div> : null}
    <div className="grid gap-2 rounded border bg-white p-4 text-sm md:grid-cols-2">
      <p>出庫予定ID: {schedule.id}</p><p>予定日: {schedule.expectedDate.toISOString().slice(0, 10)}</p>
      <p>ステータス: {outboundStatusLabel(schedule.status)}</p><p>由来: {sourceLabel}{pmDealId ? " / パチマート成約由来" : ""}</p>
      <p>販売伝票ID: {schedule.sourceId ?? "-"}</p><p>パチマート取引ID: {pmDealId ?? "-"}</p>
      <p>販売先/買主: {schedule.buyerName ?? "-"}</p><p>機種名: {schedule.modelNameSnapshot}</p>
      <p>メーカー: {schedule.makerNameSnapshot ?? "-"}</p><p>台数: {formatQuantity(schedule.quantity)}</p>
      <p>保管先: {schedule.originLocation?.name ?? "-"}</p><p>出庫方法: {shippingMethodLabel(schedule.shippingMethod)}</p>
      <p>運送会社: -</p><p>発送先: {schedule.buyerName ?? "-"}</p>
      <p className="md:col-span-2">備考: {schedule.note ?? "-"}</p>
    </div>
    <div className="rounded border bg-white p-4 text-sm space-y-1">
      <h2 className="font-semibold">対象Unit</h2>
      <p>Unit番号: {unit?.displayCode ?? "-"}</p><p>QR(補助): {unit?.rawQr ?? "-"}</p><p>status: {unit?.status ?? "-"}</p><p>codeType: {unit?.codeType ?? "-"}</p><p>メモ: {unit?.memo ?? "-"}</p>
    </div>
    <div className="rounded border bg-white p-4 text-sm">
      <h2 className="font-semibold">倉庫作業デモ手順</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {linkMissing ? <><li>対象在庫を紐付け</li><li>Unit番号を確認</li></> : <><li>出庫対象を確認</li><li>Unit番号を確認</li></>}
        <li>QR確認（デモ）</li><li>発送先確認</li><li>出庫完了</li>
      </ol>
    </div>
    <div className="flex flex-wrap gap-2 text-sm">
      {salesInvoiceRoute ? <Link href={salesInvoiceRoute.href} className="underline">{salesInvoiceRoute.label}</Link> : null}
      <Link href={`/inventory/outbound/${schedule.id}/work`} className="underline">出庫作業へ</Link>
      <form action={async () => {"use server"; await completeOutboundSchedule(schedule.id); redirect(`/inventory/outbound/${schedule.id}/work`);}}><Button type="submit" disabled={linkMissing}>出庫完了</Button></form>
      <form action={async () => {"use server"; if (["SHIPPED", "DELIVERED"].includes(schedule.status)) { await cancelCompletedOutboundSchedule(schedule.id); } else { await cancelOutboundSchedule(schedule.id); } redirect("/inventory/outbound");}}><Button type="submit" variant="outline">取消</Button></form>
      <Link href="/inventory/outbound" className="underline">一覧へ戻る</Link>
    </div>
  </div>;
}
