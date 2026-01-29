import { redirect } from "next/navigation";

export default function InventoryPage() {
  redirect("/inventory/items?type=stock");
}
