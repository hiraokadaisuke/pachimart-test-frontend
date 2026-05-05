import { redirect, notFound } from "next/navigation";
import { InboundScheduleForm } from "@/components/inventory/schedule/InboundScheduleForm";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { getInboundScheduleById, getInventoryFormMasters, getInventoryItems, updateInboundSchedule } from "@/features/inventory/server";

export default async function EditInboundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [schedule, masters, inventoryItems] = await Promise.all([
    getInboundScheduleById(id),
    getInventoryFormMasters(),
    getInventoryItems(),
  ]);
  if (!schedule) notFound();
  const readOnly = schedule.status === "RECEIVED" || schedule.status === "CANCELED";
  const destinationMissing = !schedule.destinationLocationId;

  async function action(formData: FormData) {
    "use server";
    await updateInboundSchedule(id, formData);
    redirect("/inventory/inbound");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-2xl font-bold">入庫予定を編集</h1>
      {readOnly ? <p className="mt-3 text-sm text-amber-700">完了済みまたは取消済みの予定は編集できません</p> : null}
      {destinationMissing ? (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          入庫先未設定のままでは入庫完了できません。入庫先を設定すると、入庫完了できるようになります。
        </p>
      ) : null}
      <InboundScheduleForm
        action={action}
        storageLocations={masters.storageLocations}
        inventoryItems={inventoryItems}
        initial={schedule}
        readOnly={readOnly}
        submitLabel="保存する"
      />
    </div>
  );
}
