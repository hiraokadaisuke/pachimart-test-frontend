import { updateDefaultStorageLocation, getInventorySettingsData } from "@/features/inventory/server";
import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";

export default async function InventorySettingsPage() {
  const { storageLocations, defaultStorageLocationId } = await getInventorySettingsData();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar title="在庫設定" description="入庫予定の既定値を設定します。" />
      <div className="mt-4">
        <InventoryPanel title="既定倉庫" description="購入取引から自動作成される入庫予定の入庫先に利用されます。">
          <form action={updateDefaultStorageLocation} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700" htmlFor="storageLocationId">
              既定倉庫
            </label>
            <select
              id="storageLocationId"
              name="storageLocationId"
              defaultValue={defaultStorageLocationId ?? ""}
              className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">未設定</option>
              {storageLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <div>
              <Button type="submit">保存</Button>
            </div>
          </form>
        </InventoryPanel>
      </div>
    </div>
  );
}
