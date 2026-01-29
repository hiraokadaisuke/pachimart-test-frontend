import Link from "next/link";

import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import MyPageLayout from "@/components/layout/MyPageLayout";

export default function NewExhibitPage() {
  return (
    <MyPageLayout subTabs={<ExhibitSubTabs activeTab="new" />} compact>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">種別を選択</h1>
            <p className="text-sm text-neutral-700">出品する機種の種別を選んでください。</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/market/mypage/exhibits/new/pachinko"
              className="rounded-lg border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              パチンコ
            </Link>
            <Link
              href="/market/mypage/exhibits/new/slot"
              className="rounded-lg border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              スロット
            </Link>
          </div>
        </div>
      </div>
    </MyPageLayout>
  );
}
