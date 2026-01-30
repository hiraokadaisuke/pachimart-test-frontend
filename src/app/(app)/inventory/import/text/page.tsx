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

type OcrCandidate = {
  value: string;
  confidence?: number | null;
};

type ScanMode = "pachi" | "slot";

const inferModeFromDisplayCode = (value: string): ScanMode => {
  const trimmed = value.trim();
  if (!trimmed) return "slot";
  if (/[/-]/.test(trimmed)) return "slot";
  if (/^P\d/i.test(trimmed)) return "pachi";
  return "pachi";
};

const normalizeOcrText = (text: string) => text.replace(/\s+/g, " ").toUpperCase();

const buildCandidates = (
  text: string,
  words: Array<{ text: string; confidence?: number }> = [],
) => {
  const normalized = normalizeOcrText(text);
  const candidates: OcrCandidate[] = [];
  const pattern = /([A-Z]{1,3}-[A-Z0-9]{1,3})\s*(?:NO\.?|NO|番号|#)?\s*[:：]?\s*([0-9]{3,7})/gi;
  let match = pattern.exec(normalized);
  while (match) {
    const prefix = match[1].replace(/\s+/g, "");
    const number = match[2];
    const value = `${prefix} ${number}`;
    candidates.push({ value, confidence: null });
    match = pattern.exec(normalized);
  }
  if (candidates.length === 0) {
    const fallback = normalized.match(/[0-9]{4,7}/g) ?? [];
    fallback.forEach((token) => candidates.push({ value: token, confidence: null }));
  }
  const unique = Array.from(new Set(candidates.map((item) => item.value))).map((value) => ({
    value,
    confidence: null as number | null,
  }));
  if (words.length > 0) {
    const normalizedWords = words.map((word) => ({
      text: normalizeOcrText(word.text).replace(/[^A-Z0-9-]/g, ""),
      confidence: word.confidence ?? null,
    }));
    unique.forEach((candidate) => {
      const candidateKey = normalizeOcrText(candidate.value).replace(/[^A-Z0-9-]/g, "");
      const matched = normalizedWords.filter(
        (word) => word.text && candidateKey.includes(word.text),
      );
      const confidences = matched
        .map((word) => word.confidence)
        .filter((value): value is number => value !== null && value !== undefined);
      if (confidences.length > 0) {
        candidate.confidence = Math.round(
          confidences.reduce((sum, value) => sum + value, 0) / confidences.length,
        );
      }
    });
  }
  return { normalized, candidates: unique };
};

const preprocessForOcr = (source: HTMLCanvasElement) => {
  const output = document.createElement("canvas");
  const width = source.width;
  const height = source.height;
  const cropX = Math.round(width * 0.1);
  const cropY = Math.round(height * 0.2);
  const cropWidth = Math.round(width * 0.8);
  const cropHeight = Math.round(height * 0.6);
  output.width = cropWidth;
  output.height = cropHeight;
  const ctx = output.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight);
  const data = imageData.data;
  const contrast = 1.25;
  const threshold = 160;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const adjusted = (gray - 128) * contrast + 128;
    const binary = adjusted > threshold ? 255 : 0;
    data[i] = binary;
    data[i + 1] = binary;
    data[i + 2] = binary;
  }
  ctx.putImageData(imageData, 0, 0);
  return output;
};

export default function InventoryImportTextPage() {
  const [step, setStep] = useState<Step>("intro");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState("");
  const [ocrNormalizedText, setOcrNormalizedText] = useState("");
  const [ocrCandidatesDebug, setOcrCandidatesDebug] = useState<OcrCandidate[]>([]);
  const [showOcrDebug, setShowOcrDebug] = useState(false);
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
  const displayInputRef = useRef<HTMLInputElement | null>(null);

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

  const resolveCameraErrorMessage = (error: unknown) => {
    const name = error instanceof Error ? error.name : undefined;
    switch (name) {
      case "NotAllowedError":
      case "SecurityError":
        return "カメラの権限が拒否されています。手入力をご利用ください。";
      case "NotFoundError":
        return "この端末にカメラが見つかりません。手入力をご利用ください。";
      case "NotReadableError":
        return "他のアプリがカメラを使用中です。手入力をご利用ください。";
      default:
        return "カメラを起動できませんでした。手入力をご利用ください。";
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
      setCameraError(resolveCameraErrorMessage(error));
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

  const applyCandidates = (
    sourceText: string,
    normalizedText: string,
    nextCandidates: OcrCandidate[],
  ) => {
    const formatted = nextCandidates.map((candidate) => ({
      id: crypto.randomUUID(),
      value: candidate.value,
    }));
    setCandidates(formatted);
    setSelectedCandidateId(formatted[0]?.id ?? null);
    setDisplayCode(formatted[0]?.value ?? "");
    setOcrRawText(sourceText);
    setOcrNormalizedText(normalizedText);
    setOcrCandidatesDebug(nextCandidates);
  };

  const handlePasteCandidates = () => {
    const { normalized, candidates: nextCandidates } = buildCandidates(manualText);
    if (nextCandidates.length === 0) {
      setOcrMessage("候補が見つかりませんでした。直接入力してください。");
      setDisplayCode("");
    } else {
      setOcrMessage(null);
    }
    applyCandidates(manualText, normalized, nextCandidates);
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
    const preprocessedCanvas = preprocessForOcr(canvas);

    const tesseract = await import(
      /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.esm.min.js"
    );
    const worker = await tesseract.createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./ NO",
      preserve_interword_spaces: "1",
    });
    const { data } = await worker.recognize(preprocessedCanvas);
    await worker.terminate();
    return data;
  };

  const handleCapture = async () => {
    setOcrLoading(true);
    setOcrMessage(null);
    try {
      const data = await runOcr();
      const text = data.text ?? "";
      const { normalized, candidates: nextCandidates } = buildCandidates(
        text,
        data.words ?? [],
      );
      if (nextCandidates.length === 0) {
        setOcrMessage("番号を検出できませんでした。直接入力してください。");
      }
      applyCandidates(text, normalized, nextCandidates);
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
    setOcrNormalizedText("");
    setOcrCandidatesDebug([]);
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
                    playsInline
                    muted
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300">
                  カメラが使えない場合は読み取りたい文字列を貼り付けてください。
                </div>
              )}
              {cameraError ? (
                <div className="space-y-2 text-xs text-rose-300">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    className="text-xs text-emerald-300"
                    onClick={() => setCameraEnabled(false)}
                  >
                    手入力に切り替える
                  </button>
                </div>
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
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={showOcrDebug}
                  onChange={(event) => setShowOcrDebug(event.target.checked)}
                />
                詳細表示
              </label>
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
                <div className="space-y-2 text-xs text-slate-400">
                  <p>候補がない場合は直接入力してください。</p>
                  <button
                    type="button"
                    className="text-xs text-emerald-300"
                    onClick={() => displayInputRef.current?.focus()}
                  >
                    手入力して続行
                  </button>
                </div>
              )}

              <div className="rounded-2xl bg-slate-900 p-4">
                <label className="text-xs text-slate-400">display_code</label>
                <Input
                  ref={displayInputRef}
                  value={displayCode}
                  onChange={(event) => setDisplayCode(event.target.value)}
                  className="mt-2 h-11 rounded-xl border-slate-700 bg-slate-950 text-white"
                  placeholder="実物表記を入力"
                />
              </div>

              {showOcrDebug ? (
                <div className="space-y-3 rounded-2xl bg-slate-900 p-4 text-[11px] text-slate-300">
                  <div>
                    <p className="font-semibold text-slate-200">OCR生結果</p>
                    <p className="whitespace-pre-wrap break-words text-slate-400">
                      {ocrRawText || "（空）"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">正規化後</p>
                    <p className="whitespace-pre-wrap break-words text-slate-400">
                      {ocrNormalizedText || "（空）"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">抽出候補</p>
                    {ocrCandidatesDebug.length > 0 ? (
                      <ul className="space-y-1 text-slate-400">
                        {ocrCandidatesDebug.map((candidate) => (
                          <li key={`${candidate.value}-${candidate.confidence ?? "na"}`}>
                            {candidate.value}
                            {candidate.confidence != null ? ` (conf: ${candidate.confidence})` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400">（候補なし）</p>
                    )}
                  </div>
                </div>
              ) : null}
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
