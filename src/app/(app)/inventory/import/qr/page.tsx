"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";

import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addImportFromQr } from "@/lib/inventory/mock";
import { inventoryModelMasters } from "@/lib/inventory/mockMasters";
import { suggestModels } from "@/lib/inventory/qr/parse";

type Html5QrcodeInstance = InstanceType<typeof Html5Qrcode>;
type ScannerState = "idle" | "starting" | "scanning" | "stopping";
type Html5QrcodeCamera = { id: string; label?: string };

export default function InventoryImportQrPage() {
  const [qrRaw, setQrRaw] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [scanOrigin, setScanOrigin] = useState<"camera" | "manual">("manual");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanErrorDetail, setScanErrorDetail] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [manualMaker, setManualMaker] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const qrRegionId = useId();
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerStateRef = useRef<ScannerState>("idle");
  const actionLockRef = useRef<Promise<void>>(Promise.resolve());
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const unmountedRef = useRef(false);
  const isHandlingSuccessRef = useRef(false);

  const suggestions = useMemo(() => suggestModels(qrRaw, inventoryModelMasters), [qrRaw]);

  const makerOptions = useMemo(() => {
    return Array.from(new Set(inventoryModelMasters.map((entry) => entry.maker)));
  }, []);

  const modelOptions = useMemo(() => {
    if (!manualMaker) return [];
    return inventoryModelMasters
      .filter((entry) => entry.maker === manualMaker)
      .map((entry) => entry.model);
  }, [manualMaker]);

  useEffect(() => {
    if (suggestions.length > 0) {
      setSelectedSuggestionId(suggestions[0]?.id ?? null);
    } else {
      setSelectedSuggestionId(null);
    }
  }, [suggestions]);

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
    cameraConfig: string | MediaTrackConstraints | boolean,
    onSuccess: (decodedText: string) => void,
    onFailure: (error: Error | string) => void,
  ) => {
    if (!scannerRef.current) {
      if (!Html5Qrcode) {
        throw new Error("LibraryLoadError");
      }
      scannerRef.current = new Html5Qrcode(qrRegionId);
    }
    const qrBoxSize = Math.max(200, Math.min(260, Math.floor(window.innerWidth * 0.6)));
    await scannerRef.current.start(
      cameraConfig,
      {
        fps: 10,
        qrbox: { width: qrBoxSize, height: qrBoxSize },
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
        setScanStatus("idle");
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
      setScanStatus("idle");
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
    setScanOrigin("camera");
    let didStart = false;

    const startPromise = (async () => {
      const onSuccess = async (decodedText: string) => {
        if (isHandlingSuccessRef.current || unmountedRef.current) return;
        isHandlingSuccessRef.current = true;
        setQrRaw(decodedText);
        setScanStatus("success");
        await safeStop(false);
        isHandlingSuccessRef.current = false;
      };

      const onFailure = (error: Error | string) => {
        if (scannerStateRef.current !== "scanning") return;
        if (typeof error === "string" && error.includes("QR code parse error")) return;
        if (error instanceof Error && error.name === "QR_CODE_PARSE_ERROR") return;
        console.debug(error);
      };

      const attemptStart = async (cameraConfig: string | MediaTrackConstraints | boolean) => {
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

      const fallbackConfigs: Array<MediaTrackConstraints | boolean> = [
        { facingMode: "environment" },
        true,
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
        setScanStatus("scanning");
      }
      setScannerStateSafe("scanning");
      didStart = true;
    } catch (error) {
      console.error(error);
      setScannerStateSafe("idle");
      const { message, detail } = resolveCameraErrorMessage(error);
      if (!unmountedRef.current) {
        setScanError(message);
        setScanErrorDetail(detail);
        setScanStatus("idle");
      }
      await safeStop();
    } finally {
      startPromiseRef.current = null;
      if (!didStart) {
        setScannerStateSafe("idle");
      }
    }
  };

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

  const handleStartScan = async () => {
    await withActionLock(safeStart);
  };

  const handleRegister = () => {
    if (!qrRaw.trim()) return;

    const selectedSuggestion = suggestions.find((item) => item.id === selectedSuggestionId);
    const maker = selectedSuggestion?.maker ?? manualMaker;
    const model = selectedSuggestion?.model ?? manualModel;

    if (!maker || !model) return;

    addImportFromQr({
      qrRaw: qrRaw.trim(),
      maker,
      model,
      source: scanOrigin === "camera" ? "QR仮登録(カメラ)" : "QR仮登録(貼り付け)",
    });

    setRegisteredMessage("仮登録しました。レビューで補完してください。");
  };

  const handleReset = () => {
    void withActionLock(() => safeStop());
    setQrRaw("");
    setScanOrigin("manual");
    setScanStatus("idle");
    setManualMaker("");
    setManualModel("");
    setRegisteredMessage(null);
    setScanError(null);
    setScanErrorDetail(null);
    setSelectedSuggestionId(null);
  };

  const canRegister = Boolean(
    qrRaw.trim() &&
      ((selectedSuggestionId && suggestions.length > 0) || (manualMaker && manualModel)),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <InventoryToolbar
        title="QR仮登録（スマホ）"
        description="カメラ読み取り → 自動入力 → 機種候補 → 仮登録までをスマホで完結します。"
      />

      <div className="mt-4 space-y-4">
        <InventoryPanel
          title="QR読み取り"
          description="カメラを起動し、QRコードを読み取って自動入力します。"
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={handleStartScan}
                className="h-11 w-full rounded-none text-sm sm:w-auto"
                disabled={scannerState !== "idle"}
              >
                {scannerState === "starting" ? "起動中…" : "カメラで読み取る"}
              </Button>
              <Button
                onClick={() => void withActionLock(() => safeStop())}
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
                className="min-h-[360px] w-full overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 sm:min-h-[320px] [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />
              {scanStatus === "idle" ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  QRコードを枠内に合わせてください
                </div>
              ) : null}
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
                iPhone/Androidに対応。カメラが使えない場合は手動入力をご利用ください。
              </p>
            )}
          </div>
        </InventoryPanel>

        <InventoryPanel
          title="読取結果"
          description="QR文字列が自動で入力されます。手動で貼り付けてもOKです。"
        >
          <div className="space-y-3">
            <Input
              value={qrRaw}
              onChange={(event) => {
                setQrRaw(event.target.value);
                setScanOrigin("manual");
                setScanStatus("idle");
                setRegisteredMessage(null);
              }}
              className="h-11 rounded-none"
              placeholder="QR文字列を貼り付け"
            />
            <div className="text-xs text-slate-500">
              解析トークン: {qrRaw ? `${suggestions.length} 件の候補を抽出中` : "-"}
            </div>
          </div>
        </InventoryPanel>

        <InventoryPanel
          title="解析結果（機種候補）"
          description="読み取った文字列から機種候補を提示します。"
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
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                候補が見つかりません。手入力でメーカー/機種を選択してください。
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-500">
                  メーカー
                  <select
                    value={manualMaker}
                    onChange={(event) => {
                      setManualMaker(event.target.value);
                      setManualModel("");
                    }}
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="">メーカーを選択</option>
                    {makerOptions.map((maker) => (
                      <option key={maker} value={maker}>
                        {maker}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  機種
                  <select
                    value={manualModel}
                    onChange={(event) => setManualModel(event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    disabled={!manualMaker}
                  >
                    <option value="">機種を選択</option>
                    {modelOptions.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </InventoryPanel>

        <InventoryPanel
          title="仮登録"
          description="選択した候補をもとに仮登録し、レビュー画面へ進みます。"
          actions={
            <Button
              onClick={handleRegister}
              className="h-11 w-full rounded-none text-sm sm:w-auto"
              disabled={!canRegister}
            >
              仮登録
            </Button>
          }
        >
          <div className="space-y-3 text-sm text-slate-600">
            {registeredMessage ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                {registeredMessage}
              </div>
            ) : (
              <p>仮登録後、補完画面で保管拠点や棚を入力してください。</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/inventory/import/review"
                className="flex h-11 items-center justify-center rounded-none border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                仮登録レビューへ
              </Link>
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-11 w-full rounded-none text-sm sm:w-auto"
              >
                続けて読み取る
              </Button>
            </div>
          </div>
        </InventoryPanel>
      </div>
    </div>
  );
}
