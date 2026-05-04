import { notFound, redirect } from "next/navigation";

import { getInventoryFormMasters, getInventoryItemById, parseInventoryFormData, updateInventoryItem } from "@/features/inventory/server";

import { InventoryItemForm } from "../../InventoryItemForm";

export default async function EditInventoryItemPage({ params }: { params: { id: string } }) {
  const item = await getInventoryItemById(params.id);
  if (!item) notFound();
  const masters = await getInventoryFormMasters();

  async function updateAction(formData: FormData) {
    "use server";
    const parsed = parseInventoryFormData(formData);
    if (!parsed.data) throw new Error(parsed.errors.join("\n"));
    const updated = await updateInventoryItem(params.id, parsed.data);
    if (!updated) notFound();
    redirect(`/inventory/items/${params.id}`);
  }

  return <InventoryItemForm action={updateAction} makers={masters.makers} machineModels={masters.machineModels} storageLocations={masters.storageLocations} item={item} submitLabel="在庫情報を保存" />;
}
