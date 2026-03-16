const actionButtons = [
  "機種を選んで作成",
  "ファイルを取り込んで作成",
  "下書き一覧を見る",
];

const placeholderCards = [
  {
    title: "機種選択から作成",
    description: "対象機種を選び、見積りのたたき台を作る導線を追加予定です。",
  },
  {
    title: "Excel / CSV 取込み",
    description: "フォーマット済みファイルを取り込み、見積りデータへ変換する機能を準備中です。",
  },
  {
    title: "見積り下書き一覧",
    description: "作成途中の見積りを保存し、再編集・出力できる一覧画面を追加予定です。",
  },
];

export default function EstimatePage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-8 text-neutral-900">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">簡単見積り</h1>
        <p className="text-sm text-neutral-700">
          複数機種の見積り前準備を、まとめて行うための画面です。今後、機種選択・ファイル取込み・出力機能を追加予定です。
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        {actionButtons.map((label) => (
          <button
            key={label}
            type="button"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            {label}
          </button>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {placeholderCards.map((card) => (
          <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{card.description}</p>
            <p className="mt-3 inline-flex rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">準備中</p>
          </article>
        ))}
      </section>
    </main>
  );
}
