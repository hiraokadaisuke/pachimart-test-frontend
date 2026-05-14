"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PACHIMART_DEMO_DEALS, buildPachimartDealInvoiceMap } from "@/lib/demo-data/pachimartDeals";
import { loadAllSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { SalesInvoice } from "@/types/salesInvoices";

type SummaryValue = number | "-" | "取得不可";
type SummaryState = { dealCount: SummaryValue; uninvoicedCount: SummaryValue; unscheduledCount: SummaryValue; scheduledCount: SummaryValue; documentStatus: string };
const buildInvoiceDetailHref = (invoiceId: string) => invoiceId.startsWith("S-V-") ? `/sales/sales-invoice/vendor/${invoiceId}` : invoiceId.startsWith("S-H-") ? `/sales/sales-invoice/hall/${invoiceId}` : invoiceId.startsWith("S-G-") ? `/sales/sales-invoice/group/${invoiceId}` : "/sales/sales-invoice/list";
const resolveInvoiceTimestamp = (invoice: SalesInvoice) => { const source = invoice.createdAt || invoice.issuedDate; const date = source ? new Date(source) : null; return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0; };

export default function SalesDemoFlowPage() {
  const [summary, setSummary] = useState<SummaryState>({ dealCount: PACHIMART_DEMO_DEALS.length, uninvoicedCount: "-", unscheduledCount: "-", scheduledCount: "-", documentStatus: "対応済" });
  const [latestInvoiceId, setLatestInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const invoiceMap = buildPachimartDealInvoiceMap();
    const invoices = loadAllSalesInvoices();
    const latestInvoice = [...invoices].sort((a, b) => resolveInvoiceTimestamp(b) - resolveInvoiceTimestamp(a))[0];
    setLatestInvoiceId(latestInvoice?.invoiceId ?? null);
    const dealCount = PACHIMART_DEMO_DEALS.length;
    const salesInvoiceIds = Array.from(invoiceMap.values());
    const uninvoicedCount = Math.max(dealCount - invoiceMap.size, 0);
    if (salesInvoiceIds.length === 0) { setSummary({ dealCount, uninvoicedCount, unscheduledCount: 0, scheduledCount: 0, documentStatus: "対応済" }); return; }
    void fetch("/api/inventory/outbound/sales-invoice-status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ salesInvoiceIds }) })
      .then(async (response) => {
        if (!response.ok) throw new Error("status fetch failed");
        const data = (await response.json()) as { scheduledInvoiceIds?: string[] };
        const scheduledCount = data.scheduledInvoiceIds?.length ?? 0;
        setSummary({ dealCount, uninvoicedCount, scheduledCount, unscheduledCount: Math.max(salesInvoiceIds.length - scheduledCount, 0), documentStatus: latestInvoice ? "対応済" : "デモデータ" });
      })
      .catch(() => setSummary({ dealCount, uninvoicedCount, unscheduledCount: "取得不可", scheduledCount: "取得不可", documentStatus: latestInvoice ? "対応済" : "デモデータ" }));
  }, []);

  const salesInvoiceHref = latestInvoiceId ? buildInvoiceDetailHref(latestInvoiceId) : "/sales/sales-invoice/list";
  const documentLinks = useMemo(() => latestInvoiceId ? [
    { label: "請求書を見る", href: `${buildInvoiceDetailHref(latestInvoiceId)}?document=invoice` },
    { label: "売買契約書を見る", href: `${buildInvoiceDetailHref(latestInvoiceId)}?document=contract` },
    { label: "発送依頼書を見る", href: `${buildInvoiceDetailHref(latestInvoiceId)}?document=shipping-request` },
    { label: "出庫指示書を見る", href: `${buildInvoiceDetailHref(latestInvoiceId)}?document=outbound-instruction` },
    { label: "書類一括を見る", href: `${buildInvoiceDetailHref(latestInvoiceId)}?document=bundle` },
  ] : [], [latestInvoiceId]);

  const steps = [
    { step: "STEP1", title: "パチマート成約一覧を見る", description: "パチマートで成約した案件が一覧に入ります。", href: "/sales/pachimart-deals", cta: "成約一覧を開く", badges: ["デモ可", "確認済"] },
    { step: "STEP2", title: "販売伝票を作成する", description: "未伝票化の成約から販売伝票を作成します。", href: "/sales/pachimart-deals", cta: "販売伝票を作成する", badges: [summary.uninvoicedCount === 0 ? "作成済" : "未伝票化あり"] },
    { step: "STEP3", title: "販売伝票詳細ハブを見る", description: "販売先、明細、粗利、出庫、履歴、帳票を確認できます。", href: salesInvoiceHref, cta: "販売伝票詳細を開く", badges: [latestInvoiceId ? "確認済" : "一覧誘導"] },
    { step: "STEP4", title: "出庫予定を作成/同期する", description: "販売伝票から倉庫側の出庫予定を作成します。", href: "/sales/pachimart-deals", cta: "出庫予定を作成する", badges: [summary.unscheduledCount === 0 ? "作成済" : "未作成あり"] },
    { step: "STEP5", title: "倉庫側の出庫予定を見る", description: "営業側で作成した出庫予定が倉庫一覧へ表示されます。", href: "/inventory/outbound", cta: "出庫予定一覧を開く", badges: ["デモ可"] },
    { step: "STEP6", title: "出庫予定詳細/倉庫作業を見る", description: "倉庫担当が出庫対象、発送先、Unit/QR確認を行います。", href: "/inventory/outbound", cta: "出庫予定詳細を開く", badges: ["一覧から選択"] },
  ] as const;

  return <div className="space-y-4"><div className="border border-slate-300 bg-slate-700 px-4 py-3 text-white"><h1 className="text-xl font-bold">営業デモフロー</h1><p className="text-sm text-slate-100">パチマート成約から販売伝票、出庫予定、帳票までの推奨デモ順を確認できます。</p></div>
    <div className="grid gap-2 md:grid-cols-5">{[{ label: "パチマート成約", value: summary.dealCount }, { label: "未伝票化", value: summary.uninvoicedCount }, { label: "出庫予定未作成", value: summary.unscheduledCount }, { label: "出庫予定", value: summary.scheduledCount }, { label: "帳票プレビュー", value: summary.documentStatus }].map((item) => <div key={item.label} className="border border-slate-300 bg-white px-3 py-2"><p className="text-xs text-slate-600">{item.label}</p><p className="text-lg font-bold text-slate-800">{typeof item.value === "number" ? `${item.value}件` : item.value}</p></div>)}</div>
    <div className="overflow-hidden border border-slate-300 bg-white"><table className="w-full text-sm"><thead className="bg-slate-100 text-slate-700"><tr><th className="border-b border-slate-300 px-3 py-2 text-left">STEP</th><th className="border-b border-slate-300 px-3 py-2 text-left">内容</th><th className="border-b border-slate-300 px-3 py-2 text-left">状態</th><th className="border-b border-slate-300 px-3 py-2 text-left">操作</th></tr></thead><tbody>{steps.map((item) => <tr key={item.step} className="border-b border-slate-200 align-top"><td className="px-3 py-3 font-semibold text-slate-700">{item.step}</td><td className="px-3 py-3"><p className="font-semibold text-slate-900">{item.title}</p><p className="text-xs text-slate-600">{item.description}</p></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{item.badges.map((badge) => <span key={badge} className="border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">{badge}</span>)}</div></td><td className="px-3 py-3"><Link href={item.href} className="inline-flex border border-slate-700 bg-slate-700 px-3 py-1 text-xs font-semibold text-white">{item.cta}</Link></td></tr>)}
      <tr className="align-top"><td className="px-3 py-3 font-semibold text-slate-700">STEP7</td><td className="px-3 py-3"><p className="font-semibold text-slate-900">帳票を確認する</p><p className="text-xs text-slate-600">請求書、売買契約書、発送依頼書、出庫指示書を確認できます。</p></td><td className="px-3 py-3"><span className="border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">{summary.documentStatus}</span></td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{documentLinks.length > 0 ? documentLinks.map((doc) => <Link key={doc.label} href={doc.href} className="inline-flex border border-slate-500 bg-white px-2 py-1 text-xs text-slate-700">{doc.label}</Link>) : <Link href="/sales/sales-invoice/list" className="inline-flex border border-slate-700 bg-slate-700 px-3 py-1 text-xs font-semibold text-white">販売伝票一覧へ</Link>}</div></td></tr>
    </tbody></table></div></div>;
}
