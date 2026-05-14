"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addSalesInvoice, generateSalesInvoiceId, loadAllSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { PACHIMART_DEMO_DEALS, buildPachimartDealInvoiceMap } from "@/lib/demo-data/pachimartDeals";

const inputClass = "w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-sm";

export default function PachimartDealsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ from: "", to: "", maker: "", model: "", customer: "", status: "all" });
  const [invoiceMap, setInvoiceMap] = useState<Map<string, string>>(() => buildPachimartDealInvoiceMap());
  const [scheduledInvoiceIds, setScheduledInvoiceIds] = useState<Set<string>>(new Set());
  const [syncingDealId, setSyncingDealId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);



  const refreshOutboundStatuses = async (nextInvoiceMap: Map<string, string>) => {
    const salesInvoiceIds = Array.from(nextInvoiceMap.values());
    if (salesInvoiceIds.length === 0) {
      setScheduledInvoiceIds(new Set());
      return;
    }
    const response = await fetch("/api/inventory/outbound/sales-invoice-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salesInvoiceIds }),
    });
    if (!response.ok) throw new Error("出庫予定の状態取得に失敗しました");
    const data = (await response.json()) as { scheduledInvoiceIds?: string[] };
    setScheduledInvoiceIds(new Set(data.scheduledInvoiceIds ?? []));
  };

  useEffect(() => {
    void refreshOutboundStatuses(invoiceMap).catch((error) => {
      console.error(error);
      setSyncError("出庫予定の状態取得に失敗しました。再読み込みしてください。");
    });
  }, [invoiceMap]);

  const rows = useMemo(() => PACHIMART_DEMO_DEALS.filter((deal) => {
    if (filters.from && deal.dealDate < filters.from) return false;
    if (filters.to && deal.dealDate > filters.to) return false;
    if (filters.maker && !deal.makerName.includes(filters.maker)) return false;
    if (filters.model && !deal.machineName.includes(filters.model)) return false;
    if (filters.customer && !deal.customerName.includes(filters.customer)) return false;
    const invoiced = invoiceMap.has(deal.pachimartDealId);
    if (filters.status === "invoiced" && !invoiced) return false;
    if (filters.status === "uninvoiced" && invoiced) return false;
    return true;
  }), [filters, invoiceMap]);

  const createInvoiceFromDeal = async (dealId: string) => {
    const deal = PACHIMART_DEMO_DEALS.find((entry) => entry.pachimartDealId === dealId);
    if (!deal) return;
    const existingInvoiceId = buildPachimartDealInvoiceMap().get(deal.pachimartDealId);
    if (existingInvoiceId) {
      router.push(`/sales/sales-invoice/vendor/${existingInvoiceId}`);
      return;
    }
    const issuedDate = deal.dealDate.replaceAll("-", "/");
    const invoiceId = generateSalesInvoiceId("vendor");
    addSalesInvoice({
      invoiceId,
      invoiceType: "vendor",
      createdAt: new Date().toISOString(),
      issuedDate,
      vendorName: deal.customerName,
      staff: "営業デモ",
      transferDate: deal.dealDate,
      storageLocation: deal.warehouseName,
      remarks: `取引元: パチマート / PachimartDealId: ${deal.pachimartDealId}`,
      items: [{ maker: deal.makerName, productName: deal.machineName, type: deal.category, quantity: deal.quantity, unitPrice: deal.totalAmount, amount: deal.totalAmount }],
      subtotal: Math.floor(deal.totalAmount / 1.1),
      tax: deal.totalAmount - Math.floor(deal.totalAmount / 1.1),
      totalAmount: deal.totalAmount,
    });

    try {
      const latest = loadAllSalesInvoices().find((item) => item.invoiceId === invoiceId);
      await fetch("/api/inventory/outbound/sales-invoice-sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salesInvoiceId: invoiceId,
          salesInvoiceType: "vendor",
          customerName: deal.customerName,
          destinationName: deal.customerName,
          machineShipDate: deal.dealDate,
          shippingMethod: "元払",
          memo: `パチマート成約 ${deal.pachimartDealId}`,
          items: latest?.items ?? [],
        }),
      });
    } catch (error) {
      console.error("出庫予定作成に失敗しました", error);
    }

    const nextInvoiceMap = buildPachimartDealInvoiceMap();
    setInvoiceMap(nextInvoiceMap);
    void refreshOutboundStatuses(nextInvoiceMap);
    router.push(`/sales/sales-invoice/vendor/${invoiceId}`);
  };


  const syncOutboundSchedule = async (dealId: string) => {
    const deal = PACHIMART_DEMO_DEALS.find((entry) => entry.pachimartDealId === dealId);
    if (!deal) return;
    const targetInvoiceMap = buildPachimartDealInvoiceMap();
    const invoiceId = targetInvoiceMap.get(deal.pachimartDealId);
    if (!invoiceId) {
      setSyncError("販売伝票が見つからないため、先に販売伝票を作成してください。");
      return;
    }

    const invoice = loadAllSalesInvoices().find((entry) => entry.invoiceId === invoiceId);
    if (!invoice) {
      setSyncError("販売伝票データを読み込めませんでした。");
      return;
    }

    setSyncError(null);
    setSyncMessage(null);
    setSyncingDealId(dealId);
    try {
      const response = await fetch("/api/inventory/outbound/sales-invoice-sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salesInvoiceId: invoice.invoiceId,
          salesInvoiceType: invoice.invoiceType,
          customerName: invoice.vendorName,
          destinationName: invoice.vendorName,
          machineShipDate: invoice.transferDate ?? deal.dealDate,
          shippingMethod: "元払",
          memo: `パチマート成約 ${deal.pachimartDealId}`,
          items: invoice.items ?? [],
        }),
      });

      if (!response.ok) throw new Error("sync api error");
      const result = (await response.json()) as { createdCount?: number; skippedCount?: number };
      setSyncMessage(`出庫予定を同期しました（作成: ${result.createdCount ?? 0}件 / 既存: ${result.skippedCount ?? 0}件）`);
      setInvoiceMap(targetInvoiceMap);
      await refreshOutboundStatuses(targetInvoiceMap);
    } catch (error) {
      console.error("出庫予定同期に失敗しました", error);
      setSyncError("出庫予定の同期に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSyncingDealId(null);
    }
  };

  return <div className="space-y-4">
    <div className="bg-slate-600 px-3 py-2 text-white"><h1 className="text-xl font-bold">パチマート成約一覧</h1><p className="text-xs">パチマートで成約した取引を販売伝票へ変換します。</p></div>
    <div className="border border-gray-300 bg-white p-3">
      <div className="grid grid-cols-6 gap-2 text-sm">
        <input type="date" className={inputClass} value={filters.from} onChange={(e)=>setFilters((p)=>({...p,from:e.target.value}))} />
        <input type="date" className={inputClass} value={filters.to} onChange={(e)=>setFilters((p)=>({...p,to:e.target.value}))} />
        <input className={inputClass} placeholder="メーカー" value={filters.maker} onChange={(e)=>setFilters((p)=>({...p,maker:e.target.value}))} />
        <input className={inputClass} placeholder="機種名" value={filters.model} onChange={(e)=>setFilters((p)=>({...p,model:e.target.value}))} />
        <input className={inputClass} placeholder="販売先" value={filters.customer} onChange={(e)=>setFilters((p)=>({...p,customer:e.target.value}))} />
        <select className={inputClass} value={filters.status} onChange={(e)=>setFilters((p)=>({...p,status:e.target.value}))}><option value="all">伝票化状況:全て</option><option value="uninvoiced">未伝票化</option><option value="invoiced">伝票化済</option></select>
      </div>
    </div>
    {syncError ? <div className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{syncError}</div> : null}
    {syncMessage ? <div className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{syncMessage} <button className="ml-2 underline" onClick={()=>router.push("/inventory/outbound")}>出庫予定を確認</button></div> : null}
    <div className="overflow-x-auto border border-gray-300 bg-white">
      <table className="min-w-full border-collapse text-sm"><thead className="bg-slate-100"><tr>{["成約日","パチマート取引ID","メーカー","機種名","区分","台数","販売先","合計金額","保管倉庫","伝票化状況","出庫状況","操作"].map((h)=><th key={h} className="border border-gray-300 px-2 py-1 text-left">{h}</th>)}</tr></thead>
      <tbody>{rows.map((deal, idx)=>{const invoiceId=invoiceMap.get(deal.pachimartDealId);const invoiced=Boolean(invoiceId);return <tr key={deal.pachimartDealId} className={idx%2===0?"bg-amber-50":"bg-white"}><td className="border border-gray-300 px-2 py-1">{deal.dealDate.replaceAll("-","/")}</td><td className="border border-gray-300 px-2 py-1">{deal.pachimartDealId}</td><td className="border border-gray-300 px-2 py-1">{deal.makerName}</td><td className="border border-gray-300 px-2 py-1">{deal.machineName}</td><td className="border border-gray-300 px-2 py-1">{deal.category}</td><td className="border border-gray-300 px-2 py-1">{deal.quantity}</td><td className="border border-gray-300 px-2 py-1">{deal.customerName}</td><td className="border border-gray-300 px-2 py-1 text-right">{deal.totalAmount.toLocaleString("ja-JP")}</td><td className="border border-gray-300 px-2 py-1">{deal.warehouseName}</td><td className="border border-gray-300 px-2 py-1">{invoiced?"伝票化済":"未伝票化"}</td><td className="border border-gray-300 px-2 py-1">{invoiced && invoiceId && scheduledInvoiceIds.has(invoiceId) ? "出庫待ち" : "未作成"}</td><td className="border border-gray-300 px-2 py-1">{!invoiced ? <button className="border border-slate-700 bg-slate-700 px-2 py-1 text-white" onClick={()=>void createInvoiceFromDeal(deal.pachimartDealId)}>販売伝票を作成</button> : invoiceId && scheduledInvoiceIds.has(invoiceId) ? <button className="border border-gray-300 bg-slate-100 px-2 py-1" onClick={()=>router.push(`/sales/sales-invoice/vendor/${invoiceId}`)}>販売伝票を開く</button> : <button className="border border-emerald-700 bg-emerald-700 px-2 py-1 text-white disabled:opacity-50" disabled={syncingDealId===deal.pachimartDealId} onClick={()=>void syncOutboundSchedule(deal.pachimartDealId)}>{syncingDealId===deal.pachimartDealId?"同期中...":"出庫予定を作成"}</button>}</td></tr>;})}</tbody></table>
    </div>
  </div>;
}
