import { ListingStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";

const listingClient = prisma.listing;

const toDto = (listing: any) => ({
  id: String(listing.id),
  sellerUserId: String(listing.sellerUserId),
  status: listing.status as ListingStatus,
  isVisible: Boolean(listing.isVisible),
  kind: String(listing.kind),
  maker: listing.maker as string | null,
  machineName: listing.machineName as string | null,
  quantity: Number(listing.quantity),
  unitPriceExclTax:
    listing.unitPriceExclTax === null || listing.unitPriceExclTax === undefined
      ? null
      : Number(listing.unitPriceExclTax),
  isNegotiable: Boolean(listing.isNegotiable),
  storageLocation: String(listing.storageLocation),
  shippingFeeCount: Number(listing.shippingFeeCount),
  handlingFeeCount: Number(listing.handlingFeeCount),
  allowPartial: Boolean(listing.allowPartial),
  note: (listing.note as string | null) ?? null,
  createdAt: new Date(listing.createdAt).toISOString(),
  updatedAt: new Date(listing.updatedAt).toISOString(),
});

export async function GET(_request: Request, { params }: { params: { id?: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    const listing = await listingClient.findUnique({ where: { id } });

    if (!listing || listing.status !== ListingStatus.PUBLISHED || !listing.isVisible) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(toDto(listing));
  } catch (error) {
    console.error("Failed to fetch listing", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}
