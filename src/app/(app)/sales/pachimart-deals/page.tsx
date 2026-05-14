"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addSalesInvoice, generateSalesInvoiceId, loadAllSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { PACHIMART_DEMO_DEALS, buildPachimartDealInvoiceMap } from "@/lib/demo-data/pachimartDeals";

const inputClass = "w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-sm";

export default function PachimartDealsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ from: "", to: "", maker: "", model: "", customer: "", status: "all" });

  const invoiceMap = useMemo(() => buildPachimartDealInvoiceMap(), []);

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

    router.push(`/sales/sales-invoice/vendor/${invoiceId}`);
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
    <div className="overflow-x-auto border border-gray-300 bg-white">
      <table className="min-w-full border-collapse text-sm"><thead className="bg-slate-100"><tr>{["成約日","パチマート取引ID","メーカー","機種名","区分","台数","販売先","合計金額","保管倉庫","伝票化状況","出庫状況","操作"].map((h)=><th key={h} className="border border-gray-300 px-2 py-1 text-left">{h}</th>)}</tr></thead>
      <tbody>{rows.map((deal, idx)=>{const invoiceId=invoiceMap.get(deal.pachimartDealId);const invoiced=Boolean(invoiceId);return <tr key={deal.pachimartDealId} className={idx%2===0?"bg-amber-50":"bg-white"}><td className="border border-gray-300 px-2 py-1">{deal.dealDate.replaceAll("-","/")}</td><td className="border border-gray-300 px-2 py-1">{deal.pachimartDealId}</td><td className="border border-gray-300 px-2 py-1">{deal.makerName}</td><td className="border border-gray-300 px-2 py-1">{deal.machineName}</td><td className="border border-gray-300 px-2 py-1">{deal.category}</td><td className="border border-gray-300 px-2 py-1">{deal.quantity}</td><td className="border border-gray-300 px-2 py-1">{deal.customerName}</td><td className="border border-gray-300 px-2 py-1 text-right">{deal.totalAmount.toLocaleString("ja-JP")}</td><td className="border border-gray-300 px-2 py-1">{deal.warehouseName}</td><td className="border border-gray-300 px-2 py-1">{invoiced?"伝票化済":"未伝票化"}</td><td className="border border-gray-300 px-2 py-1">{invoiced?"出庫待ち":"未作成"}</td><td className="border border-gray-300 px-2 py-1">{invoiced?<button className="border border-gray-300 bg-slate-100 px-2 py-1" onClick={()=>router.push(`/sales/sales-invoice/vendor/${invoiceId}`)}>販売伝票を開く</button>:<button className="border border-slate-700 bg-slate-700 px-2 py-1 text-white" onClick={()=>void createInvoiceFromDeal(deal.pachimartDealId)}>販売伝票を作成</button>}</td></tr>;})}</tbody></table>
    </div>
  </div>;
}
