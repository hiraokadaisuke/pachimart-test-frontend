"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import type { Listing } from "@/lib/listings/types";

function formatPrice(listing: Listing) {
  if (listing.isNegotiable || listing.unitPriceExclTax === null) {
    return "応相談";
  }

  return `¥${listing.unitPriceExclTax.toLocaleString("ja-JP")}`;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export default function ProductListPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch("/api/listings");
        if (!response.ok) {
          throw new Error(`Failed to fetch listings: ${response.status}`);
        }

        const data: Listing[] = await response.json();
        setListings(data);
      } catch (error) {
        console.error("Failed to load listings", error);
        setListings([]);
      }
    };

    fetchListings();
  }, []);

  const columns: NaviTableColumn[] = useMemo(
    () => [
      { key: "kind", label: "種別", width: "90px" },
      { key: "maker", label: "メーカー", width: "140px" },
      { key: "machineName", label: "機種名", width: "220px" },
      {
        key: "quantity",
        label: "台数",
        width: "80px",
        render: (row: Listing) => `${row.quantity}台`,
      },
      {
        key: "unitPriceExclTax",
        label: "販売単価（税抜）",
        width: "140px",
        render: (row: Listing) => formatPrice(row),
      },
      {
        key: "storageLocation",
        label: "保管場所",
        width: "180px",
      },
      {
        key: "allowPartial",
        label: "バラ売り",
        width: "90px",
        render: (row: Listing) => (row.allowPartial ? "可" : "不可"),
      },
      {
        key: "updatedAt",
        label: "更新日時",
        width: "160px",
        render: (row: Listing) => formatDate(row.updatedAt),
      },
    ],
    []
  );

  const filteredListings = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();

    if (!keywordLower) return listings;

    return listings.filter((listing) => {
      const maker = listing.maker?.toLowerCase() ?? "";
      const machineName = listing.machineName?.toLowerCase() ?? "";
      const storageLocation = listing.storageLocation.toLowerCase();

      return (
        maker.includes(keywordLower) ||
        machineName.includes(keywordLower) ||
        storageLocation.includes(keywordLower)
      );
    });
  }, [keyword, listings]);

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-[1400px] mx-auto px-4 xl:px-8 py-6 space-y-4 bg-white">
        <h1 className="text-xl font-bold text-slate-800">商品一覧から探す</h1>

        <TransactionFilterBar keyword={keyword} onKeywordChange={setKeyword} hideStatusFilter />

        <NaviTable
          columns={columns}
          rows={filteredListings}
          onRowClick={(row) => router.push(`/products/${row.id}`)}
          emptyMessage="出品がありません"
        />
      </div>
    </div>
  );
}
