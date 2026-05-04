import { redirect } from "next/navigation";

import { createInventoryItem, getInventoryFormMasters, parseInventoryFormData } from "@/features/inventory/server";

import { InventoryItemForm } from "../InventoryItemForm";

export default async function NewInventoryItemPage() {
  const masters = await getInventoryFormMasters();

  async function createAction(formData: FormData) {
    "use server";
    const parsed = parseInventoryFormData(formData);
    if (!parsed.data) throw new Error(parsed.errors.join("\n"));
    const created = await createInventoryItem(parsed.data);
    redirect(`/inventory/items/${created.id}`);
  }

  return <InventoryItemForm action={createAction} makers={masters.makers} machineModels={masters.machineModels} storageLocations={masters.storageLocations} submitLabel="在庫を登録する" />;
}
