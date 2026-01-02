"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import type { Listing } from "@/lib/exhibits/types";
import { resolveStorageLocationSnapshot } from "@/lib/exhibits/storageLocation";
import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { findDevUserById } from "@/lib/dev-user/users";

type ListingType = "PACHINKO" | "SLOT";

type MakerOption = { id: string; name: string };
type MachineModelOption = { id: string; makerId: string; type: ListingType; name: string };

const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  PACHINKO: "パチンコ",
  SLOT: "スロット",
};

type SortKey = "oldest" | "newest" | "cheapest" | "expensive";

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

function formatPrice(listing: Listing) {
  if (listing.isNegotiable || listing.unitPriceExclTax === null) {
    return "応相談";
  }

  return `¥${listing.unitPriceExclTax.toLocaleString("ja-JP")}`;
}

function formatDate(isoString: string | null) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${month}/${day}`;
}

function extractPrefecture(listing: Listing) {
  const snapshot = resolveStorageLocationSnapshot(listing.storageLocationSnapshot);
  const candidates = [snapshot?.prefecture, snapshot?.address, listing.storageLocation];
  const joined = candidates.find((value) => typeof value === "string" && value.trim() !== "") ?? "";

  if (!joined) return "";

  const prefecture = PREFECTURES.find((pref) => joined.includes(pref));
  if (!prefecture) return "";

  if (prefecture === "北海道") return prefecture;

  return prefecture.replace(/(都|道|府|県)$/u, "");
}

function getSellerCompanyName(sellerUserId: string) {
  return findDevUserById(sellerUserId)?.companyName ?? "-";
}

export default function ProductListPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedType, setSelectedType] = useState<ListingType>("PACHINKO");
  const [makers, setMakers] = useState<MakerOption[]>([]);
  const [machineModels, setMachineModels] = useState<MachineModelOption[]>([]);
  const [filters, setFilters] = useState({ makerId: "", machineModelId: "", frameOnly: false });
  const [draftFilters, setDraftFilters] = useState({ makerId: "", machineModelId: "", frameOnly: false });
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const router = useRouter();

  useEffect(() => {
    const normalizeListing = (listing: unknown): Listing | null => {
      if (!listing || typeof listing !== "object") return null;

      const candidate = listing as Record<string, unknown>;
      const id = candidate.id ?? candidate.listingId;

      if (!id) return null;

      return {
        ...candidate,
        id: String(id),
      } as Listing;
    };

    const fetchListings = async () => {
      try {
        const response = await fetchWithDevHeader("/api/listings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch listings: ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid listings response");
        }

        const normalized = data
          .map((listing) => normalizeListing(listing))
          .filter((listing): listing is Listing => Boolean(listing));

        setListings(normalized);
      } catch (error) {
        console.error("Failed to load listings", error);
        setListings([]);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const response = await fetchWithDevHeader(
          `/api/machine-masters?type=${encodeURIComponent(selectedType)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch machine masters: ${response.status}`);
        }

        const data = (await response.json()) as {
          makers: MakerOption[];
          machineModels: MachineModelOption[];
        };

        setMakers(data.makers);
        setMachineModels(data.machineModels);
        setDraftFilters({ makerId: "", machineModelId: "", frameOnly: false });
        setFilters({ makerId: "", machineModelId: "", frameOnly: false });
      } catch (error) {
        console.error(error);
        setMakers([]);
        setMachineModels([]);
      }
    };

    fetchMasters();
  }, [selectedType]);

  const availableMachineModels = useMemo(() => {
    if (!draftFilters.makerId) return machineModels;
    return machineModels.filter((model) => model.makerId === draftFilters.makerId);
  }, [draftFilters.makerId, machineModels]);

  const appliedMakerName = useMemo(
    () => makers.find((maker) => maker.id === filters.makerId)?.name ?? "",
    [filters.makerId, makers]
  );

  const appliedMachineName = useMemo(
    () => machineModels.find((model) => model.id === filters.machineModelId)?.name ?? "",
    [filters.machineModelId, machineModels]
  );

  const filteredListings = useMemo(() => {
    return listings
      .filter((listing) => listing.type === selectedType)
      .filter((listing) => {
        if (filters.frameOnly && !listing.kind?.includes("枠")) return false;
        if (appliedMakerName && listing.maker !== appliedMakerName) return false;
        if (
          appliedMachineName &&
          !(listing.machineName ?? "").toLowerCase().includes(appliedMachineName.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [appliedMachineName, appliedMakerName, filters.frameOnly, listings, selectedType]);

  const sortedListings = useMemo(() => {
    const base = [...filteredListings];

    switch (sortKey) {
      case "oldest":
        return base.sort(
          (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case "newest":
        return base.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "cheapest":
        return base.sort((a, b) => {
          const priceA = a.unitPriceExclTax ?? (a.isNegotiable ? Number.POSITIVE_INFINITY : 0);
          const priceB = b.unitPriceExclTax ?? (b.isNegotiable ? Number.POSITIVE_INFINITY : 0);
          return priceA - priceB;
        });
      case "expensive":
        return base.sort((a, b) => {
          const priceA = a.unitPriceExclTax ?? (a.isNegotiable ? Number.NEGATIVE_INFINITY : 0);
          const priceB = b.unitPriceExclTax ?? (b.isNegotiable ? Number.NEGATIVE_INFINITY : 0);
          return priceB - priceA;
        });
      default:
        return base;
    }
  }, [filteredListings, sortKey]);

  const columns: NaviTableColumn[] = useMemo(
    () => [
      {
        key: "updatedAt",
        label: "更新日",
        width: "82px",
        render: (row: Listing) => formatDate(row.updatedAt),
      },
      {
        key: "status",
        label: "状況",
        width: "72px",
        render: (row: Listing) =>
          row.status === "SOLD" ? (
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-neutral-700">
              成約済
            </span>
          ) : (
            ""
          ),
      },
      {
        key: "previousLocation",
        label: "前設置",
        width: "92px",
        render: (row: Listing) => extractPrefecture(row),
      },
      { key: "maker", label: "メーカー", width: "140px" },
      {
        key: "machineName",
        label: "機種名",
        width: "210px",
        render: (row: Listing) => (
          <span className="text-sm font-semibold text-[#1e5aad] underline">
            {row.machineName ?? "機種名未設定"}
          </span>
        ),
      },
      {
        key: "type",
        label: "タイプ",
        width: "90px",
        render: () => "-",
      },
      {
        key: "quantity",
        label: "台数",
        width: "70px",
        render: (row: Listing) => row.quantity,
      },
      {
        key: "unitPriceExclTax",
        label: "価格",
        width: "110px",
        render: (row: Listing) => formatPrice(row),
      },
      {
        key: "removalDate",
        label: "撤去日",
        width: "110px",
        render: (row: Listing) => formatDate(row.removalDate),
      },
      {
        key: "seller",
        label: "出品者",
        width: "170px",
        render: (row: Listing) => getSellerCompanyName(row.sellerUserId),
      },
      {
        key: "note",
        label: "備考",
        width: "200px",
        render: (row: Listing) => row.note ?? "",
      },
    ],
    []
  );

  const handleSearch = () => {
    setFilters(draftFilters);
  };

  const handleMakerChange = (makerId: string) => {
    setDraftFilters({ makerId, machineModelId: "", frameOnly: draftFilters.frameOnly });
  };

  const renderSortLink = (label: string, key: SortKey) => (
    <button
      type="button"
      className={`text-sm underline-offset-4 hover:underline ${
        sortKey === key ? "font-semibold text-[#0f2d62]" : "text-slate-700"
      }`}
      onClick={() => setSortKey(key)}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full bg-white">
      <div className="w-full bg-[#0f2d62] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-4 xl:px-8">
          <div className="flex items-center gap-2 rounded-md bg-white/5 p-1">
            {(Object.keys(LISTING_TYPE_LABELS) as ListingType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={`rounded px-4 py-2 text-sm font-semibold transition ${
                  selectedType === type
                    ? "bg-white text-[#0f2d62] shadow"
                    : "text-white hover:bg-white/10"
                }`}
                onClick={() => setSelectedType(type)}
              >
                {LISTING_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <select
            className="min-w-[200px] rounded border border-white/30 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            value={draftFilters.makerId}
            onChange={(event) => handleMakerChange(event.target.value)}
          >
            <option value="">メーカー指定なし</option>
            {makers.map((maker) => (
              <option key={maker.id} value={maker.id}>
                {maker.name}
              </option>
            ))}
          </select>

          <select
            className="min-w-[220px] rounded border border-white/30 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            value={draftFilters.machineModelId}
            onChange={(event) =>
              setDraftFilters({ ...draftFilters, machineModelId: event.target.value })
            }
          >
            <option value="">機種名指定なし</option>
            {availableMachineModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-transparent text-[#0f2d62] focus:ring-white"
              checked={draftFilters.frameOnly}
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, frameOnly: event.target.checked })
              }
            />
            枠のみ
          </label>

          <button
            type="button"
            className="rounded border border-white/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            絞り込み条件を追加
          </button>

          <button
            type="button"
            className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            onClick={handleSearch}
          >
            検索
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-4 xl:px-8 py-6 space-y-4 bg-white">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="text-lg font-semibold text-[#0f2d62]">
              {LISTING_TYPE_LABELS[selectedType]}商品一覧
            </span>
            <span className="text-sm">対象機種：{filteredListings.length}件</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 text-sm">
          {renderSortLink("古い順", "oldest")}
          <span className="text-slate-300">|</span>
          {renderSortLink("新しい順", "newest")}
          <span className="text-slate-300">|</span>
          {renderSortLink("安い順", "cheapest")}
          <span className="text-slate-300">|</span>
          {renderSortLink("高い順", "expensive")}
        </div>

        <NaviTable
          columns={columns}
          rows={sortedListings}
          onRowClick={(row) => {
            if (!row?.id) return;
            router.push(`/products/${row.id}`);
          }}
          emptyMessage="出品がありません"
          getRowClassName={(row: Listing) => (row.status === "SOLD" ? "opacity-60" : "")}
        />
      </div>
    </div>
  );
}
