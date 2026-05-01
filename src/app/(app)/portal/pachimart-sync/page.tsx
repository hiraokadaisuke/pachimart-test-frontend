import Link from "next/link";
import { ArrowDown } from "lucide-react";

const STEPS = [
  "① パチマートで購入・売却",
  "② 取引情報を販売管理へ反映",
  "③ 倉庫在庫へ自動登録",
  "④ 在庫から再出品",
];

export default function PachimartSyncPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">パチマート連携デモ</h1>
          <p className="mt-3 text-sm text-slate-600">取引データが販売管理・在庫管理へ連携され、再出品まで繋がる流れを視覚化しています。</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            {STEPS.map((step, idx) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-full rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-center font-semibold text-cyan-900">{step}</div>
                {idx < STEPS.length - 1 ? <ArrowDown className="my-2 h-4 w-4 text-slate-400" /> : null}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link href="/portal/sales" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              販売管理デモを開く
            </Link>
            <Link href="/portal/inventory" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              倉庫・在庫デモを開く
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
