import { InventoryWorkflowBoard } from "@/components/inventory/InventoryWorkflowBoard";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";

export default function InventoryPage() {
  return (
    <div className="space-y-6 bg-gray-50">
      <InventoryWorkflowBoard />
      <InventoryDashboard />
    </div>
  );
}
