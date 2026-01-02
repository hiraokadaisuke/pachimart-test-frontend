import { NextResponse } from "next/server";

import { getPublicListingById } from "@/lib/listings/getPublicListingById";

export async function GET(_request: Request, { params }: { params: { id?: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    const exhibit = await getPublicListingById(id);

    if (!exhibit) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(exhibit);
  } catch (error) {
    console.error("Failed to fetch public listing", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}
