import { redirect } from "next/navigation";

import { OutboundScheduleForm } from "@/components/inventory/schedule/OutboundScheduleForm";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { createOutboundSchedule, getInventoryFormMasters, getInventoryItems } from "@/features/inventory/server";

export default async function NewOutboundPage() {
  const [masters, inventoryItems] = await Promise.all([getInventoryFormMasters(), getInventoryItems()]);
  async function action(formData: FormData) {"use server"; await createOutboundSchedule(formData); redirect('/inventory/outbound'); }
  return <div className="mx-auto max-w-4xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">出庫予定を登録</h1>
    <OutboundScheduleForm action={action} storageLocations={masters.storageLocations} inventoryItems={inventoryItems} submitLabel="登録する" />
  </div>;
}
