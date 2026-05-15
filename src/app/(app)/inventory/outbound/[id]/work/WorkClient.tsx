"use client";

import { useMemo, useState } from "react";
import { evaluateOutboundUnitCheck } from "@/features/inventory/outbound-work";

export function WorkClient({ unitDisplayCode, unitRawQr, canComplete, completeAction }: { unitDisplayCode: string | null; unitRawQr: string | null; canComplete: boolean; completeAction: () => Promise<void> }) {
  const [displayCodeInput, setDisplayCodeInput] = useState("");
  const [rawQrInput, setRawQrInput] = useState("");
  const check = useMemo(() => evaluateOutboundUnitCheck({ unitDisplayCode, unitRawQr, displayCodeInput, rawQrInput }), [unitDisplayCode, unitRawQr, displayCodeInput, rawQrInput]);
  const canSubmit = canComplete && (check.result === "MATCHED" || check.result === "QR_MATCHED");
  return <div className="space-y-2 rounded border bg-white p-3 text-sm"><input value={displayCodeInput} onChange={(e)=>setDisplayCodeInput(e.target.value)} placeholder="個体番号を入力" className="w-full rounded border p-2" />
  <input value={rawQrInput} onChange={(e)=>setRawQrInput(e.target.value)} placeholder="QRコードを入力" className="w-full rounded border p-2" />
  <p>照合結果: {check.result === "NO_UNIT" ? "個体未選択" : check.result}</p>{check.warning ? <p className="text-amber-700">{check.warning}</p> : null}
  <form action={completeAction}><button disabled={!canSubmit} className="rounded bg-emerald-700 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-400">{check.result === "NO_UNIT" ? "個体未選択のため出庫完了不可" : "出庫完了"}</button></form>
  </div>;
}
