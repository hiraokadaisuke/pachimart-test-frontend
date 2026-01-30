"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStockFromQrScan } from "@/lib/inventory/mock";
import { inventoryModelMasters } from "@/lib/inventory/mockMasters";
import { parseQrRaw, suggestModels } from "@/lib/inventory/qr/parse";

type Html5QrcodeInstance = InstanceType<typeof Html5Qrcode>;
type ScannerState = "idle" | "starting" | "scanning" | "stopping";
type Html5QrcodeCamera = { id: string; label?: string };

type ScanMode = "pachi" | "slot";

type ParsedGuess = {
  maker_guess?: string;
  model_guess?: string;
  year_guess?: number;
  serial_guess?: string;
};

type ScanItem = {
  id: string;
  raw_qr: string;
  display_code: string;
  parsed: ParsedGuess;
  parsedRaw: ReturnType<typeof parseQrRaw>;
};

type Step = "intro" | "scan" | "confirm" | "model";

type ModeConfig = { requiredCount: number; label: string };

const MODE_CONFIG: Record<ScanMode, ModeConfig> = {
  pachi: { requiredCount: 3, label: "パチンコ" },
  slot: { requiredCount: 2, label: "スロット" },
};

const DEDUPE_MS = 1500;

const inferModeFromRaw = (raw: string) => {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;
  if (/[/-]/.test(trimmed)) return "slot";
  if (/^P\d/.test(trimmed)) return "pachi";
  if (/^[A-Z0-9]{10,}$/.test(trimmed)) return "pachi";
  return null;
};

const buildParsedGuess = (parsed: ReturnType<typeof parseQrRaw>): ParsedGuess => {
  const yearToken = parsed.extracted.numericStrings.find((token) => /^20\d{2}$/.test(token));
  return {
    maker_guess: parsed.extracted.makerTokens[0],
    model_guess: parsed.extracted.modelNumbers[0],
    year_guess: yearToken ? Number(yearToken) : undefined,
    serial_guess: parsed.extracted.numericStrings[0],
  };
};

const buildPachiDisplayCode = (parsed: ReturnType<typeof parseQrRaw>) => {
  return parsed.extracted.modelNumbers[0] ?? parsed.extracted.numericStrings[0] ?? "";
};

export default function InventoryImportQrPage() {
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanErrorDetail, setScanErrorDetail] = useState<string | null>(null);
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [manualRaw, setManualRaw] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState(false);
  const [expandedRawIds, setExpandedRawIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("intro");
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const qrRegionId = useId();
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerStateRef = useRef<ScannerState>("idle");
  const actionLockRef = useRef<Promise<void>>(Promise.resolve());
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const unmountedRef = useRef(false);
  const isHandlingSuccessRef = useRef(false);
  const lastDecodedRef = useRef<{ text: string; time: number } | null>(null);

  const inferredMode = useMemo<ScanMode>(() => {
    const modeCounts = scanItems.reduce(
      (acc, item) => {
        const inferred = inferModeFromRaw(item.raw_qr);
        if (inferred) acc[inferred] += 1;
        return acc;
      },
      { pachi: 0, slot: 0 } as Record<ScanMode, number>,
    );
    if (modeCounts.pachi > modeCounts.slot) return "pachi";
    if (modeCounts.slot > modeCounts.pachi) return "slot";
    if (scanItems.length >= 2) return "slot";
    return "slot";
  }, [scanItems]);

  const activeConfig = MODE_CONFIG[inferredMode];

  const suggestionSource = useMemo(() => {
    return scanItems
      .map((item) => item.display_code.trim() || item.raw_qr.trim())
      .filter(Boolean)
      .join(" ");
  }, [scanItems]);

  const suggestions = useMemo(
    () => suggestModels(suggestionSource, inventoryModelMasters),
    [suggestionSource],
  );

  const visibleSuggestions = expandedSuggestions ? suggestions.slice(0, 5) : suggestions.slice(0, 1);

  const displayCodes = scanItems.map((item) => item.display_code.trim()).filter(Boolean);
  const uniqueDisplayCodes = new Set(displayCodes);
  const hasDuplicateDisplayCode = uniqueDisplayCodes.size !== displayCodes.length;
  const allDisplayFilled =
    scanItems.length === activeConfig.requiredCount && displayCodes.length === scanItems.length;

  const canAdvanceToModel = allDisplayFilled && !hasDuplicateDisplayCode;
  const canRegister =
    canAdvanceToModel && (Boolean(selectedSuggestionId) || suggestions.length === 0);

  useEffect(() => {
    document.body.dataset.qrImport = "true";
    return () => {
      delete document.body.dataset.qrImport;
    };
  }, []);

  useEffect(() => {
    if (suggestions.length > 0) {
      setSelectedSuggestionId(suggestions[0]?.id ?? null);
    } else {
      setSelectedSuggestionId("unknown");
    }
  }, [suggestions]);

  useEffect(() => {
    if (inferredMode !== "slot") return;
    setScanItems((prev) =>
      prev.map((item) =>
        item.display_code.trim()
          ? item
          : {
              ...item,
              display_code: item.raw_qr,
            },
      ),
    );
  }, [inferredMode]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const setScannerStateSafe = (nextState: ScannerState) => {
    scannerStateRef.current = nextState;
    if (!unmountedRef.current) {
      setScannerState(nextState);
    }
  };

  const withActionLock = async (action: () => Promise<void>) => {
    const previous = actionLockRef.current;
    let releaseLock: () => void = () => undefined;
    const next = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    actionLockRef.current = previous.then(() => next);
    await previous;
    try {
      await action();
    } finally {
      releaseLock();
    }
  };

  const resolveCameraErrorMessage = (error: unknown) => {
    const name = error instanceof Error ? error.name : undefined;
    const detailMessage = error instanceof Error ? error.message : null;
    const detail = name && detailMessage ? `${name}: ${detailMessage}` : name ?? detailMessage;
    switch (name) {
      case "NotAllowedError":
      case "SecurityError":
        return {
          message: "カメラの権限が拒否されています。設定で許可してからページを再読み込みしてください。",
          detail,
        };
      case "NotFoundError":
        return { message: "この端末にカメラが見つかりません。", detail };
      case "NotReadableError":
        return {
          message: "他のアプリがカメラを使用中です。アプリを閉じてから再度お試しください。",
          detail,
        };
      case "OverconstrainedError":
        return {
          message: "環境カメラを使用できませんでした。フロントカメラで再試行してください。",
          detail,
        };
      case "LibraryLoadError":
        return {
          message: "ライブラリ読み込み失敗のためQR文字列貼り付けをご利用ください。",
          detail,
        };
      default:
        return {
          message: "カメラの起動に失敗しました。QR文字列貼り付けをお試しください。",
          detail,
        };
    }
  };

  const createNamedError = (name: string, message: string) => {
    const error = new Error(message);
    error.name = name;
    return error;
  };

  const selectCameraId = (cameras: Html5QrcodeCamera[]) => {
    const preferredPattern = /(back|rear|environment|背面)/i;
    const preferred = cameras.find((camera) => preferredPattern.test(camera.label ?? ""));
    const fallback = cameras.at(-1) ?? cameras[0];
    return (preferred ?? fallback)?.id ?? null;
  };

  const attachInlineVideoAttributes = () => {
    const qrRegion = document.getElementById(qrRegionId);
    const video = qrRegion?.querySelector("video");
    if (video) {
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("muted", "true");
    }
  };

  const startScanner = async (
    cameraConfig: string | MediaTrackConstraints,
    onSuccess: (decodedText: string) => void,
    onFailure: (error: Error | string) => void,
  ) => {
    if (!scannerRef.current) {
      if (!Html5Qrcode) {
        throw new Error("LibraryLoadError");
      }
      scannerRef.current = new Html5Qrcode(qrRegionId);
    }
    const qrbox = ((width: number, height: number) => {
      const size = Math.min(width, height, 260);
      return { width: size, height: size };
    }) as any;
    await scannerRef.current.start(
      cameraConfig,
      {
        fps: 12,
        qrbox,
        aspectRatio: 1.0,
        disableFlip: false,
      },
      onSuccess,
      onFailure,
    );
    attachInlineVideoAttributes();
  };

  const safeStop = async (resetStatus = true) => {
    if (!scannerRef.current) {
      if (resetStatus && !unmountedRef.current) {
        setScannerState("idle");
      }
      setScannerStateSafe("idle");
      return;
    }
    setScannerStateSafe("stopping");
    try {
      await scannerRef.current.stop();
    } catch (error) {
      console.debug(error);
    }
    try {
      await scannerRef.current.clear();
    } catch (error) {
      console.debug(error);
    }
    scannerRef.current = null;
    if (resetStatus && !unmountedRef.current) {
      setScannerState("idle");
    }
    setScannerStateSafe("idle");
  };

  const safeStart = async () => {
    if (scannerStateRef.current !== "idle") return;

    setScanError(null);
    setScanErrorDetail(null);

    if (!window.isSecureContext) {
      setScanError("httpsで開かないとカメラは使えません。QR文字列貼り付けをご利用ください。");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("このブラウザではカメラが利用できません。QR文字列貼り付けをご利用ください。");
      return;
    }

    const qrRegion = document.getElementById(qrRegionId);
    const rect = qrRegion?.getBoundingClientRect();
    if (!qrRegion || !rect || rect.height <= 0 || rect.width <= 0) {
      setScanError("カメラ表示領域を取得できませんでした。ページを再読み込みしてください。");
      return;
    }

    await safeStop();
    setScannerStateSafe("starting");
    isHandlingSuccessRef.current = false;

    const startPromise = (async () => {
      const onSuccess = async (decodedText: string) => {
        if (isHandlingSuccessRef.current || unmountedRef.current) return;
        const now = Date.now();
        const last = lastDecodedRef.current;
        if (last && last.text === decodedText && now - last.time < DEDUPE_MS) return;
        lastDecodedRef.current = { text: decodedText, time: now };
        isHandlingSuccessRef.current = true;
        addScanItem(decodedText);
        isHandlingSuccessRef.current = false;
      };

      const onFailure = (error: Error | string) => {
        if (scannerStateRef.current !== "scanning") return;
        if (typeof error === "string" && error.includes("QR code parse error")) return;
        if (error instanceof Error && error.name === "QR_CODE_PARSE_ERROR") return;
        console.debug(error);
      };

      const attemptStart = async (cameraConfig: string | MediaTrackConstraints) => {
        await startScanner(cameraConfig, onSuccess, onFailure);
      };

      let lastError: unknown;
      try {
        const cameras = (await Html5Qrcode.getCameras()) as Html5QrcodeCamera[];
        const cameraId = selectCameraId(cameras ?? []);
        if (cameraId) {
          await attemptStart(cameraId);
          return;
        }
      } catch (error) {
        lastError = error;
      }

      const fallbackConfigs: MediaTrackConstraints[] = [
        { facingMode: "environment" },
        { facingMode: "user" },
      ];
      for (const config of fallbackConfigs) {
        try {
          await attemptStart(config);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError ?? createNamedError("NotFoundError", "No cameras available");
    })();

    startPromiseRef.current = startPromise;
    try {
      await startPromise;
      if (!unmountedRef.current) {
        setScannerState("scanning");
      }
      setScannerStateSafe("scanning");
    } catch (error) {
      console.error(error);
      setScannerStateSafe("idle");
      const { message, detail } = resolveCameraErrorMessage(error);
      if (!unmountedRef.current) {
        setScanError(message);
        setScanErrorDetail(detail);
        setScannerState("idle");
      }
      await safeStop();
    } finally {
      startPromiseRef.current = null;
    }
  };

  useEffect(() => {
    if (step === "scan" && cameraEnabled) {
      void withActionLock(safeStart);
    }
    if (step !== "scan" || !cameraEnabled) {
      void withActionLock(() => safeStop());
    }
  }, [step, cameraEnabled]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      void withActionLock(async () => {
        if (startPromiseRef.current) {
          try {
            await startPromiseRef.current;
          } catch (error) {
            console.debug(error);
          }
        }
        await safeStop(false);
      });
    };
  }, []);

  useEffect(() => {
    if (step === "scan" && scanItems.length >= activeConfig.requiredCount) {
      setScanNotice(null);
      setStep("confirm");
    }
  }, [scanItems.length, activeConfig.requiredCount, step]);

  const addScanItem = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setScanNotice(null);
    setScanItems((prev) => {
      if (prev.length >= activeConfig.requiredCount) {
        setScanNotice("必要回数が揃っています。やり直す場合は削除してください。");
        return prev;
      }
      const parsedRaw = parseQrRaw(trimmed);
      const parsed = buildParsedGuess(parsedRaw);
      const displayCode = inferredMode === "slot" ? trimmed : buildPachiDisplayCode(parsedRaw);
      const nextItem: ScanItem = {
        id: crypto.randomUUID(),
        raw_qr: trimmed,
        display_code: displayCode,
        parsed,
        parsedRaw,
      };
      return [...prev, nextItem];
    });
  };

  const handleManualAdd = () => {
    addScanItem(manualRaw);
    setManualRaw("");
  };

  const handleDisplayCodeChange = (id: string, value: string) => {
    setScanItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, display_code: value } : item)),
    );
  };

  const handleDeleteItem = (id: string) => {
    setScanItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetScan = async () => {
    setScanItems([]);
    setScanNotice(null);
    setExpandedRawIds(new Set());
    setCameraEnabled(false);
    setStep("intro");
    await withActionLock(safeStop);
  };

  const handleRegister = async () => {
    if (!canRegister) return;
    const selectedSuggestion = suggestions.find((item) => item.id === selectedSuggestionId);
    const displayList = scanItems.map((item) => item.display_code.trim());

    addStockFromQrScan({
      maker: selectedSuggestion?.maker ?? "未確定",
      model: selectedSuggestion?.model ?? "機種未確定",
      mode: inferredMode,
      displayCodes: displayList,
      rawCodes: scanItems.map((item) => item.raw_qr),
    });

    setToastMessage("仮登録しました");
    setScanItems([]);
    setSelectedSuggestionId(null);
    setExpandedSuggestions(false);
    setCameraEnabled(false);
    setStep("intro");
    await withActionLock(safeStop);
  };

  const remaining = Math.max(activeConfig.requiredCount - scanItems.length, 0);

  const toggleRawDetail = (id: string) => {
    setExpandedRawIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 pb-10 pt-6">
        {step === "intro" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold">QR在庫登録</h1>
              <p className="text-sm text-slate-300">
                読み取り開始を押してカメラを起動します
              </p>
            </div>
            <Button
              className="h-14 w-full max-w-sm rounded-2xl text-base"
              onClick={() => {
                setCameraEnabled(true);
                setStep("scan");
              }}
            >
              読み取り開始
            </Button>
            <button
              type="button"
              className="text-xs text-emerald-300"
              onClick={() => {
                setCameraEnabled(false);
                setStep("scan");
              }}
            >
              カメラが使えない方（文字列貼り付け）
            </button>
          </div>
        ) : null}

        {step === "scan" ? (
          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                QR連続スキャン
              </p>
              <h1 className="text-xl font-semibold">あと{remaining}回</h1>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <div className="flex items-center gap-1">
                  {Array.from({ length: activeConfig.requiredCount }).map((_, index) => (
                    <span
                      key={`indicator-${index}`}
                      className={`h-2 w-8 rounded-full ${
                        index < scanItems.length ? "bg-emerald-400" : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <span>
                  {scanItems.length}/{activeConfig.requiredCount}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {cameraEnabled ? (
                <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                  <div
                    id={qrRegionId}
                    className="aspect-[3/4] w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                    QRコードを枠内に合わせてください
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300">
                  カメラが使えない場合はQR文字列を貼り付けてください。
                </div>
              )}
              {scanError ? (
                <div className="space-y-2 text-xs text-rose-300">
                  <p>{scanError}</p>
                  {scanErrorDetail ? <p className="text-[11px]">詳細: {scanErrorDetail}</p> : null}
                </div>
              ) : null}
              {scanNotice ? <p className="text-xs text-amber-300">{scanNotice}</p> : null}
              {!cameraEnabled || scanError ? (
                <div className="rounded-2xl bg-slate-900 p-4">
                  <div className="flex flex-col gap-2">
                    <Input
                      value={manualRaw}
                      onChange={(event) => setManualRaw(event.target.value)}
                      className="h-11 rounded-xl border-slate-700 bg-slate-900 text-white"
                      placeholder="QR文字列を貼り付け"
                    />
                    <Button
                      type="button"
                      className="h-11 rounded-xl"
                      onClick={handleManualAdd}
                      disabled={!manualRaw.trim()}
                    >
                      追加する
                    </Button>
                  </div>
                </div>
              ) : null}
              {scanItems.length >= activeConfig.requiredCount ? (
                <Button
                  onClick={() => setStep("confirm")}
                  className="h-12 w-full rounded-2xl text-base"
                >
                  次へ進む
                </Button>
              ) : null}
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
                推定結果を元に自動入力しています。必要なら修正してください。
              </p>
            </div>
            <div className="space-y-4">
              {scanItems.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-100">読み取り {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-xs text-rose-300"
                    >
                      削除
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="text-xs text-slate-400">display_code</label>
                    <Input
                      value={item.display_code}
                      onChange={(event) => handleDisplayCodeChange(item.id, event.target.value)}
                      className="h-11 rounded-xl border-slate-700 bg-slate-950 text-white"
                      placeholder="実物表記を入力"
                    />
                    <button
                      type="button"
                      onClick={() => toggleRawDetail(item.id)}
                      className="text-left text-xs text-emerald-300"
                    >
                      {expandedRawIds.has(item.id) ? "詳細を閉じる" : "詳細を見る"}
                    </button>
                    {expandedRawIds.has(item.id) ? (
                      <div className="rounded-xl bg-slate-950 px-3 py-2 text-[11px] text-slate-400">
                        <p className="font-semibold text-slate-300">raw_qr</p>
                        <p className="break-all">{item.raw_qr}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {hasDuplicateDisplayCode ? (
                <p className="text-xs text-rose-300">display_codeが重複しています。</p>
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
                onClick={handleResetScan}
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
                      name="qr-suggestion"
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
                    name="qr-suggestion"
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
