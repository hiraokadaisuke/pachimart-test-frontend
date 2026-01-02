import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { DEV_USERS } from "@/lib/dev-user/users";
import { getPublicListingById } from "@/lib/exhibits/getPublicListingById";
import { prisma } from "@/lib/server/prisma";

import MainContainer from "@/components/layout/MainContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Listing } from "@/lib/exhibits/types";
import { formatStorageLocationFull } from "@/lib/exhibits/storageLocation";
import { PurchaseProcedureCard } from "@/components/products/PurchaseProcedureCard";

const formatPrice = (listing: Listing) => {
  if (listing.isNegotiable || listing.unitPriceExclTax === null) {
    return "応相談";
  }

  return `¥${listing.unitPriceExclTax.toLocaleString("ja-JP")}（税抜）`;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ja-JP");
};

const resolveInquiryStatus = (listing: Listing, isSellerViewing: boolean) => {
  if (isSellerViewing) {
    return { available: false as const, reason: "出品者は問い合わせを作成できません" };
  }

  if (listing.status === "SOLD") {
    return { available: false as const, reason: "成約済みのため受付できません" };
  }

  return { available: true as const, reason: "" };
};

export default async function ProductDetailPage({ params }: { params: { listingId: string } }) {
  const currentCookies = cookies();
  const devUserId = currentCookies.get("dev_user_id")?.value ?? DEV_USERS.A.id;
  const listing = await getPublicListingById(params.listingId);

  if (!listing) notFound();

  const isSellerViewing = listing.sellerUserId === devUserId;
  const inquiryStatus = resolveInquiryStatus(listing, isSellerViewing);
  const seller = await prisma.user.findUnique({
    where: { id: listing.sellerUserId },
    select: {
      companyName: true,
      contactName: true,
      tel: true,
    },
  });
  const removalLabel =
    listing.removalStatus === "REMOVED" ? "撤去済" : formatDate(listing.removalDate);

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
            <SectionHeader>詳細情報</SectionHeader>
            <div className="grid grid-cols-1 gap-2 bg-white p-3 md:grid-cols-2">
              <DetailRow label="種別" value={listing.kind} />
              <DetailRow label="枠色" value="-" />
              <DetailRow label="機械送料回数" value={`${listing.shippingFeeCount}個口`} />
              <DetailRow label="出庫手数料回数" value={`${listing.handlingFeeCount}個口`} />
              <DetailRow label="釘シート" value={listing.hasNailSheet ? "あり" : "なし"} />
              <DetailRow label="取扱説明書" value={listing.hasManual ? "あり" : "なし"} />
              <DetailRow label="引き取り" value={listing.pickupAvailable ? "可" : "不可"} />
              <DetailRow label="撤去日" value={removalLabel} />
              <DetailRow label="配送までの指定日" value="-" />
              <DetailRow
                label="前設置"
                value={formatStorageLocationFull(
                  listing.storageLocationSnapshot,
                  listing.storageLocation ?? undefined
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-[13px]">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="text-[14px] font-semibold text-slate-900">出品者</h3>
            <div className="space-y-1 text-[12px] text-neutral-700">
              <SellerInfoRow label="会社名" value={seller?.companyName ?? "-"} />
              <SellerInfoRow label="担当者名" value={seller?.contactName ?? "-"} />
              <SellerInfoRow label="会社電話番号" value={seller?.tel ?? "-"} />
              <SellerInfoRow label="担当者電話番号" value="-" />
              <SellerInfoRow label="組合加盟状況" value="-" />
            </div>
          </div>
          <PurchaseProcedureCard listing={listing} inquiryStatus={inquiryStatus} />
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

function SellerInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      <span className="text-[12px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}
