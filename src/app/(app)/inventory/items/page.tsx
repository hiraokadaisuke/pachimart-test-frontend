import Link from "next/link";

import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getInventoryItems } from "@/features/inventory/server";
import { formatCurrency, formatQuantity, inventoryItemTypeLabel, inventoryListingStatusLabel, inventoryStatusLabel } from "@/features/inventory/labels";

import ItemsClient from "./ItemsClient";

export default async function InventoryItemsPage() {
  const items = await getInventoryItems();
  const rows = items.map((item) => ({
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

  return <ItemsClient rows={rows} total={items.reduce((a,i)=>a+i.quantityOnHand,0)} />;
}
