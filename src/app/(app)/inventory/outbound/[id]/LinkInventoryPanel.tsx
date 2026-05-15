"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OutboundLinkCandidate } from "@/features/inventory/server";

type Props = { scheduleId: string; candidates: OutboundLinkCandidate[] };

export function LinkInventoryPanel({ scheduleId, candidates }: Props) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onLink = async (candidate: OutboundLinkCandidate) => {
    setLoadingKey(`${candidate.inventoryItemId}:${candidate.inventoryUnitId ?? "none"}`);
    setError(null);
    const res = await fetch(`/api/inventory/outbound/${scheduleId}/link-inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryItemId: candidate.inventoryItemId, inventoryUnitId: candidate.inventoryUnitId }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.message ?? "紐付けに失敗しました。");
      setLoadingKey(null);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded border bg-white p-4 text-sm space-y-2">
      <h2 className="font-semibold">対象在庫・個体を紐付ける</h2>
      {error ? <p className="rounded border border-red-300 bg-red-50 p-2 text-red-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-50">
              {['管理番号','メーカー','機種名','在庫数','保管倉庫','個体番号','個体QR','状態','備考','一致理由','操作'].map((h) => <th key={h} className="border border-black px-2 py-1 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? <tr><td colSpan={11} className="border border-black px-2 py-3 text-center text-slate-500">候補がありません。</td></tr> : candidates.map((c) => {
              const key = `${c.inventoryItemId}:${c.inventoryUnitId ?? "none"}`;
              return <tr key={key} className={c.isDemoFallback ? "bg-amber-50" : "bg-white"}>
                <td className="border border-black px-2 py-1">{c.managementCode}</td><td className="border border-black px-2 py-1">{c.makerName}</td><td className="border border-black px-2 py-1">{c.modelName}</td><td className="border border-black px-2 py-1">{c.quantityOnHand}</td><td className="border border-black px-2 py-1">{c.storageName}</td><td className="border border-black px-2 py-1">{c.unitDisplayCode}</td><td className="border border-black px-2 py-1">{c.unitQr}</td><td className="border border-black px-2 py-1">{c.unitStatus}</td><td className="border border-black px-2 py-1">{c.note || "-"}</td><td className="border border-black px-2 py-1">{c.matchReasons.join(" / ")}</td>
                <td className="border border-black px-2 py-1"><button className="rounded border border-black px-2 py-1 disabled:opacity-50" onClick={() => onLink(c)} disabled={loadingKey === key}>{loadingKey === key ? "処理中..." : c.inventoryUnitId ? "この個体を紐付ける" : "この在庫を紐付ける"}</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600">この出庫予定に対して、出庫対象となる在庫または個体を選択してください。紐付けだけでは在庫数量は変更されません。
      ※ demo fallback候補は薄黄色で表示されます。実データ候補がある場合は表示されません。</p>
    </div>
  );
}
