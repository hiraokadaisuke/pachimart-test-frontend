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
  const [isStarting, setIsStarting] = useState(false);
  const qrRegionId = useId();
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const isStartingRef = useRef(false);
  const isRunningRef = useRef(false);
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

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      const cleanup = async () => {
        if (startPromiseRef.current) {
          try {
            await startPromiseRef.current;
          } catch (error) {
            console.debug(error);
          }
        }
        if (isRunningRef.current && scannerRef.current) {
          isRunningRef.current = false;
          try {
            await scannerRef.current.stop();
          } catch (error) {
            console.debug(error);
          }
          try {
            scannerRef.current.clear();
          } catch (error) {
            console.debug(error);
          }
          scannerRef.current = null;
        }
      };
      void cleanup();
    };
  }, []);

  const stopScanner = async (resetStatus = true) => {
    if (isRunningRef.current && scannerRef.current) {
      isRunningRef.current = false;
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.debug(error);
      }
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.debug(error);
      }
      scannerRef.current = null;
    }
    if (resetStatus && !unmountedRef.current) {
      setScanStatus("idle");
    }
  };

  const resolveCameraErrorMessage = (error: unknown) => {
    const name = error instanceof Error ? error.name : undefined;
    const detail = error instanceof Error ? error.message : null;
    switch (name) {
      case "NotAllowedError":
      case "SecurityError":
        return {
          message: "カメラの権限が拒否されています。設定で許可してからページを再読み込みしてください。",
          detail: null,
        };
      case "NotFoundError":
        return { message: "この端末にカメラが見つかりません。", detail: null };
      case "NotReadableError":
        return {
          message: "他のアプリがカメラを使用中です。アプリを閉じてから再度お試しください。",
          detail: null,
        };
      case "OverconstrainedError":
        return {
          message: "環境カメラを使用できませんでした。フロントカメラで再試行してください。",
          detail: null,
        };
      case "LibraryLoadError":
        return {
          message: "ライブラリ読み込み失敗のためQR文字列貼り付けをご利用ください。",
          detail: name ?? null,
        };
      default:
        return {
          message: "カメラの起動に失敗しました。QR文字列貼り付けをお試しください。",
          detail: name ?? detail,
        };
    }
  };

  const startScannerWithConfig = async (
    cameraConfig: MediaTrackConstraints | { facingMode: { ideal: "environment" } } | boolean,
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
      cameraConfig as MediaTrackConstraints,
      {
        fps: 10,
        qrbox: { width: qrBoxSize, height: qrBoxSize },
        aspectRatio: 1.0,
        disableFlip: false,
      },
      onSuccess,
      onFailure,
    );
    const qrRegion = document.getElementById(qrRegionId);
    const video = qrRegion?.querySelector("video");
    if (video) {
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
    }
  };

  const handleStartScan = async () => {
    if (isStartingRef.current || isRunningRef.current) return;

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

    isStartingRef.current = true;
    isHandlingSuccessRef.current = false;
    if (!unmountedRef.current) {
      setIsStarting(true);
    }
    setScanOrigin("camera");
    const startPromise = (async () => {
      const onSuccess = async (decodedText: string) => {
        if (isHandlingSuccessRef.current || unmountedRef.current) return;
        isHandlingSuccessRef.current = true;
        setQrRaw(decodedText);
        setScanStatus("success");
        await stopScanner(false);
        isHandlingSuccessRef.current = false;
      };

      const onFailure = (error: Error | string) => {
        if (scanStatus !== "scanning") return;
        if (typeof error === "string" && error.includes("QR code parse error")) return;
        if (error instanceof Error && error.name === "QR_CODE_PARSE_ERROR") return;
        console.debug(error);
      };

      try {
        await startScannerWithConfig({ facingMode: { ideal: "environment" } }, onSuccess, onFailure);
      } catch (error) {
        try {
          await startScannerWithConfig(true, onSuccess, onFailure);
        } catch (fallbackError) {
          if (fallbackError instanceof Error && fallbackError.name === "OverconstrainedError") {
            await startScannerWithConfig({ facingMode: "user" }, onSuccess, onFailure);
          } else {
            throw fallbackError;
          }
        }
      }
      isRunningRef.current = true;
      if (!unmountedRef.current) {
        setScanStatus("scanning");
      }
    })();

    startPromiseRef.current = startPromise;
    try {
      await startPromise;
    } catch (error) {
      console.error(error);
      isRunningRef.current = false;
      const { message, detail } = resolveCameraErrorMessage(error);
      if (!unmountedRef.current) {
        setScanError(message);
        setScanErrorDetail(detail);
        setScanStatus("idle");
      }
      await stopScanner();
    } finally {
      isStartingRef.current = false;
      startPromiseRef.current = null;
      if (!unmountedRef.current) {
        setIsStarting(false);
      }
    }
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
    void stopScanner();
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
                disabled={scanStatus === "scanning" || isStarting}
              >
                {isStarting ? "起動中…" : "カメラで読み取る"}
              </Button>
              <Button
                onClick={() => void stopScanner()}
                variant="outline"
                className="h-11 w-full rounded-none text-sm sm:w-auto"
                disabled={scanStatus !== "scanning"}
              >
                停止
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div
              className="relative flex min-h-[220px] w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500"
            >
              <div
                id={qrRegionId}
                className={`h-full w-full rounded-md ${
                  scanStatus === "scanning" ? "block" : "hidden"
                }`}
              />
              {scanStatus === "scanning" ? null : (
                <span>QRコードを枠内に合わせてください</span>
              )}
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
