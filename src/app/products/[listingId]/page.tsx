import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import MainContainer from "@/components/layout/MainContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildApiUrl } from "@/lib/http/apiBaseUrl";
import type { Listing } from "@/lib/listings/types";
import { formatStorageLocationFull } from "@/lib/listings/storageLocation";

async function fetchListing(listingId: string, devUserId?: string): Promise<Listing | null> {
  try {
    const response = await fetch(buildApiUrl(`/api/listings/${listingId}`), {
      cache: "no-store",
      headers: devUserId ? { "x-dev-user-id": devUserId } : undefined,
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      console.error("Failed to fetch listing detail", response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch listing detail", error);
    return null;
  }
}

const formatPrice = (listing: Listing) => {
  if (listing.isNegotiable || listing.unitPriceExclTax === null) {
    return "応相談";
  }

  return `¥${listing.unitPriceExclTax.toLocaleString("ja-JP")}（税抜）`;
};

const resolveInquiryStatus = (listing: Listing) => {
  if (listing.status === "SOLD") {
    return { available: false as const, reason: "成約済みのため受付できません" };
  }

  const isAvailable =
    !listing.isNegotiable &&
    listing.unitPriceExclTax !== null &&
    Boolean(listing.storageLocation) &&
    listing.shippingFeeCount !== undefined;

  if (isAvailable) {
    return { available: true as const, reason: "" };
  }

  const reason = listing.isNegotiable || listing.unitPriceExclTax === null
    ? "応相談のためオンライン問い合わせは利用できません"
    : "必要な情報が不足しているためオンライン問い合わせは利用できません";

  return { available: false as const, reason };
};

export default async function ProductDetailPage({ params }: { params: { listingId: string } }) {
  const devUserId = cookies().get("dev_user_id")?.value;

  const listing = await fetchListing(params.listingId, devUserId);

  if (!listing) {
    notFound();
  }

  const inquiryStatus = resolveInquiryStatus(listing);
  const isSold = listing.status === "SOLD";
  const naviCreateHref = `/navi?tab=new&listingId=${listing.id}`;
  const inquiryHref = `/navi?tab=new&mode=inquiry&listingId=${listing.id}`;

  return (
    <MainContainer>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 text-[13px] shadow-sm">
          <div className="space-y-1.5 border-b border-slate-200 pb-3">
            <p className="text-xs font-semibold text-neutral-700">{listing.maker ?? "メーカー未設定"}</p>
            <h1 className="text-xl font-bold text-slate-900">{listing.machineName ?? "機種名未設定"}</h1>
            <p className="text-xs font-semibold text-emerald-700">在庫{listing.quantity}台（{listing.allowPartial ? "バラ売り可" : "バラ売り不可"}）</p>
            <p className="text-2xl font-bold text-slate-900">{formatPrice(listing)}</p>
          </div>

          <div className="rounded border border-slate-200">
            <SectionHeader>基本情報</SectionHeader>
            <div className="grid grid-cols-1 gap-2 bg-white p-3 md:grid-cols-2">
              <DetailRow label="種別" value={listing.kind} />
              <DetailRow label="メーカー" value={listing.maker ?? "-"} />
              <DetailRow label="機種名" value={listing.machineName ?? "-"} />
              <DetailRow label="台数" value={`${listing.quantity}台`} />
              <DetailRow label="単価" value={formatPrice(listing)} />
              <DetailRow
                label="保管場所"
                value={formatStorageLocationFull(listing.storageLocationSnapshot, listing.storageLocation)}
              />
            </div>
          </div>

          <div className="rounded border border-slate-200">
            <SectionHeader>取引条件</SectionHeader>
            <div className="grid grid-cols-1 gap-2 bg-white p-3 md:grid-cols-2">
              <DetailRow label="送料回数" value={`${listing.shippingFeeCount}個口`} />
              <DetailRow label="出庫手数料回数" value={`${listing.handlingFeeCount}個口`} />
              <DetailRow label="バラ売り可否" value={listing.allowPartial ? "可" : "不可"} />
              <DetailRow label="備考" value={listing.note ?? "-"} />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-[13px]">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-[14px] font-semibold text-slate-900">ナビ作成</h3>
              <p className="text-[12px] leading-[16px] text-neutral-700">出品情報をもとにナビを作成します。</p>
            </div>
            <Link
              href={naviCreateHref}
              aria-disabled={isSold}
              className={`flex h-10 w-full items-center justify-center rounded-md px-3 text-[13px] font-semibold shadow ${
                isSold
                  ? "cursor-not-allowed bg-slate-200 text-neutral-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } ${isSold ? "pointer-events-none" : ""}`}
            >
              ナビ作成
            </Link>
            {isSold && (
              <p className="text-[12px] leading-[16px] text-neutral-700">成約済みのため受付できません</p>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-[14px] font-semibold text-slate-900">オンライン問い合わせ</h3>
              <p className="text-[12px] leading-[16px] text-neutral-700">オンラインで問い合わせを送信できます。</p>
            </div>
            <Link
              href={inquiryHref}
              aria-disabled={!inquiryStatus.available}
              className={`flex h-10 w-full items-center justify-center rounded-md px-3 text-[13px] font-semibold shadow ${
                inquiryStatus.available
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-neutral-500"
              } ${!inquiryStatus.available ? "pointer-events-none" : ""}`}
            >
              オンライン問い合わせ
            </Link>
            {!inquiryStatus.available && (
              <p className="text-[12px] leading-[16px] text-neutral-700">{inquiryStatus.reason}</p>
            )}
          </div>
        </div>
      </div>
    </MainContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-3 rounded-md border border-slate-200 bg-white px-3 py-1.5">
      <span className="w-32 shrink-0 text-[12px] font-semibold text-neutral-700">{label}</span>
      <span className="text-[13px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}
