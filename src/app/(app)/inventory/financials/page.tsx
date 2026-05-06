import Link from "next/link";
import { summarizeInventoryFinancials } from "@/features/inventory/financials";
import { getFinancialSummaryData } from "@/features/inventory/server";

export default async function FinancialsPage() {
  const { purchases, sales, payments } = await getFinancialSummaryData();
  const s = summarizeInventoryFinancials({ purchases, sales, payments });
  return <div className="mx-auto max-w-6xl px-4 py-8 space-y-4"><h1 className="text-2xl font-bold">収支管理</h1><div className="grid md:grid-cols-4 gap-3 text-sm">{[["仕入総額",s.purchaseTotal],["売上総額",s.salesTotal],["実粗利合計",s.realGrossProfit],["粗利率",s.grossMarginRate==null?"-":`${s.grossMarginRate}%`],["未払い",s.unpaidAmount],["未入金",s.unreceivedAmount],["取消件数",s.canceledCount]].map(([k,v])=><div key={String(k)} className="border rounded p-3"><p className="text-slate-500">{k}</p><p className="font-semibold">{typeof v==='number'?`${v.toLocaleString()}${k==='粗利率'?'':'円'}`:v}</p></div>)}</div><div className="flex gap-4 text-blue-600 underline text-sm"><Link href="/inventory/financials/purchases">仕入一覧</Link><Link href="/inventory/financials/sales">売上一覧</Link><Link href="/inventory/financials/payments">入出金一覧</Link><Link href="/inventory/financials/profit">実粗利一覧</Link></div></div>;
}
