import Link from "next/link";

import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";

const TYPE_OPTIONS = [
  { key: "pachinko", label: "パチンコ" },
  { key: "slot", label: "スロット" },
];

export default function NewExhibitPage() {
  return (
    <div className="space-y-6">
      <ExhibitSubTabs activeTab="new" />

      <div className="mx-auto max-w-3xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">出品する種別を選択してください</h1>
        <p className="text-sm text-neutral-800">
          選択した種別に応じて入力できるメーカー・機種が絞り込まれます。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TYPE_OPTIONS.map((option) => (
            <Link
              key={option.key}
              href={`/mypage/exhibits/new/${option.key}`}
              className="flex items-center justify-center rounded-lg border border-slate-200 px-6 py-4 text-lg font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-700 hover:shadow"
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
