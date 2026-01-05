import { z } from "zod";

import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { type ShippingInfo } from "@/lib/dealings/types";

const storageLocationSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  postalCode: z.string().nullable(),
  prefecture: z.string().nullable(),
  city: z.string().nullable(),
  addressLine: z.string().nullable(),
  handlingFeePerUnit: z.number().nullable(),
  shippingFeesByRegion: z.record(z.number()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StorageLocationDto = z.infer<typeof storageLocationSchema>;

export async function fetchStorageLocations(ownerUserId: string): Promise<StorageLocationDto[]> {
  const response = await fetchWithDevHeader(
    "/api/storage-locations",
    {},
    ownerUserId
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch storage locations: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = z.array(storageLocationSchema).safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

export const storageLocationToShippingInfo = (
  location: StorageLocationDto,
  companyName?: string
): ShippingInfo => {
  const addressLine = location.addressLine ?? location.address ?? "";
  const combinedAddress = `${location.prefecture ?? ""}${location.city ?? ""}${addressLine}`;

  return {
    companyName: companyName ?? undefined,
    zip: location.postalCode ?? undefined,
    address: combinedAddress || undefined,
    tel: undefined,
    personName: undefined,
  };
};
