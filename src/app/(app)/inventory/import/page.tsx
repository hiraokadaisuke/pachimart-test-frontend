import Link from "next/link";

import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";

const importEntries = [
  {
    title: "手入力で登録（PC）",
    description: "入力フォームで確定登録を行います。",
    href: "/inventory/import/manual",
  },
  {
    title: "QRで仮登録（スマホ）",
    description: "QR文字列を仮登録として記録します。",
    href: "/inventory/import/qr",
  },
  {
    title: "仮登録の補完・確定（PC）",
    description: "仮登録一覧を補完して在庫へ反映します。",
    href: "/inventory/import/review",
  },
];

export default function InventoryImportHubPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar
        title="取込ハブ"
        description="在庫取込の入口を選択してください。"
      />

      <div className="mt-4">
        <InventoryPanel
          title="取込入口メニュー"
          description="出入番頭の業務フローに沿って入口を選択します。"
        >
          <ul className="divide-y divide-slate-200 text-sm">
            {importEntries.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{entry.description}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-400" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </InventoryPanel>
      </div>
    </div>
  );
}
