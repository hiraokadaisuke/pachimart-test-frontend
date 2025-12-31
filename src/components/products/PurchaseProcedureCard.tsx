"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { loadMasterData, type Warehouse } from "@/lib/demo-data/demoMasterData";
import { resolveStorageLocationSnapshot } from "@/lib/listings/storageLocation";
import type { Listing } from "@/lib/listings/types";
import { formatCurrency } from "@/lib/useDummyNavi";

type InquiryStatus = {
  available: boolean;
  reason: string;
};

type EstimateResult = {
  subtotal: number;
  machineShippingTotal: number;
  shippingHandlingTotal: number;
  total: number;
  machineShippingFeePerUnit: number;
  shippingHandlingFeePerUnit: number;
};

type RegionKey =
  | "hokkaido"
  | "tohokuNorth"
  | "tohokuSouth"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kitakyushu"
  | "minamikyushu"
  | "okinawa";

const REGION_PREFECTURE_MAP: Array<{ key: RegionKey; names: string[] }> = [
  { key: "hokkaido", names: ["北海道"] },
  { key: "tohokuNorth", names: ["青森", "岩手", "秋田"] },
  { key: "tohokuSouth", names: ["宮城", "山形", "福島"] },
  { key: "kanto", names: ["茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川"] },
  { key: "chubu", names: ["新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知"] },
  { key: "kinki", names: ["三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山"] },
  { key: "chugoku", names: ["鳥取", "島根", "岡山", "広島", "山口"] },
  { key: "shikoku", names: ["徳島", "香川", "愛媛", "高知"] },
  { key: "kitakyushu", names: ["福岡", "佐賀", "長崎", "大分"] },
  { key: "minamikyushu", names: ["熊本", "宮崎", "鹿児島"] },
  { key: "okinawa", names: ["沖縄"] },
];

const resolveRegionKey = (warehouse?: Warehouse): RegionKey | null => {
  if (!warehouse) return null;
  const source = `${warehouse.name ?? ""} ${warehouse.address ?? ""}`;
  for (const region of REGION_PREFECTURE_MAP) {
    if (region.names.some((name) => source.includes(name))) {
      return region.key;
    }
  }
  return null;
};

const normalizeShippingFees = (value: unknown): Record<string, number> | null => {
  if (!value || typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries.reduce<Record<string, number>>((acc, [key, raw]) => {
    const parsed = typeof raw === "number" ? raw : Number(raw);
    acc[key] = Number.isFinite(parsed) ? parsed : 0;
    return acc;
  }, {});
};

const resolveShippingFeePerUnit = (
  shippingFeesByRegion: Record<string, number> | null,
  warehouse?: Warehouse
): number => {
  if (!shippingFeesByRegion) return 0;
  const regionKey = resolveRegionKey(warehouse);
  if (regionKey && shippingFeesByRegion[regionKey] !== undefined) {
    return shippingFeesByRegion[regionKey] ?? 0;
  }
  const fallback = Object.values(shippingFeesByRegion).find((value) => Number.isFinite(value));
  return fallback ?? 0;
};

export function PurchaseProcedureCard({
  listing,
  inquiryStatus,
}: {
  listing: Listing;
  inquiryStatus: InquiryStatus;
}) {
  const masterData = useMemo(() => loadMasterData(), []);
  const warehouseDetails = useMemo(() => masterData.warehouseDetails ?? [], [masterData]);
  const maxQuantity = Math.max(listing.quantity, 1);
  const quantityOptions = useMemo(() => {
    if (!listing.allowPartial) return [maxQuantity];
    return Array.from({ length: maxQuantity }, (_, index) => index + 1);
  }, [listing.allowPartial, maxQuantity]);
  const [quantity, setQuantity] = useState(quantityOptions[0] ?? 1);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [showEstimate, setShowEstimate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedWarehouse = useMemo(
    () => warehouseDetails.find((warehouse) => warehouse.id === selectedWarehouseId),
    [selectedWarehouseId, warehouseDetails]
  );

  const storageSnapshot = useMemo(
    () => resolveStorageLocationSnapshot(listing.storageLocationSnapshot),
    [listing.storageLocationSnapshot]
  );

  const shippingFeesByRegion = useMemo(
    () => normalizeShippingFees(storageSnapshot?.shippingFeesByRegion ?? null),
    [storageSnapshot?.shippingFeesByRegion]
  );

  const machineShippingFeePerUnit = useMemo(
    () => resolveShippingFeePerUnit(shippingFeesByRegion, selectedWarehouse),
    [shippingFeesByRegion, selectedWarehouse]
  );

  const shippingHandlingFeePerUnit = storageSnapshot?.handlingFeePerUnit ?? 0;
  const unitPrice = listing.unitPriceExclTax ?? 0;

  const estimate = useMemo<EstimateResult>(() => {
    const subtotal = unitPrice * quantity;
    const machineShippingTotal = machineShippingFeePerUnit * listing.shippingFeeCount * quantity;
    const shippingHandlingTotal = shippingHandlingFeePerUnit * listing.handlingFeeCount * quantity;
    return {
      subtotal,
      machineShippingTotal,
      shippingHandlingTotal,
      total: subtotal + machineShippingTotal + shippingHandlingTotal,
      machineShippingFeePerUnit,
      shippingHandlingFeePerUnit,
    };
  }, [
    unitPrice,
    quantity,
    machineShippingFeePerUnit,
    listing.shippingFeeCount,
    shippingHandlingFeePerUnit,
    listing.handlingFeeCount,
  ]);

  const handleEstimateClick = () => {
    if (!selectedWarehouseId) {
      setErrorMessage("お届け先の倉庫を選択してください。");
      setShowEstimate(false);
      return;
    }
    setErrorMessage(null);
    setShowEstimate(true);
  };

  const inquiryHref = useMemo(() => {
    if (!showEstimate || !selectedWarehouseId) return "";
    const params = new URLSearchParams();
    params.set("tab", "new");
    params.set("mode", "inquiry");
    params.set("listingId", listing.id);
    params.set("qty", String(quantity));
    params.set("buyerWarehouseId", selectedWarehouseId);
    params.set("unitPrice", String(unitPrice));
    params.set("subtotal", String(estimate.subtotal));
    params.set("machineShippingFeePerUnit", String(estimate.machineShippingFeePerUnit));
    params.set("machineShippingPackages", String(listing.shippingFeeCount));
    params.set("machineShippingTotal", String(estimate.machineShippingTotal));
    params.set("shippingHandlingFeePerUnit", String(estimate.shippingHandlingFeePerUnit));
    params.set("shippingHandlingPackages", String(listing.handlingFeeCount));
    params.set("shippingHandlingTotal", String(estimate.shippingHandlingTotal));
    params.set("total", String(estimate.total));
    return `/navi?${params.toString()}`;
  }, [
    estimate,
    listing.id,
    listing.handlingFeeCount,
    listing.shippingFeeCount,
    quantity,
    selectedWarehouseId,
    showEstimate,
    unitPrice,
  ]);

  const canProceedInquiry = inquiryStatus.available && Boolean(inquiryHref);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 text-[13px] shadow-sm">
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold text-slate-900">購入手続き</h3>
        <p className="text-[12px] leading-[16px] text-neutral-700">
          台数とお届け先を選択して簡易見積りを確認できます。
        </p>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">台数</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-[13px]"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          >
            {quantityOptions.map((option) => (
              <option key={option} value={option}>
                {option}台
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">お届け先</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-[13px]"
            value={selectedWarehouseId}
            onChange={(event) => setSelectedWarehouseId(event.target.value)}
          >
            <option value="">倉庫を選択</option>
            {warehouseDetails.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[12px]">
          <p className="text-xs text-neutral-600">倉庫住所</p>
          <p className="text-neutral-900">
            {selectedWarehouse ? selectedWarehouse.address || selectedWarehouse.name : "-"}
          </p>
        </div>
      </div>

      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}

      <button
        type="button"
        className="flex h-10 w-full items-center justify-center rounded-md bg-slate-900 px-3 text-[13px] font-semibold text-white hover:bg-slate-800"
        onClick={handleEstimateClick}
      >
        支払金額を見る
      </button>

      {showEstimate && (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">簡易見積り</p>
          <div className="space-y-1 text-[12px] text-neutral-900">
            <EstimateRow label="商品代金" value={formatCurrency(estimate.subtotal)} />
            <EstimateRow label="機械送料" value={formatCurrency(estimate.machineShippingTotal)} />
            <EstimateRow label="出庫手数料" value={formatCurrency(estimate.shippingHandlingTotal)} />
            <EstimateRow label="合計" value={formatCurrency(estimate.total)} emphasis />
          </div>
        </div>
      )}

      <Link
        href={canProceedInquiry ? inquiryHref : "#"}
        aria-disabled={!canProceedInquiry}
        className={`flex h-10 w-full items-center justify-center rounded-md px-3 text-[13px] font-semibold shadow ${
          canProceedInquiry
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "cursor-not-allowed bg-slate-200 text-neutral-500"
        } ${!canProceedInquiry ? "pointer-events-none" : ""}`}
      >
        オンライン問い合わせ
      </Link>
      {!inquiryStatus.available && (
        <p className="text-[12px] leading-[16px] text-neutral-700">{inquiryStatus.reason}</p>
      )}
    </div>
  );
}

function EstimateRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-700">{label}</span>
      <span className={emphasis ? "font-semibold text-slate-900" : "font-semibold"}>{value}</span>
    </div>
  );
}
