import { redirect } from "next/navigation";

import { InboundScheduleForm } from "@/components/inventory/schedule/InboundScheduleForm";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { createInboundSchedule, getInventoryFormMasters, getInventoryItems } from "@/features/inventory/server";

export default async function NewInboundPage() {
  const [masters, inventoryItems] = await Promise.all([getInventoryFormMasters(), getInventoryItems()]);
  async function action(formData: FormData) {"use server"; await createInboundSchedule(formData); redirect('/inventory/inbound'); }
  return <div className="mx-auto max-w-4xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">入庫予定を登録</h1>
    <InboundScheduleForm action={action} storageLocations={masters.storageLocations} inventoryItems={inventoryItems} submitLabel="登録する" />
  </div>;
}
