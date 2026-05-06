import { InventoryUnitScanForm } from "@/components/inventory/InventoryUnitScanForm";
import { createInventoryUnitFromScan, getInventoryUnitScanOptions, linkInventoryUnitToOutbound, parseUnitScanInput } from "@/features/inventory/server";

export default async function InventoryUnitScanPage() {
  const scanOptions = await getInventoryUnitScanOptions();
  return <div className="mx-auto max-w-3xl px-4 py-8 md:px-6"><h1 className="mb-4 text-2xl font-bold">個体スキャン登録</h1><InventoryUnitScanForm scanOptions={scanOptions} parseAction={async (formData) => {"use server"; return parseUnitScanInput(formData);}} createAction={async (formData) => {"use server"; return createInventoryUnitFromScan(formData);}} outboundLinkAction={async (formData) => {"use server"; return linkInventoryUnitToOutbound(formData);}} /></div>;
}
