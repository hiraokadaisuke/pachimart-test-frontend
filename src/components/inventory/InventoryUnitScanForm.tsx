"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";
import type { getInventoryUnitScanOptions } from "@/features/inventory/server";

type ActionResult = {
  ok: boolean;
  message: string;
  warning?: string | null;
  nextAction?: string | null;
  linkedSchedule?: string | null;
  unitId?: string | null;
  clearedForNext?: boolean;
};

type ParseResult = {
  parsedDisplayCodeCandidate: string | null;
  warning?: string | null;
  parsedQr?: Record<string, unknown> | null;
};

type Props = {
  scanOptions: Awaited<ReturnType<typeof getInventoryUnitScanOptions>>;
  parseAction: (formData: FormData) => Promise<ParseResult>;
  createAction: (formData: FormData) => Promise<ActionResult>;
  outboundLinkAction: (formData: FormData) => Promise<ActionResult>;
};

export function InventoryUnitScanForm({ scanOptions, parseAction, createAction, outboundLinkAction }: Props) {
  const qrRegionId = useId();
  const scannerRef = useRef<InstanceType<typeof Html5Qrcode> | null>(null);
  const lastDecodedRef = useRef<{ text: string; at: number } | null>(null);
  const [rawQr, setRawQr] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [memo, setMemo] = useState("");
  const [codeType, setCodeType] = useState("UNKNOWN");
  const [inventoryItemId, setInventoryItemId] = useState(scanOptions.recentItems[0]?.id ?? "");
  const [inboundScheduleId, setInboundScheduleId] = useState("");
  const [outboundScheduleId, setOutboundScheduleId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [recentUnits, setRecentUnits] = useState<Array<{ unitId: string; displayCode: string; at: string }>>([]);
  const [statusMessage, setStatusMessage] = useState<string>("次の台を読み取ってください");
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);

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
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (decodedText: string) => {
        const now = Date.now();
        const last = lastDecodedRef.current;
        if (last && last.text === decodedText && now - last.at < 1500) return;
        lastDecodedRef.current = { text: decodedText, at: now };
        setRawQr(decodedText);
        setStatusMessage("読み取り成功。現物表記 displayCode を確認してください。");
        setScanHistory((prev) => [decodedText, ...prev].slice(0, 5));
      }, () => undefined);
      setCameraError(null);
    } catch {
      setCameraError("カメラ許可エラー。手入力をご利用ください。");
    }
  };

  const stopCamera = async () => {
    try { await scannerRef.current?.stop(); } catch {}
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.set("rawQr", rawQr);
    formData.set("displayCode", displayCode);
    formData.set("memo", memo);
    formData.set("codeType", codeType);
    formData.set("inventoryItemId", inventoryItemId);
    formData.set("inboundScheduleId", inboundScheduleId);
    formData.set("outboundScheduleId", outboundScheduleId);
    return formData;
  };

  const onCreate = async (provisional: boolean) => {
    const formData = buildFormData();
    if (provisional) formData.set("provisional", "1");
    const result = await createAction(formData);
    setFeedback(result);
    if (result.ok) {
      setRegisteredCount((x) => x + 1);
      setRecentUnits((prev) => [{ unitId: result.unitId ?? "", displayCode: displayCode || "(未確定)", at: new Date().toISOString() }, ...prev].slice(0, 8));
      setRawQr("");
      setDisplayCode("");
      setMemo("");
      setParsed(null);
      setStatusMessage("次の台を読み取ってください");
    }
  };

  const onParse = async () => {
    const result = await parseAction(buildFormData());
    setParsed(result);
    if (!displayCode && result.parsedDisplayCodeCandidate) setDisplayCode(result.parsedDisplayCodeCandidate);
  };

  const onLinkOutbound = async () => {
    const result = await outboundLinkAction(buildFormData());
    setFeedback(result);
    if (result.ok) {
      setStatusMessage("発送照合に成功。次の台を読み取ってください。");
      setRawQr("");
      setDisplayCode("");
      setMemo("");
    }
  };

  return <div className="space-y-4">
    <div id={qrRegionId} className="h-52 rounded border" />
    <div className="flex gap-2"><button type="button" className="rounded bg-black px-4 py-2 text-white" onClick={() => void startCamera()}>カメラ開始</button><button type="button" className="rounded border px-4 py-2" onClick={() => void stopCamera()}>停止</button></div>
    {cameraError ? <p className="text-sm text-red-600">{cameraError}</p> : null}
    <p className="rounded bg-blue-50 p-2 text-sm">{statusMessage}</p>

    <div className="space-y-2">
      <input value={rawQr} onChange={(e) => setRawQr(e.target.value)} placeholder="rawQr" className="w-full rounded border p-2" />
      <button type="button" onClick={() => void onParse()} className="rounded border px-3 py-1 text-sm">読み取り結果を解析</button>
      <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs">QRは正ではありません。現物表記を確認してください。</div>
      <input value={displayCode} onChange={(e) => setDisplayCode(e.target.value)} placeholder="displayCode確定（現物確認）" className="w-full rounded border-2 border-blue-500 p-2" />
      <select value={codeType} onChange={(e) => setCodeType(e.target.value)} className="w-full rounded border p-2"><option value="UNKNOWN">UNKNOWN</option><option value="BODY">BODY</option><option value="BOARD">BOARD</option></select>
      <select value={inventoryItemId} onChange={(e) => setInventoryItemId(e.target.value)} className="w-full rounded border p-2">{scanOptions.recentItems.map((i)=><option key={i.id} value={i.id}>{i.modelNameSnapshot} / {i.maker?.name ?? "メーカー未設定"} / units:{i.unitCount}</option>)}</select>
      <select value={inboundScheduleId} onChange={(e) => setInboundScheduleId(e.target.value)} className="w-full rounded border p-2"><option value="">入庫予定を選択</option>{scanOptions.inboundSchedules.map((s)=><option key={s.id} value={s.id}>{s.expectedDate?.toISOString().slice(0,10) ?? "-"} / {s.inventoryItem?.modelNameSnapshot ?? s.modelNameSnapshot} / {s.quantity}台 / 登録:{s.registeredUnitCount} / {s.status}</option>)}</select>
      <select value={outboundScheduleId} onChange={(e) => setOutboundScheduleId(e.target.value)} className="w-full rounded border p-2"><option value="">出庫予定を選択</option>{scanOptions.outboundSchedules.map((s)=><option key={s.id} value={s.id}>{s.expectedDate?.toISOString().slice(0,10) ?? "-"} / {s.inventoryItem?.modelNameSnapshot ?? s.modelNameSnapshot} / {s.quantity}台 / 選択:{s.selectedUnitCount} / {s.status}</option>)}</select>
      <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="memo" className="w-full rounded border p-2" />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void onCreate(false)} className="rounded bg-blue-600 px-4 py-3 text-white">登録</button>
        <button type="button" onClick={() => void onCreate(true)} className="rounded bg-amber-600 px-4 py-3 text-white">仮登録</button>
      </div>
      <button type="button" onClick={() => void onLinkOutbound()} className="w-full rounded bg-emerald-700 px-4 py-3 text-white">出庫予定に照合・紐づけ</button>
    </div>

    {parsed ? <div className="rounded border p-2 text-sm"><p>推定 displayCode 候補: {parsed.parsedDisplayCodeCandidate ?? "-"}</p><p>confidence/警告: {parsed.warning ?? "-"}</p><pre className="overflow-auto text-xs">{JSON.stringify(parsed.parsedQr ?? {}, null, 2)}</pre></div> : null}
    {feedback ? <div className={`rounded p-2 text-sm ${feedback.ok ? "bg-green-50" : "bg-red-50"}`}><p>{feedback.message}</p>{feedback.warning ? <p>警告: {feedback.warning}</p> : null}{feedback.unitId ? <a className="underline" href={`/inventory/units/${feedback.unitId}`}>作成個体を開く</a> : null}{feedback.linkedSchedule ? <p>{feedback.linkedSchedule}</p> : null}<p>次の推奨操作: {feedback.nextAction ?? "登録"}</p></div> : null}

    <div className="rounded border p-2 text-sm"><p>直近読み取り履歴</p>{scanHistory.map((h,idx)=><p key={idx}>{h}</p>)}</div>
    <div className="rounded border p-2 text-sm"><p>直近登録個体</p>{recentUnits.map((u, idx) => <p key={`${u.unitId}-${idx}`}>{u.displayCode} / {u.at}</p>)}</div>
    <div className="text-xs text-gray-600">入庫予定件数: {scanOptions.inboundSchedules.length} / 出庫予定件数: {scanOptions.outboundSchedules.length} / 登録済み件数: {registeredCount}</div>
  </div>;
}
