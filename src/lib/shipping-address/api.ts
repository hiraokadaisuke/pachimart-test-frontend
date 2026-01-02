import { z } from "zod";

import { type ShippingInfo } from "@/lib/dealings/types";
import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";

const shippingAddressSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  label: z.string().nullable(),
  companyName: z.string().nullable(),
  postalCode: z.string().nullable(),
  prefecture: z.string().nullable(),
  city: z.string().nullable(),
  addressLine: z.string().nullable(),
  tel: z.string().nullable(),
  contactName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ShippingAddressDto = z.infer<typeof shippingAddressSchema>;

const shippingAddressListSchema = z.array(shippingAddressSchema);

const handleResponse = async (response: Response) => {
  if (response.ok) return response;
  const detail = await response.text();
  throw new Error(`Request failed: ${response.status} ${detail}`);
};

export const shippingAddressToShippingInfo = (address: ShippingAddressDto): ShippingInfo => ({
  companyName: address.companyName ?? undefined,
  zip: address.postalCode ?? undefined,
  address: address.addressLine ?? undefined,
  tel: address.tel ?? undefined,
  personName: address.contactName ?? undefined,
});

export async function fetchShippingAddresses(ownerUserId: string): Promise<ShippingAddressDto[]> {
  const response = await fetchWithDevHeader(
    "/api/shipping-addresses",
    {
      headers: { "x-dev-user-id": ownerUserId },
    },
    ownerUserId
  );

  await handleResponse(response);

  const json = (await response.json()) as unknown;
  const parsed = shippingAddressListSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

export async function createShippingAddress(
  ownerUserId: string,
  payload: ShippingInfo & { label?: string | null }
): Promise<ShippingAddressDto> {
  const response = await fetchWithDevHeader(
    "/api/shipping-addresses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-user-id": ownerUserId,
      },
      body: JSON.stringify({
        label: payload.label ?? null,
        companyName: payload.companyName ?? null,
        postalCode: payload.zip ?? null,
        prefecture: null,
        city: null,
        addressLine: payload.address ?? null,
        tel: payload.tel ?? null,
        contactName: payload.personName ?? null,
      }),
    },
    ownerUserId
  );

  await handleResponse(response);

  const json = (await response.json()) as unknown;
  const parsed = shippingAddressSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}
