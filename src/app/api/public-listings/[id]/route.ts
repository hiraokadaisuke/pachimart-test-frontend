import { NextResponse } from "next/server";

import { getPublicListingById } from "@/lib/listings/getPublicListingById";

export async function GET(_request: Request, { params }: { params: { id?: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    const listing = await getPublicListingById(id);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Failed to fetch public listing", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}
