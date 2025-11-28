"use client";

import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";

type SellFormProps = {
  showHeader?: boolean;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-6 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-800">{title}</h2>
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
  children: ReactNode;
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

export function SellForm({ showHeader = true }: SellFormProps) {
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-slate-700">
      {showHeader && (
        <div>
          <h1 className="text-xl font-bold text-slate-900">新規出品</h1>
          <p className="mt-2 text-sm text-slate-700">
            ダミーの入力フォームです。実際の出品処理には接続していませんが、UI やバリデーションは本番を模しています。
          </p>
        </div>
      )}

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

              <FieldRow label="搬出日" required>
                <input type="date" className="w-full rounded border border-slate-200 px-3 py-2" />
              </FieldRow>

              <FieldRow label="搬出場所" required>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="店舗名"
                      className="rounded border border-slate-200 px-3 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="住所"
                      className="rounded border border-slate-200 px-3 py-2"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input type="text" placeholder="都道府県" className="rounded border border-slate-200 px-3 py-2" />
                    <input type="text" placeholder="市区町村" className="rounded border border-slate-200 px-3 py-2" />
                  </div>
                  <textarea
                    rows={3}
                    className="w-full rounded border border-slate-200 px-3 py-2"
                    placeholder="詳細や備考を入力"
                  />
                </div>
              </FieldRow>
            </Section>

            <Section title="写真">
              <FieldRow label="外観写真" required>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((slot) => (
                    <label
                      key={slot}
                      className="flex aspect-[4/3] cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400 hover:text-blue-500"
                    >
                      <span>+ 画像追加</span>
                      <input type="file" className="hidden" />
                    </label>
                  ))}
                </div>
              </FieldRow>

              <FieldRow label="動画">
                <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400 hover:text-blue-500">
                  <span>+ 動画を追加</span>
                  <input type="file" className="hidden" />
                </label>
              </FieldRow>
            </Section>

            <Section title="注意事項">
              <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                <p>
                  出品内容は確認後に保存されます。実際の取引はモックデータで処理されるため、金銭のやり取りは発生しません。
                </p>
                <p>フォームの入力状態はこの画面内でのみ保持され、他ページへ移動するとクリアされます。</p>
              </div>
            </Section>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">合計 {totals.quantity} 台</p>
                  <p className="text-xl font-bold text-slate-900">{totals.total.toLocaleString()} 円</p>
                  <p className="text-xs text-slate-500">税抜小計 {totals.subtotal.toLocaleString()} 円</p>
                </div>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  この内容で出品する
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">取引の流れ</h3>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-700">
              <li>出品内容を入力し、掲載を開始</li>
              <li>購入希望者とマッチングし条件調整</li>
              <li>合意後に取引確定し出荷手配</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">ヒント</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>写真は複数枚登録すると購入者に安心感を与えます。</li>
              <li>搬出場所や日程の備考を詳しく記載するとスムーズです。</li>
              <li>入力した内容はこの画面のみで保持され、ページ遷移でリセットされます。</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
