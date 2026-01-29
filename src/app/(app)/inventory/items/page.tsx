import { Suspense } from "react";

import InventoryItemsClient from "./ItemsClient";

export default function InventoryItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-slate-600">
          読み込み中...
        </div>
      }
    >
      <InventoryItemsClient />
    </Suspense>
  );
}
