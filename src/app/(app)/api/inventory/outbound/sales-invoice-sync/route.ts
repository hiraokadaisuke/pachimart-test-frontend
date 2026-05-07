import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { syncSalesInvoiceToOutboundSchedules } from "@/features/inventory/sales-invoice-outbound-sync";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

const schema = z.object({
  salesInvoiceId: z.string().min(1),
  salesInvoiceType: z.enum(["vendor", "hall"]),
  customerName: z.string().optional().nullable(),
  destinationName: z.string().optional().nullable(),
  destinationAddress: z.string().optional().nullable(),
  destinationPhone: z.string().optional().nullable(),
  machineShipDate: z.string().optional().nullable(),
  carrierName: z.string().optional().nullable(),
  shippingMethod: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
  items: z.array(z.record(z.any())),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const ownerUserId = getCurrentUserId(request) ?? "dev_user_1";
  const result = await syncSalesInvoiceToOutboundSchedules({
    ownerUserId,
    salesInvoiceId: body.salesInvoiceId,
    salesInvoiceType: body.salesInvoiceType,
    customerName: body.customerName,
    destinationName: body.destinationName,
    destinationAddress: body.destinationAddress,
    destinationPhone: body.destinationPhone,
    machineShipDate: body.machineShipDate,
    carrierName: body.carrierName,
    shippingMethod: body.shippingMethod,
    memo: body.memo,
    items: body.items as SalesInvoiceItem[],
  });
  return NextResponse.json(result);
}
