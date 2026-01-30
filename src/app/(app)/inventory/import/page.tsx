import Link from "next/link";

export default function InventoryImportHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 pb-12 pt-8">
        <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Inventory Register
            </p>
            <h1 className="text-2xl font-semibold">在庫登録</h1>
            <p className="text-sm text-slate-300">登録方法を選んでください</p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <Link
              href="/inventory/import/qr"
              className="flex flex-col items-start gap-2 rounded-3xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-5 text-left shadow-lg transition hover:border-emerald-300"
            >
              <span className="text-lg font-semibold">QR読み取り</span>
              <span className="text-sm text-emerald-100">
                QRを複数回連続スキャン
              </span>
            </Link>
            <Link
              href="/inventory/import/text"
              className="flex flex-col items-start gap-2 rounded-3xl border border-slate-700 bg-slate-900 px-6 py-5 text-left shadow-lg transition hover:border-slate-500"
            >
              <span className="text-lg font-semibold">テキスト読み取り</span>
              <span className="text-sm text-slate-300">
                紙の番号をカメラで読み取り
              </span>
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            カメラが使えない方は各画面で文字列貼り付けが可能
          </p>
        </div>
      </div>
    </div>
  );
}
