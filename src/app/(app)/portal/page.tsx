import Link from "next/link";
import { Boxes, ClipboardList, QrCode, RefreshCw } from "lucide-react";

const PORTAL_MODULES = [
  {
    title: "販売管理",
    description: "パチマート取引を起点に売上・仕入データを一覧で管理します。",
    href: "/portal/sales",
    icon: ClipboardList,
  },
  {
    title: "倉庫・在庫",
    description: "倉庫在庫の状況を確認し、そのままパチマートへ再出品できます。",
    href: "/portal/inventory",
    icon: Boxes,
  },
  {
    title: "パチマート連携デモ",
    description: "購入・売却から販売管理、在庫登録、再出品までの流れを可視化します。",
    href: "/portal/pachimart-sync",
    icon: RefreshCw,
  },
  {
    title: "QR読取デモ",
    description: "QR読取から機械情報表示までを営業先向けにデモできます。",
    href: "/portal/qr-demo",
    icon: QrCode,
  },
] as const;

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:mb-10 md:p-8">
          <p className="text-sm font-semibold tracking-wide text-cyan-700">PACHIMART PORTAL DEMO</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">パチマート営業デモ管理画面</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            販売管理・倉庫在庫・パチマート連携・QR読取を横断して、営業先に一連の運用フローを分かりやすく提示できます。
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PORTAL_MODULES.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                href={module.href}
                key={module.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-600 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{module.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
