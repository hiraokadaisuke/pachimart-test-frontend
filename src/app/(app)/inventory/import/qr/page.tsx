"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStockFromQrScan } from "@/lib/inventory/mock";
import { inventoryModelMasters } from "@/lib/inventory/mockMasters";
import { parseQrRaw, suggestModels } from "@/lib/inventory/qr/parse";

type Html5QrcodeInstance = InstanceType<typeof Html5Qrcode>;
type ScannerState = "idle" | "starting" | "scanning" | "stopping";
type Html5QrcodeCamera = { id: string; label?: string };

type ScanMode = "pachi" | "slot";
type ScanKind = "board" | "frame" | "mainboard" | "serial";

type ScanItem = {
  id: string;
  raw_qr: string;
  display_code: string;
  kind: ScanKind;
  parsed: ReturnType<typeof parseQrRaw>;
};

const MODE_CONFIG: Record<ScanMode, { label: string; requiredCount: number; kinds: ScanKind[] }> = {
  pachi: {
    label: "パチンコ（3本）",
    requiredCount: 3,
    kinds: ["board", "frame", "mainboard"],
  },
  slot: {
    label: "スロット（2本）",
    requiredCount: 2,
    kinds: ["serial", "mainboard"],
  },
};

const KIND_LABELS: Record<ScanKind, string> = {
  board: "遊技盤番号",
  frame: "枠番号",
  mainboard: "主基板番号",
  serial: "本体製造番号",
};

const DEDUPE_MS = 1500;

export default function InventoryImportQrPage() {
  const [scanMode, setScanMode] = useState<ScanMode>("pachi");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanErrorDetail, setScanErrorDetail] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [manualRaw, setManualRaw] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const qrRegionId = useId();
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerStateRef = useRef<ScannerState>("idle");
  const actionLockRef = useRef<Promise<void>>(Promise.resolve());
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const unmountedRef = useRef(false);
  const isHandlingSuccessRef = useRef(false);
  const lastDecodedRef = useRef<{ text: string; time: number } | null>(null);

  const activeConfig = MODE_CONFIG[scanMode];

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

  useEffect(() => {
    if (suggestions.length > 0) {
      setSelectedSuggestionId(suggestions[0]?.id ?? null);
    } else {
      setSelectedSuggestionId(null);
    }
  }, [suggestions]);

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
      const size = Math.min(width, height, 280);
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
    setRegisteredMessage(null);

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
    void withActionLock(safeStart);
  }, []);

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

  const assignKindForNewItem = (items: ScanItem[]) => {
    const kinds = MODE_CONFIG[scanMode].kinds;
    const used = new Set(items.map((item) => item.kind));
    const nextKind = kinds.find((kind) => !used.has(kind));
    return nextKind ?? kinds[0];
  };

  const addScanItem = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setScanNotice(null);
    setScanItems((prev) => {
      if (prev.length >= activeConfig.requiredCount) {
        setScanNotice("必要本数が揃っています。誤読は削除してから再スキャンしてください。");
        return prev;
      }
      const parsed = parseQrRaw(trimmed);
      const kind = assignKindForNewItem(prev);
      const displayCode = scanMode === "slot" ? trimmed : "";
      const nextItem: ScanItem = {
        id: crypto.randomUUID(),
        raw_qr: trimmed,
        display_code: displayCode,
        kind,
        parsed,
      };
      return [...prev, nextItem];
    });
  };

  const handleStopScan = async () => {
    await withActionLock(() => safeStop());
  };

  const handleManualAdd = () => {
    addScanItem(manualRaw);
    setManualRaw("");
  };

  const handleKindChange = (id: string, nextKind: ScanKind) => {
    setScanItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, kind: nextKind } : item)),
    );
  };

  const handleDisplayCodeChange = (id: string, value: string) => {
    setScanItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, display_code: value } : item)),
    );
  };

  const handleDeleteItem = (id: string) => {
    setScanItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleModeChange = (mode: ScanMode) => {
    setScanMode(mode);
    setScanItems([]);
    setManualRaw("");
    setScanNotice(null);
    setRegisteredMessage(null);
  };

  const displayCodes = scanItems.map((item) => item.display_code.trim()).filter(Boolean);
  const uniqueDisplayCodes = new Set(displayCodes);
  const hasDuplicateDisplayCode = uniqueDisplayCodes.size !== displayCodes.length;
  const requiredKindsReady = activeConfig.kinds.every(
    (kind) => scanItems.filter((item) => item.kind === kind).length === 1,
  );
  const allDisplayFilled = scanItems.length === activeConfig.requiredCount;
  const canRegister =
    scanItems.length === activeConfig.requiredCount &&
    requiredKindsReady &&
    allDisplayFilled &&
    displayCodes.length === activeConfig.requiredCount &&
    !hasDuplicateDisplayCode &&
    Boolean(selectedSuggestionId);

  const handleRegister = async () => {
    if (!canRegister) return;
    const selectedSuggestion = suggestions.find((item) => item.id === selectedSuggestionId);
    if (!selectedSuggestion) return;
    const displayList = scanItems.map((item) => item.display_code.trim());

    addStockFromQrScan({
      maker: selectedSuggestion.maker,
      model: selectedSuggestion.model,
      mode: scanMode,
      displayCodes: displayList,
      rawCodes: scanItems.map((item) => item.raw_qr),
    });

    setRegisteredMessage("在庫登録が完了しました。次のQRを読み取れます。");
    setToastMessage("在庫登録が完了しました");
    setScanItems([]);
    setSelectedSuggestionId(null);
    setScanNotice(null);
    await withActionLock(() => safeStop());
  };

  const remaining = Math.max(activeConfig.requiredCount - scanItems.length, 0);

  const resolveDisplayPlaceholder = (item: ScanItem) => {
    const candidate = item.parsed.extracted.numericStrings[0] ?? item.parsed.extracted.modelNumbers[0];
    return candidate ? `例: ${candidate}` : "実物表記を入力";
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6">
      <InventoryToolbar
        title="QR在庫登録（スマホ特化）"
        description="連続スキャンで番号を割り当て、機種選択から在庫登録まで完結します。"
      />

      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(Object.keys(MODE_CONFIG) as ScanMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  scanMode === mode
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {MODE_CONFIG[mode].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-md bg-emerald-50 px-4 py-2 text-emerald-700">
            <span className="text-xs font-semibold">残り</span>
            <span className="text-3xl font-bold leading-none">{remaining}</span>
            <span className="text-xs">本</span>
          </div>
        </div>

        <InventoryPanel
          title="連続スキャン"
          description="カメラを止めずに読み取り結果を積み上げます。"
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={() => void withActionLock(safeStart)}
                className="h-11 w-full rounded-none text-sm sm:w-auto"
                disabled={scannerState !== "idle"}
              >
                {scannerState === "starting" ? "起動中…" : "カメラ起動"}
              </Button>
              <Button
                onClick={handleStopScan}
                variant="outline"
                className="h-11 w-full rounded-none text-sm sm:w-auto"
                disabled={scannerState !== "scanning"}
              >
                停止
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="relative w-full">
              <div
                id={qrRegionId}
                className="aspect-[3/4] w-full overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                QRコードを枠内に合わせてください
              </div>
            </div>
            {scanError ? (
              <div className="space-y-1 text-xs text-rose-600">
                <p>{scanError}</p>
                {scanErrorDetail ? (
                  <p className="text-[11px] text-rose-500">詳細: {scanErrorDetail}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                iPhone/Android対応。カメラが使えない場合は下の手入力をご利用ください。
              </p>
            )}
            {scanNotice ? <p className="text-xs text-amber-600">{scanNotice}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={manualRaw}
                onChange={(event) => setManualRaw(event.target.value)}
                className="h-11 rounded-none"
                placeholder="QR文字列を手入力"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-none text-sm"
                onClick={handleManualAdd}
                disabled={!manualRaw.trim()}
              >
                手入力を追加
              </Button>
            </div>
          </div>
        </InventoryPanel>

        <InventoryPanel
          title="読み取り結果"
          description="番号種別と実物表記（display_code）を確定してください。"
        >
          <div className="space-y-3">
            {scanItems.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                まだ読み取り結果がありません。QRを読み取るとカードが追加されます。
              </div>
            ) : (
              <div className="space-y-3">
                {scanItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">読み取り {index + 1}</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-none px-3 text-xs"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        削除
                      </Button>
                    </div>
                    <div className="mt-2 grid gap-2">
                      <div className="flex flex-wrap gap-2">
                        {activeConfig.kinds.map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => handleKindChange(item.id, kind)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                              item.kind === kind
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            {KIND_LABELS[kind]}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">display_code</label>
                        <Input
                          value={item.display_code}
                          onChange={(event) => handleDisplayCodeChange(item.id, event.target.value)}
                          className="mt-1 h-11 rounded-none"
                          placeholder={
                            scanMode === "slot" ? "自動入力（必要なら編集）" : resolveDisplayPlaceholder(item)
                          }
                        />
                        {scanMode === "pachi" && !item.display_code.trim() ? (
                          <p className="mt-1 text-[11px] text-amber-600">
                            パチンコは実物表記の入力が必須です。
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        <p className="font-semibold text-slate-600">raw_qr</p>
                        <p className="break-all">{item.raw_qr}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hasDuplicateDisplayCode ? (
              <p className="text-xs text-rose-600">
                display_code が重複しています。異なる実物表記を入力してください。
              </p>
            ) : null}
          </div>
        </InventoryPanel>

        <InventoryPanel
          title="機種候補"
          description="読み取り結果から機種を選択します。"
        >
          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm transition-colors sm:items-center ${
                    item.id === selectedSuggestionId
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white"
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
                    <p className="font-semibold text-slate-900">
                      {item.maker} / {item.model}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      マッチ理由: {item.reasons.join(" / ")}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">読み取り結果から候補が見つかりません。</p>
          )}
        </InventoryPanel>
      </div>

      <div className="sticky bottom-0 left-0 right-0 mt-6 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">登録条件</p>
            <ul className="list-inside list-disc text-xs text-slate-500">
              <li>{activeConfig.requiredCount}本の番号が揃っている</li>
              <li>display_code が全て入力済み</li>
              <li>機種候補を1つ選択</li>
            </ul>
            {registeredMessage ? (
              <p className="text-sm font-semibold text-emerald-600">{registeredMessage}</p>
            ) : null}
          </div>
          <Button
            onClick={handleRegister}
            className="h-12 w-full rounded-none text-base sm:w-56"
            disabled={!canRegister}
          >
            在庫登録
          </Button>
        </div>
      </div>

      {toastMessage ? (
        <div className="fixed bottom-20 left-1/2 z-40 w-[90%] -translate-x-1/2 rounded-md bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg sm:w-[360px]">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
