import { z } from "zod";

import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";

const onlineInquiryListItemSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  buyerUserId: z.string(),
  sellerUserId: z.string(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  makerName: z.string().nullable(),
  machineName: z.string().nullable(),
  quantity: z.number(),
  totalAmount: z.number(),
  partnerName: z.string(),
  buyerCompanyName: z.string().nullable(),
  sellerCompanyName: z.string().nullable(),
});

const onlineInquiryDetailSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  buyerUserId: z.string(),
  sellerUserId: z.string(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
  buyerCompanyName: z.string(),
  sellerCompanyName: z.string(),
  makerName: z.string().nullable(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalAmount: z.number(),
  shippingAddress: z.string(),
  contactPerson: z.string(),
  desiredShipDate: z.string(),
  desiredPaymentDate: z.string(),
  memo: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OnlineInquiryListItem = z.infer<typeof onlineInquiryListItemSchema>;
export type OnlineInquiryDetail = z.infer<typeof onlineInquiryDetailSchema>;
export type OnlineInquiryStatus = OnlineInquiryListItem["status"];
export type OnlineInquiryAction = "accept" | "reject";

const ONLINE_INQUIRY_UPDATED_EVENT = "online_inquiry_updated";

export async function fetchOnlineInquiries(role: "buyer" | "seller"): Promise<OnlineInquiryListItem[]> {
  const response = await fetchWithDevHeader(`/api/online-inquiries?role=${role}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch online inquiries: ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = z.array(onlineInquiryListItemSchema).safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

export async function fetchOnlineInquiryDetail(inquiryId: string): Promise<OnlineInquiryDetail | null> {
  const response = await fetchWithDevHeader(`/api/online-inquiries/${inquiryId}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`Failed to fetch online inquiry: ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = onlineInquiryDetailSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

export async function respondOnlineInquiry(
  inquiryId: string,
  action: OnlineInquiryAction
): Promise<OnlineInquiryDetail> {
  const response = await fetchWithDevHeader(`/api/online-inquiries/${inquiryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update online inquiry: ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = onlineInquiryDetailSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ONLINE_INQUIRY_UPDATED_EVENT));
  }

  return parsed.data;
}
