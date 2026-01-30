"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStockFromQrScan } from "@/lib/inventory/mock";
import { inventoryModelMasters } from "@/lib/inventory/mockMasters";
import { suggestModels } from "@/lib/inventory/qr/parse";

type Step = "intro" | "capture" | "confirm" | "model";

type Candidate = {
  id: string;
  value: string;
};

type ScanMode = "pachi" | "slot";

const inferModeFromDisplayCode = (value: string): ScanMode => {
  const trimmed = value.trim();
  if (!trimmed) return "slot";
  if (/[/-]/.test(trimmed)) return "slot";
  if (/^P\d/i.test(trimmed)) return "pachi";
  return "pachi";
};

const buildCandidates = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").toUpperCase();
  const candidates: string[] = [];
  const pattern = /([A-Z]{1,3}-[A-Z0-9]{1,3})\s*(?:NO\.?|NO|番号|#)?\s*[:：]?\s*([0-9]{3,7})/gi;
  let match = pattern.exec(normalized);
  while (match) {
    const prefix = match[1].replace(/\s+/g, "");
    const number = match[2];
    candidates.push(`${prefix} ${number}`);
    match = pattern.exec(normalized);
  }
  if (candidates.length === 0) {
    const fallback = normalized.match(/[0-9]{4,7}/g) ?? [];
    fallback.forEach((token) => candidates.push(token));
  }
  return [...new Set(candidates)].filter(Boolean);
};

export default function InventoryImportTextPage() {
  const [step, setStep] = useState<Step>("intro");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [displayCode, setDisplayCode] = useState("");
  const [manualText, setManualText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mode = inferModeFromDisplayCode(displayCode);

  const suggestionSource = displayCode.trim();
  const suggestions = useMemo(
    () => suggestModels(suggestionSource, inventoryModelMasters),
    [suggestionSource],
  );

  const visibleSuggestions = expandedSuggestions ? suggestions.slice(0, 5) : suggestions.slice(0, 1);

  useEffect(() => {
    if (suggestions.length > 0) {
      setSelectedSuggestionId(suggestions[0]?.id ?? null);
    } else {
      setSelectedSuggestionId("unknown");
    }
  }, [suggestions]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!window.isSecureContext) {
      setCameraError("httpsで開かないとカメラは使えません。文字列貼り付けをご利用ください。");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("このブラウザではカメラが利用できません。文字列貼り付けをご利用ください。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error(error);
      setCameraError("カメラを起動できませんでした。文字列貼り付けをご利用ください。");
    }
  };

  useEffect(() => {
    if (step === "capture" && cameraEnabled) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, cameraEnabled]);

  const applyCandidates = (sourceText: string, nextCandidates: string[]) => {
    const formatted = nextCandidates.map((value) => ({ id: crypto.randomUUID(), value }));
    setCandidates(formatted);
    setSelectedCandidateId(formatted[0]?.id ?? null);
    setDisplayCode(formatted[0]?.value ?? "");
    setOcrRawText(sourceText);
  };

  const handlePasteCandidates = () => {
    const nextCandidates = buildCandidates(manualText);
    if (nextCandidates.length === 0) {
      setOcrMessage("候補が見つかりませんでした。直接入力してください。");
      setDisplayCode("");
    } else {
      setOcrMessage(null);
    }
    applyCandidates(manualText, nextCandidates);
    setStep("confirm");
  };

  const runOcr = async () => {
    if (!videoRef.current) {
      throw new Error("VideoNotReady");
    }
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    const width = videoRef.current.videoWidth || 720;
    const height = videoRef.current.videoHeight || 1280;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CanvasContextError");
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    const tesseract = await import(
      /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.esm.min.js"
    );
    const worker = await tesseract.createWorker();
    await worker.loadLanguage("jpn");
    await worker.initialize("jpn");
    const { data } = await worker.recognize(canvas);
    await worker.terminate();
    return data.text ?? "";
  };

  const handleCapture = async () => {
    setOcrLoading(true);
    setOcrMessage(null);
    try {
      const text = await runOcr();
      const nextCandidates = buildCandidates(text);
      if (nextCandidates.length === 0) {
        setOcrMessage("番号を検出できませんでした。直接入力してください。");
      }
      applyCandidates(text, nextCandidates);
      setStep("confirm");
    } catch (error) {
      console.error(error);
      setOcrMessage("読み取りに失敗しました。再度撮影するか文字列貼り付けをご利用ください。");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    const selected = candidates.find((item) => item.id === candidateId);
    if (selected) {
      setDisplayCode(selected.value);
    }
  };

  const handleReset = () => {
    setStep("intro");
    setCameraEnabled(false);
    setCandidates([]);
    setSelectedCandidateId(null);
    setSelectedSuggestionId(null);
    setDisplayCode("");
    setManualText("");
    setOcrRawText("");
    setOcrMessage(null);
    setExpandedSuggestions(false);
  };

  const canAdvanceToModel = displayCode.trim().length > 0;
  const canRegister =
    canAdvanceToModel && (Boolean(selectedSuggestionId) || suggestions.length === 0);

  const handleRegister = () => {
    if (!canRegister) return;
    const selectedSuggestion = suggestions.find((item) => item.id === selectedSuggestionId);

    addStockFromQrScan({
      maker: selectedSuggestion?.maker ?? "未確定",
      model: selectedSuggestion?.model ?? "機種未確定",
      mode,
      displayCodes: [displayCode.trim()],
      rawCodes: [ocrRawText.trim() || "OCR"],
    });

    setToastMessage("仮登録しました");
    handleReset();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 pb-10 pt-6">
        {step === "intro" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold">テキスト在庫登録</h1>
              <p className="text-sm text-slate-300">
                読み取り開始を押してカメラを起動します
              </p>
            </div>
            <Button
              className="h-14 w-full max-w-sm rounded-2xl text-base"
              onClick={() => {
                setCameraEnabled(true);
                setStep("capture");
              }}
            >
              読み取り開始
            </Button>
            <button
              type="button"
              className="text-xs text-emerald-300"
              onClick={() => {
                setCameraEnabled(false);
                setStep("capture");
              }}
            >
              カメラが使えない方（文字列貼り付け）
            </button>
          </div>
        ) : null}

        {step === "capture" ? (
          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                紙OCR
              </p>
              <h1 className="text-xl font-semibold">番号を撮影してください</h1>
              <p className="text-xs text-slate-400">
                文字が鮮明に写る位置で撮影します。
              </p>
            </div>

            <div className="flex-1 space-y-4">
              {cameraEnabled ? (
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                  <video
                    ref={videoRef}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300">
                  カメラが使えない場合は読み取りたい文字列を貼り付けてください。
                </div>
              )}
              {cameraError ? (
                <p className="text-xs text-rose-300">{cameraError}</p>
              ) : null}
              {ocrMessage ? <p className="text-xs text-amber-300">{ocrMessage}</p> : null}

              {cameraEnabled ? (
                <Button
                  onClick={handleCapture}
                  className="h-12 w-full rounded-2xl text-base"
                  disabled={ocrLoading}
                >
                  {ocrLoading ? "解析中..." : "撮影して読み取る"}
                </Button>
              ) : (
                <div className="space-y-3 rounded-2xl bg-slate-900 p-4">
                  <Input
                    value={manualText}
                    onChange={(event) => setManualText(event.target.value)}
                    className="h-11 rounded-xl border-slate-700 bg-slate-900 text-white"
                    placeholder="読み取りたい文字列を貼り付け"
                  />
                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl"
                    onClick={handlePasteCandidates}
                    disabled={!manualText.trim()}
                  >
                    候補を作成
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {step === "confirm" ? (
          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                表記番号の確認
              </p>
              <h1 className="text-xl font-semibold">display_codeを確定してください</h1>
              <p className="text-xs text-slate-400">
                OCR結果を元に候補を表示します。必要なら修正してください。
              </p>
            </div>
            <div className="space-y-4">
              {candidates.length > 0 ? (
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <label
                      key={candidate.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                        candidate.id === selectedCandidateId
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-slate-800 bg-slate-900"
                      }`}
                    >
                      <input
                        type="radio"
                        name="display-candidate"
                        className="h-4 w-4"
                        checked={candidate.id === selectedCandidateId}
                        onChange={() => handleCandidateSelect(candidate.id)}
                      />
                      <span className="font-semibold text-slate-100">{candidate.value}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  候補がない場合は直接入力してください。
                </p>
              )}

              <div className="rounded-2xl bg-slate-900 p-4">
                <label className="text-xs text-slate-400">display_code</label>
                <Input
                  value={displayCode}
                  onChange={(event) => setDisplayCode(event.target.value)}
                  className="mt-2 h-11 rounded-xl border-slate-700 bg-slate-950 text-white"
                  placeholder="実物表記を入力"
                />
              </div>
            </div>
            <div className="mt-auto space-y-3">
              <Button
                onClick={() => setStep("model")}
                className="h-12 w-full rounded-2xl text-base"
                disabled={!canAdvanceToModel}
              >
                機種候補へ進む
              </Button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full text-xs text-slate-400"
              >
                もう一度読み取り直す
              </button>
            </div>
          </div>
        ) : null}

        {step === "model" ? (
          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                機種候補
              </p>
              <h1 className="text-xl font-semibold">推定機種を確認してください</h1>
              <p className="text-xs text-slate-400">未確定のまま仮登録することもできます。</p>
            </div>
            <div className="space-y-3">
              {visibleSuggestions.length > 0 ? (
                visibleSuggestions.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                      item.id === selectedSuggestionId
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="text-suggestion"
                      className="mt-1 h-4 w-4"
                      checked={item.id === selectedSuggestionId}
                      onChange={() => setSelectedSuggestionId(item.id)}
                    />
                    <div>
                      <p className="font-semibold text-slate-100">
                        {item.maker} / {item.model}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        マッチ理由: {item.reasons.join(" / ")}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                  <input
                    type="radio"
                    name="text-suggestion"
                    className="h-4 w-4"
                    checked={selectedSuggestionId === "unknown"}
                    onChange={() => setSelectedSuggestionId("unknown")}
                  />
                  <div>
                    <p className="font-semibold text-slate-100">機種未確定で仮登録</p>
                    <p className="mt-1 text-xs text-slate-400">後から編集できます。</p>
                  </div>
                </label>
              )}
              {suggestions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setExpandedSuggestions((prev) => !prev)}
                  className="text-left text-xs text-emerald-300"
                >
                  {expandedSuggestions ? "候補を閉じる" : "他の候補を見る"}
                </button>
              ) : null}
            </div>
            <div className="mt-auto space-y-3">
              <Button
                onClick={handleRegister}
                className="h-12 w-full rounded-2xl text-base"
                disabled={!canRegister}
              >
                仮登録する
              </Button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="w-full text-xs text-slate-400"
              >
                表記番号の修正に戻る
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {toastMessage ? (
        <div className="fixed bottom-16 left-1/2 z-40 w-[90%] -translate-x-1/2 rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
