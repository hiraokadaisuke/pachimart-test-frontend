import type { InventoryItem, Maker, MachineModel, StorageLocation } from "@prisma/client";

import { getInventoryItems } from "@/features/inventory/server";
import {
  inventoryItemTypeLabel,
  inventoryListingStatusLabel,
  inventoryStatusLabel,
} from "@/features/inventory/labels";

import ItemsClient from "./ItemsClient";

type InventoryItemWithRelations = InventoryItem & {
  maker: Maker | null;
  machineModel: MachineModel | null;
  storageLocation: StorageLocation | null;
};

export default async function InventoryItemsPage() {
  const items = (await getInventoryItems()) as InventoryItemWithRelations[];
  const rows = items.map((item: InventoryItemWithRelations) => ({
    id: item.id,
    type: inventoryItemTypeLabel(item.itemType),
    manufacturer: item.maker?.name ?? item.makerNameSnapshot ?? "-",
    modelName: item.machineModel?.name ?? item.modelNameSnapshot,
    frameColor: item.frameColor ?? "-",
    quantity: item.quantityOnHand,
    storageLocation: item.storageLocation?.name ?? "-",
    purchasePrice: item.purchaseUnitPrice ?? 0,
    plannedSalePrice: item.plannedSaleUnitPrice ?? 0,
    status: inventoryStatusLabel(item.inventoryStatus),
    listingStatus: inventoryListingStatusLabel(item.listingStatus),
  }));

  return <ItemsClient rows={rows} total={items.reduce((acc, item) => acc + item.quantityOnHand, 0)} />;
}
