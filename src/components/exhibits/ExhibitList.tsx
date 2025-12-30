"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { formatStorageLocationShort } from "@/lib/listings/storageLocation";
import type { Listing } from "@/lib/listings/types";

function formatDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function getStatusLabel(listing: Listing) {
  if (listing.status === "DRAFT") return "下書き";
  if (listing.status === "SOLD") return "成約済み";
  if (listing.status === "PUBLISHED" && !listing.isVisible) return "公開停止";
  return "出品中";
}

const statusBadgeStyles: Record<string, string> = {
  出品中: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  公開停止: "bg-slate-100 text-slate-600 border border-slate-200",
  成約済み: "bg-gray-100 text-gray-700 border border-gray-200",
  下書き: "bg-amber-50 text-amber-700 border border-amber-100",
};

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  minimumFractionDigits: 0,
});

type ExhibitListProps = {
  status: "出品中" | "下書き";
  onNewExhibit?: () => void;
  isPickMode?: boolean;
};

type ExhibitFilters = {
  maker: string;
  model: string;
  noteKeyword: string;
};

export function ExhibitList({ status, onNewExhibit, isPickMode = false }: ExhibitListProps) {
  const router = useRouter();
  const currentUser = useCurrentDevUser();
  const defaultFilters = useMemo<ExhibitFilters>(
    () => ({
      maker: "",
      model: "",
      noteKeyword: "",
    }),
    []
  );

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, [defaultFilters]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithDevHeader(
        `/api/listings?sellerUserId=${encodeURIComponent(currentUser.id)}`,
        { cache: "no-store" },
        currentUser.id
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.status}`);
      }
      const data: Listing[] = await response.json();
      setListings(data);
    } catch (error) {
      console.error("Failed to load listings", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateListing = useCallback(
    async (listingId: string, payload: { status?: string; isVisible?: boolean }) => {
      try {
        const response = await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-dev-user-id": currentUser.id,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to update listing: ${response.status}`);
        }

        await fetchListings();
      } catch (error) {
        console.error("Failed to update listing", error);
      }
    },
    [currentUser.id, fetchListings]
  );

  const baseListings = useMemo(() => {
    if (status === "下書き") {
      return listings.filter((listing) => listing.status === "DRAFT");
    }
    return listings.filter((listing) => listing.status !== "DRAFT");
  }, [listings, status]);

  const listedProducts = useMemo(() => {
    return baseListings.filter((listing) => {
      const makerMatched = appliedFilters.maker ? listing.maker === appliedFilters.maker : true;
      const modelMatched = appliedFilters.model
        ? (listing.machineName ?? "").toLowerCase().includes(appliedFilters.model.toLowerCase())
        : true;
      const noteMatched = appliedFilters.noteKeyword
        ? (listing.note ?? "").toLowerCase().includes(appliedFilters.noteKeyword.toLowerCase())
        : true;

      return makerMatched && modelMatched && noteMatched;
    });
  }, [appliedFilters, baseListings]);

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleReload = () => {
    fetchListings();
  };

  const handleCreateNaviFromListing = (listing: Listing) => {
    const params = new URLSearchParams({
      productId: listing.id.toString(),
      quantity: "1",
      unitPrice: listing.unitPriceExclTax?.toString() ?? "0",
      productName: listing.machineName ?? "",
      makerName: listing.maker ?? "",
    });

    if (listing.storageLocation) {
      params.set("location", listing.storageLocation);
    }

    router.push(`/transactions/navi/${listing.id}/edit?${params.toString()}`);
  };

  const handlePickForNavi = (listing: Listing) => {
    const params = new URLSearchParams({ tab: "new", pickListingId: listing.id });
    router.push(`/navi?${params.toString()}`);
  };

  const totalCount = listedProducts.length;

  const makerOptions = useMemo(
    () =>
      Array.from(
        new Set(baseListings.map((listing) => listing.maker).filter((maker): maker is string => Boolean(maker)))
      ),
    [baseListings]
  );

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-4 px-4 text-xs md:px-6 xl:px-8">
      {isPickMode && (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-neutral-800">
          ナビ用に出品を選択中です。任意の出品で「この出品を選択」を押すとナビ作成に反映されます。
        </div>
      )}
      <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
        <div className="text-xs text-neutral-700 sm:text-sm">全件数：{totalCount}件</div>
        <div />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md bg-slate-50 px-4 py-3">
        <div className="flex flex-col">
          {/* メーカー */}
          <label className="mb-1 block text-xs font-semibold text-neutral-800">メーカー</label>
          <select
            value={draftFilters.maker}
            onChange={(event) => setDraftFilters({ ...draftFilters, maker: event.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          >
            <option value="">すべて</option>
            {makerOptions.map((maker) => (
              <option key={maker} value={maker}>
                {maker}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          {/* 機種名 */}
          <label className="mb-1 block text-xs font-semibold text-neutral-800">機種名</label>
          <input
            type="search"
            value={draftFilters.model}
            onChange={(event) => setDraftFilters({ ...draftFilters, model: event.target.value })}
            placeholder="機種名で検索"
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
        <div className="flex flex-col sm:min-w-[220px]">
          {/* 備考キーワード */}
          <label className="mb-1 block text-xs font-semibold text-neutral-800">備考</label>
          <input
            type="search"
            value={draftFilters.noteKeyword}
            onChange={(event) => setDraftFilters({ ...draftFilters, noteKeyword: event.target.value })}
            placeholder="備考キーワード"
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* ボタン群 */}
          <button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            検索
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-neutral-900 transition hover:bg-slate-100"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-neutral-900 transition hover:bg-slate-100"
          >
            一覧を更新
          </button>
          {status === "出品中" && !isPickMode && (
            <button
              type="button"
              onClick={onNewExhibit}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              新規出品
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-neutral-800">
          読み込み中…
        </div>
      ) : listedProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-neutral-800">
          {status === "下書き" ? "下書きはまだありません。" : "該当する出品がありません。"}
        </div>
      ) : (
        <div className="relative min-h-[420px] overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-auto border-collapse text-xs text-slate-800">
            <colgroup>
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[220px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[200px]" />
              <col className="w-[88px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-neutral-700">
                <th className="px-2 py-1.5 text-left">更新日</th>
                <th className="px-2 py-1.5 text-left">状況</th>
                <th className="px-2 py-1.5 text-left">前設置</th>
                <th className="px-2 py-1.5 text-left">メーカー</th>
                <th className="px-2 py-1.5 text-left">機種名</th>
                <th className="px-2 py-1.5 text-right">台数</th>
                <th className="px-2 py-1.5 text-right">売却数</th>
                <th className="px-2 py-1.5 text-right">残数</th>
                <th className="px-2 py-1.5 text-right">商品価</th>
                <th className="px-2 py-1.5 text-left">撤去日</th>
                <th className="px-2 py-1.5 text-left">備考</th>
                <th className="sticky right-0 bg-slate-50 px-2 py-1.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {listedProducts.map((listing, idx) => {
                const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                const statusLabel = getStatusLabel(listing);
                const soldCount = listing.status === "SOLD" ? listing.quantity : 0;
                const remainingCount = Math.max(listing.quantity - soldCount, 0);
                const rowTone =
                  listing.status === "SOLD"
                    ? "opacity-60"
                    : listing.status === "PUBLISHED" && !listing.isVisible
                      ? "opacity-80"
                      : "";
                const canOperate = listing.status !== "SOLD";
                const statusActionLabel =
                  listing.status === "DRAFT"
                    ? "公開する"
                    : listing.status === "PUBLISHED" && listing.isVisible
                      ? "公開停止"
                      : listing.status === "PUBLISHED"
                        ? "再公開"
                        : null;
                const statusActionPayload =
                  listing.status === "DRAFT"
                    ? { status: "PUBLISHED", isVisible: true }
                    : listing.status === "PUBLISHED" && listing.isVisible
                      ? { isVisible: false }
                      : listing.status === "PUBLISHED"
                        ? { isVisible: true }
                        : null;
                const storageLocationLabel = formatStorageLocationShort(
                  listing.storageLocationSnapshot,
                  listing.storageLocation ?? undefined
                );

                return (
                  <tr key={listing.id} className={`${zebra} ${rowTone} border-b border-slate-100 text-xs`}>
                    <td className="whitespace-nowrap px-2 py-1.5 align-top text-neutral-900">
                      {formatDate(listing.updatedAt)}
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                          statusBadgeStyles[statusLabel] ?? "bg-slate-100 text-neutral-900 border border-slate-200"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 align-top font-semibold text-slate-800">
                      <span className="block max-w-[110px] truncate whitespace-nowrap" title={storageLocationLabel}>
                        {storageLocationLabel}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 align-top text-neutral-900" title={listing.maker ?? ""}>
                      <span className="block max-w-[110px] truncate whitespace-nowrap">{listing.maker ?? "-"}</span>
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <Link
                        href={`/products/${listing.id}`}
                        className="block max-w-[220px] truncate text-xs font-semibold text-sky-700 underline-offset-2 hover:underline"
                        title={listing.machineName ?? ""}
                      >
                        {listing.machineName ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-top text-right font-semibold tabular-nums">
                      {listing.quantity}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-top text-right tabular-nums">{soldCount}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-top text-right tabular-nums">
                      {remainingCount}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-top text-right font-semibold tabular-nums">
                      {listing.isNegotiable || listing.unitPriceExclTax === null
                        ? "応相談"
                        : currencyFormatter.format(listing.unitPriceExclTax)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 align-top font-semibold text-slate-800">-</td>
                    <td className="px-2 py-1.5 align-top text-neutral-900" title={listing.note ?? ""}>
                      <span className="block max-w-[220px] truncate whitespace-nowrap">{listing.note ?? "-"}</span>
                    </td>
                    <td
                      className={`sticky right-0 px-2 py-1.5 align-top border-l border-slate-200 ${
                        zebra === "bg-white" ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {isPickMode ? (
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-3 py-1 text-[13px] font-semibold text-neutral-800 transition hover:bg-slate-50"
                            onClick={() => handlePickForNavi(listing)}
                          >
                            この出品を選択
                          </button>
                        ) : canOperate ? (
                          <ActionMenu
                            onCreateNavi={() => handleCreateNaviFromListing(listing)}
                            onEdit={() => {}}
                            statusActionLabel={statusActionLabel ?? undefined}
                            onStatusAction={
                              statusActionPayload
                                ? () => updateListing(listing.id, statusActionPayload)
                                : undefined
                            }
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

type ActionMenuProps = {
  onCreateNavi: () => void;
  onEdit?: () => void;
  statusActionLabel?: string;
  onStatusAction?: () => void;
};

function ActionMenu({ onCreateNavi, onEdit, statusActionLabel, onStatusAction }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-7 w-8 items-center justify-center rounded border border-slate-300 text-base leading-none text-slate-700 transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ︙
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[13px] font-semibold text-neutral-800 hover:bg-slate-50"
            onClick={() => {
              onCreateNavi();
              setOpen(false);
            }}
          >
            取引Navi
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[13px] text-neutral-800 hover:bg-slate-50"
            onClick={() => {
              onEdit?.();
              setOpen(false);
            }}
          >
            編集
          </button>
          {statusActionLabel && onStatusAction && (
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[13px] text-neutral-800 hover:bg-slate-50"
              onClick={() => {
                onStatusAction();
                setOpen(false);
              }}
            >
              {statusActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
