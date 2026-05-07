"use client";

import { useMemo, useState } from "react";
import type { SalesInvoiceUnitCandidate } from "@/lib/inventory/salesInvoiceUnitCandidates";

type Props = {
  open: boolean;
  title: string;
  candidates: SalesInvoiceUnitCandidate[];
  selectedUnitIds: Set<string>;
  onSelect: (candidate: SalesInvoiceUnitCandidate) => void;
  onClose: () => void;
};

export function SalesInvoiceUnitModal({ open, title, candidates, selectedUnitIds, onSelect, onClose }: Props) {
  const [makerFilter, setMakerFilter] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [onlyUnit, setOnlyUnit] = useState(true);
  const [onlySellable, setOnlySellable] = useState(true);
  const filtered = useMemo(() => candidates.filter((c) => {
    if (makerFilter && !c.makerName.includes(makerFilter)) return false;
    if (machineFilter && !c.machineName.includes(machineFilter)) return false;
    if (onlyUnit && !c.inventoryUnitId) return false;
    if (onlySellable && !c.isSelectable) return false;
    return true;
  }), [candidates, makerFilter, machineFilter, onlyUnit, onlySellable]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <div className="w-full max-w-7xl border border-gray-400 bg-white text-[12px]">
      <div className="flex items-center justify-between border-b border-gray-400 bg-gray-200 px-4 py-2 font-semibold"><span>番号選択 - {title}</span><button onClick={onClose} className="border border-gray-400 bg-white px-3 py-0.5">閉じる</button></div>
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <input value={makerFilter} onChange={(e)=>setMakerFilter(e.target.value)} placeholder="メーカー" className="border px-2 py-1" />
          <input value={machineFilter} onChange={(e)=>setMachineFilter(e.target.value)} placeholder="機種名" className="border px-2 py-1" />
          <label><input type="checkbox" checked={onlyUnit} onChange={(e)=>setOnlyUnit(e.target.checked)} /> Unitありのみ</label>
          <label><input type="checkbox" checked={onlySellable} onChange={(e)=>setOnlySellable(e.target.checked)} /> 販売可能のみ</label>
        </div>
        <div className="max-h-[460px] overflow-auto border border-gray-400"><table className="w-full border-collapse"><thead className="bg-gray-100"><tr>
          <th className="border px-1">選択</th><th className="border px-1">メーカー</th><th className="border px-1">機種名</th><th className="border px-1">種別</th><th className="border px-1">displayCode</th><th className="border px-1">番号詳細</th><th className="border px-1">検品状態</th><th className="border px-1">rawQr</th><th className="border px-1">保管先</th><th className="border px-1">状態</th><th className="border px-1">仕入単価</th><th className="border px-1">想定売価</th><th className="border px-1">備考</th><th className="border px-1">warning</th>
        </tr></thead><tbody>
          {filtered.map((c,idx)=>{ const disabled = !c.isSelectable || (c.inventoryUnitId ? selectedUnitIds.has(c.inventoryUnitId) : false); return <tr key={`${c.inventoryUnitId ?? 'none'}-${idx}`}><td className="border px-1"><button disabled={disabled} onClick={()=>onSelect(c)} className="border px-2 py-0.5 disabled:opacity-40">選択</button></td><td className="border px-1">{c.makerName}</td><td className="border px-1">{c.machineName}</td><td className="border px-1">{c.itemType ?? ""}</td><td className="border px-1">{c.displayCode ?? ""}</td><td className="border px-1 text-[10px]">本:{c.bodySerialNumber ?? "-"}<br/>枠:{c.frameSerialNumber ?? "-"}<br/>基:{c.mainBoardSerialNumber ?? "-"}</td><td className="border px-1 text-[10px]">動:{c.operationCheckStatus ?? "-"} / ガ:{c.glassStatus ?? "-"}<br/>釘:{c.nailSheetStatus ?? "-"} / 検:{c.inspectionStatus ?? "-"}</td><td className="border px-1">{c.rawQr ?? ""}</td><td className="border px-1">{c.storageLocationName ?? ""}</td><td className="border px-1">{c.status ?? ""}</td><td className="border px-1 text-right">{c.purchaseUnitPrice ?? ""}</td><td className="border px-1 text-right">{c.estimatedSalesUnitPrice ?? ""}</td><td className="border px-1">{c.memo ?? ""}</td><td className="border px-1 text-[10px] text-amber-700">{disabled && c.inventoryUnitId && selectedUnitIds.has(c.inventoryUnitId) ? "他行で選択済み" : c.warning ?? ""}</td></tr>})}
        </tbody></table></div>
      </div>
    </div>
  </div>;
}
