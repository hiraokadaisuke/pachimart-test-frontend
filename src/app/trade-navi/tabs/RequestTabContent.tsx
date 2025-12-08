"use client";

export function RequestTabContent() {
  return (
    <section className="space-y-4 rounded border border-dashed border-slate-300 bg-white p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">依頼入力</h2>
        <p className="text-sm text-neutral-800">
          取引依頼を作成するフォームをここに配置予定です。現状はダミーの入力欄です。
        </p>
      </div>

      <form className="space-y-3 text-sm text-neutral-900">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-neutral-800">取引先</span>
            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="例）株式会社パチテック"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-neutral-800">物件名</span>
            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="例）P スーパー海物語 JAPAN2 L1"
            />
          </label>
        </div>
        <label className="space-y-1">
          <span className="block text-xs font-semibold text-neutral-800">メモ</span>
          <textarea
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="取引の補足メモを入力してください"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-slate-50"
          >
            下書きを保存
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            依頼内容を確認
          </button>
        </div>
      </form>
    </section>
  );
}
