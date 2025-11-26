"use client";

import { FormEvent, useMemo, useState } from "react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-6 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-800">
      {title}
    </h2>
    <div className="space-y-6 text-sm text-slate-700">{children}</div>
  </section>
);

const FieldRow = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-6">
    <div className="md:w-1/3">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span>{label}</span>
        {required ? <span className="text-xs font-medium text-red-500">必須</span> : null}
      </label>
    </div>
    <div className="flex-1 space-y-2">{children}</div>
  </div>
);

export default function SellPage() {
  const [quantity, setQuantity] = useState<number | "">(1);
  const [price, setPrice] = useState<number | "">(0);

  const totals = useMemo(() => {
    const qty = typeof quantity === "number" ? quantity : 0;
    const basePrice = typeof price === "number" ? price : 0;
    const subtotal = basePrice * qty;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return {
      quantity: qty,
      subtotal,
      total,
    };
  }, [price, quantity]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-slate-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Section title="基本情報">
              <FieldRow label="販売方法" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="saleType" className="h-4 w-4" defaultChecked />
                    <span>オファー型（推奨）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="saleType" className="h-4 w-4" />
                    <span>即決型</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="回答期限" required>
                <select className="w-full rounded border border-slate-200 px-3 py-2">
                  <option>30分</option>
                  <option>1時間</option>
                  <option>3時間</option>
                  <option>6時間</option>
                  <option>12時間</option>
                </select>
              </FieldRow>

              <FieldRow label="種別" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" className="h-4 w-4" defaultChecked />
                    <span>本体</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" className="h-4 w-4" />
                    <span>枠のみ</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" className="h-4 w-4" />
                    <span>セルのみ</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="メーカー" required>
                <select className="w-full rounded border border-slate-200 px-3 py-2">
                  <option>メーカーA</option>
                  <option>メーカーB</option>
                  <option>メーカーC</option>
                </select>
              </FieldRow>

              <FieldRow label="機種名" required>
                <input
                  type="text"
                  className="w-full rounded border border-slate-200 px-3 py-2"
                  placeholder="機種名を入力"
                />
              </FieldRow>

              <FieldRow label="枠色">
                <select className="w-full rounded border border-slate-200 px-3 py-2">
                  <option>枠色を選択してください</option>
                  <option>赤</option>
                  <option>青</option>
                  <option>黒</option>
                </select>
              </FieldRow>

              <FieldRow label="出品数" required>
                <input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(Number.isNaN(value) ? "" : value);
                  }}
                  className="w-full rounded border border-slate-200 px-3 py-2"
                />
              </FieldRow>

              <FieldRow label="販売単価（税抜）" required>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPrice(Number.isNaN(value) ? "" : value);
                  }}
                  className="w-full rounded border border-slate-200 px-3 py-2"
                />
              </FieldRow>

              <FieldRow label="応相談">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <span>応相談</span>
                </label>
              </FieldRow>
            </Section>

            <Section title="配送・出庫・条件">
              <FieldRow label="送料" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="shipping" className="h-4 w-4" defaultChecked />
                    <span>1個口（1台につき1個口分）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="shipping" className="h-4 w-4" />
                    <span>2個口</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="出庫手数料" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="handlingFee" className="h-4 w-4" defaultChecked />
                    <span>1個口（1台につき1個口分）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="handlingFee" className="h-4 w-4" />
                    <span>2個口</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="バラ売り" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="separateSale" className="h-4 w-4" defaultChecked />
                    <span>可</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="separateSale" className="h-4 w-4" />
                    <span>不可</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="釘シート" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="kugiSheet" className="h-4 w-4" defaultChecked />
                    <span>なし</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="kugiSheet" className="h-4 w-4" />
                    <span>あり</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="取扱説明書" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="manual" className="h-4 w-4" defaultChecked />
                    <span>なし</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="manual" className="h-4 w-4" />
                    <span>あり</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="引き取り" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pickup" className="h-4 w-4" defaultChecked />
                    <span>可</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pickup" className="h-4 w-4" />
                    <span>不可</span>
                  </label>
                </div>
              </FieldRow>
            </Section>

            <Section title="日付・倉庫・備考">
              <FieldRow label="撤去日" required>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="removalStatus" className="h-4 w-4" defaultChecked />
                      <span>未撤去</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="removalStatus" className="h-4 w-4" />
                      <span>撤去済</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800">
                      「撤去日」を指定してください（必須）
                    </label>
                    <input type="date" className="w-full rounded border border-slate-200 px-3 py-2" />
                  </div>
                </div>
              </FieldRow>

              <FieldRow label="発送指定日" required>
                <div className="space-y-2">
                  <select className="w-full rounded border border-slate-200 px-3 py-2">
                    <option>できるだけ早く</option>
                    <option>3日後</option>
                    <option>1週間後</option>
                  </select>
                  <p className="text-xs text-slate-500">※発送可能日は余裕をもった設定でお願いします。</p>
                </div>
              </FieldRow>

              <FieldRow label="保管先倉庫" required>
                <select className="w-full rounded border border-slate-200 px-3 py-2">
                  <option>倉庫A</option>
                  <option>倉庫B</option>
                  <option>倉庫C</option>
                </select>
              </FieldRow>

              <FieldRow label="備考欄">
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    className="w-full rounded border border-slate-200 px-3 py-2"
                    placeholder="備考を入力"
                  />
                  <p className="text-xs text-slate-500">
                    ※年末年始、GWなどの長期休暇で発送できない日がある場合は、備考欄に記載をお願いします。
                  </p>
                </div>
              </FieldRow>
            </Section>

            <Section title="不備詳細">
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-800">不備詳細画像アップロード</h3>
                <div className="flex flex-col gap-2 rounded border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  <p>ここにjpgファイルをドラッグ＆ドロップ または クリックしてjpgファイルを選択</p>
                  <input type="file" accept="image/jpeg" multiple className="mx-auto w-full max-w-md text-sm" />
                  <div className="text-xs text-slate-500">
                    <p>最大アップロード枚数：3枚</p>
                    <p>アップロード済みのファイルはありません</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">不備詳細のコメント</label>
                  <textarea rows={4} className="w-full rounded border border-slate-200 px-3 py-2" />
                </div>
              </div>
            </Section>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                className="rounded border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded bg-sky-500 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-600"
              >
                入力内容を確認する
              </button>
            </div>
          </form>
        </div>

        <aside className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-10">
          <h3 className="text-base font-semibold text-slate-800">サマリー</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">出品数合計</span>
              <span className="font-semibold text-slate-900">{totals.quantity}台</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">販売価格（税抜）合計</span>
              <span className="font-semibold text-slate-900">{totals.subtotal.toLocaleString()}円</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">販売価格（税込）合計</span>
              <span className="font-semibold text-slate-900">{totals.total.toLocaleString()}円</span>
            </div>
            <p className="text-xs text-slate-500">※税率10%で計算された概算金額です。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
