"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";
import type { InboundSchedule, InventoryItem, OutboundSchedule } from "@prisma/client";

type Props = {
  inventoryItems: Pick<InventoryItem, "id" | "modelNameSnapshot" | "itemType">[];
  inboundSchedules: Pick<InboundSchedule, "id" | "quantity" | "status" | "inventoryItemId">[];
  outboundSchedules: Pick<OutboundSchedule, "id" | "quantity" | "status" | "inventoryItemId">[];
  parseAction: (formData: FormData) => Promise<{ parsedDisplayCodeCandidate: string | null; warning?: string | null }>;
  createAction: (formData: FormData) => Promise<void>;
  outboundLinkAction: (formData: FormData) => Promise<void>;
};

export function InventoryUnitScanForm({ inventoryItems, inboundSchedules, outboundSchedules, parseAction, createAction, outboundLinkAction }: Props) {
  const qrRegionId = useId();
  const scannerRef = useRef<InstanceType<typeof Html5Qrcode> | null>(null);
  const lastDecodedRef = useRef<{ text: string; at: number } | null>(null);
  const [rawQr, setRawQr] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => undefined);
      try { scannerRef.current?.clear(); } catch {}
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("このブラウザはカメラ非対応です。手入力を利用してください。");
        return;
      }
      const scanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          const now = Date.now();
          const last = lastDecodedRef.current;
          if (last && last.text === decodedText && now - last.at < 1500) return;
          lastDecodedRef.current = { text: decodedText, at: now };
          setRawQr(decodedText);
          setScanHistory((prev) => [decodedText, ...prev].slice(0, 5));
        },
        () => undefined,
      );
      setCameraError(null);
    } catch (error) {
      setCameraError("カメラ許可エラー。手入力をご利用ください。");
    }
  };

  const stopCamera = async () => {
    try { await scannerRef.current?.stop(); } catch {}
  };

  return <div className="space-y-4">
    <div id={qrRegionId} className="h-52 rounded border" />
    <div className="flex gap-2"><button type="button" className="rounded bg-black px-4 py-2 text-white" onClick={() => void startCamera()}>カメラ開始</button><button type="button" className="rounded border px-4 py-2" onClick={() => void stopCamera()}>停止</button></div>
    {cameraError ? <p className="text-sm text-red-600">{cameraError}</p> : null}

    <form action={parseAction} className="space-y-2">
      <input name="rawQr" value={rawQr} onChange={(e) => setRawQr(e.target.value)} placeholder="rawQr" className="w-full rounded border p-2" />
      <input name="displayCode" value={displayCode} onChange={(e) => setDisplayCode(e.target.value)} placeholder="displayCode確定" className="w-full rounded border p-2" />
      <select name="codeType" className="w-full rounded border p-2"><option value="UNKNOWN">UNKNOWN</option><option value="BODY">BODY</option><option value="BOARD">BOARD</option></select>
      <select name="inventoryItemId" className="w-full rounded border p-2">{inventoryItems.map((i)=><option key={i.id} value={i.id}>{i.modelNameSnapshot} ({i.id})</option>)}</select>
      <input name="inboundScheduleId" placeholder="InboundScheduleId" className="w-full rounded border p-2" />
      <input name="outboundScheduleId" placeholder="OutboundScheduleId" className="w-full rounded border p-2" />
      <textarea name="memo" placeholder="memo" className="w-full rounded border p-2" />
      <div className="grid grid-cols-2 gap-2">
        <button formAction={createAction} className="rounded bg-blue-600 px-4 py-3 text-white">登録</button>
        <button formAction={createAction} name="provisional" value="1" className="rounded bg-amber-600 px-4 py-3 text-white">仮登録</button>
      </div>
      <button formAction={outboundLinkAction} className="w-full rounded bg-emerald-700 px-4 py-3 text-white">発送予定に照合・紐づけ</button>
    </form>

    <div className="rounded border p-2 text-sm"><p>履歴</p>{scanHistory.map((h,idx)=><p key={idx}>{h}</p>)}</div>
    <div className="text-xs text-gray-600">入庫予定件数: {inboundSchedules.length} / 発送予定件数: {outboundSchedules.length}</div>
  </div>;
}
