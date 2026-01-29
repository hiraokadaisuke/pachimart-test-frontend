import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";

export default function InventorySettingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar title="設定" description="出入番頭の設定メニューです。" />
      <div className="mt-4">
        <InventoryPanel title="システム設定" description="準備中です。">
          <p className="text-xs text-slate-600">設定項目は順次追加されます。</p>
        </InventoryPanel>
      </div>
    </div>
  );
}
