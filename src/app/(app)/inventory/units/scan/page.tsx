import { redirect } from "next/navigation";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { InventoryUnitScanForm } from "@/components/inventory/InventoryUnitScanForm";
import { createInventoryUnitFromScan, getInventoryUnitScanOptions, linkInventoryUnitToOutbound, parseUnitScanInput } from "@/features/inventory/server";

export default async function InventoryUnitScanPage() {
  const scanOptions = await getInventoryUnitScanOptions();
  return <div className="mx-auto max-w-3xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="mb-4 text-2xl font-bold">個体スキャン登録</h1><InventoryUnitScanForm scanOptions={scanOptions} parseAction={async (formData) => {"use server"; return parseUnitScanInput(formData);}} createAction={async (formData) => {"use server"; await createInventoryUnitFromScan(formData); redirect("/inventory/units/scan");}} outboundLinkAction={async (formData) => {"use server"; await linkInventoryUnitToOutbound(formData); redirect("/inventory/units/scan");}} /></div>;
}
