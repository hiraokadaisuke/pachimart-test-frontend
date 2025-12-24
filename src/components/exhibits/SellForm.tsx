"use client";

import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";

type SellFormProps = {
  showHeader?: boolean;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-6 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-800">{title}</h2>
    <div className="space-y-6 text-sm text-neutral-900">{children}</div>
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
  const router = useRouter();
  const currentUser = useCurrentDevUser();

  const [kind, setKind] = useState("本体");
  const [maker, setMaker] = useState("メーカーA");
  const [machineName, setMachineName] = useState("");
  const [frameColor, setFrameColor] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [price, setPrice] = useState<number | "">("");
  const [isNegotiable, setIsNegotiable] = useState(false);

  const [shippingFeeCount, setShippingFeeCount] = useState(1);
  const [handlingFeeCount, setHandlingFeeCount] = useState(1);
  const [allowPartial, setAllowPartial] = useState<boolean>(true);

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => {
    const qty = typeof quantity === "number" ? quantity : 0;
    const basePrice = typeof price === "number" && !isNegotiable ? price : 0;
    const subtotal = basePrice * qty;

    return {
      quantity: qty,
      subtotal,
    };
  }, [price, quantity, isNegotiable]);

  const storageLocation = [storeName, address, prefecture, city].filter(Boolean).join(" ");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!machineName.trim()) {
      setSubmitError("機種名を入力してください。");
      return;
    }

    if (!storageLocation.trim()) {
      setSubmitError("保管場所を入力してください。");
      return;
    }

    if (!isNegotiable && (typeof price !== "number" || Number.isNaN(price))) {
      setSubmitError("販売単価（税抜）を入力してください。");
      return;
    }

    if (typeof quantity !== "number" || Number.isNaN(quantity) || quantity <= 0) {
      setSubmitError("出品数を入力してください。");
      return;
    }

    const noteParts = [frameColor ? `枠色:${frameColor}` : null, note.trim() || null].filter(
      (value): value is string => Boolean(value)
    );

    const payload = {
      kind,
      maker,
      machineName: machineName.trim(),
      quantity,
      unitPriceExclTax: isNegotiable ? null : (price as number),
      isNegotiable,
      storageLocation,
      shippingFeeCount,
      handlingFeeCount,
      allowPartial,
      note: noteParts.length > 0 ? noteParts.join(" / ") : null,
      status: "PUBLISHED",
      isVisible: true,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-user-id": currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create listing: ${response.status}`);
      }

      router.push("/mypage/exhibits");
    } catch (error) {
      console.error("Failed to create listing", error);
      setSubmitError("出品の登録に失敗しました。入力内容を確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-neutral-900">
      {showHeader && (
        <div>
          <h1 className="text-xl font-bold text-slate-900">新規出品</h1>
          <p className="mt-2 text-sm text-neutral-900">
            出品内容を入力して登録すると、出品一覧と商品一覧に反映されます。
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
                    <input
                      type="radio"
                      name="type"
                      className="h-4 w-4"
                      checked={kind === "本体"}
                      onChange={() => setKind("本体")}
                    />
                    <span>本体</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      className="h-4 w-4"
                      checked={kind === "枠のみ"}
                      onChange={() => setKind("枠のみ")}
                    />
                    <span>枠のみ</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      className="h-4 w-4"
                      checked={kind === "セルのみ"}
                      onChange={() => setKind("セルのみ")}
                    />
                    <span>セルのみ</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="メーカー" required>
                <select
                  className="w-full rounded border border-slate-200 px-3 py-2"
                  value={maker}
                  onChange={(event) => setMaker(event.target.value)}
                >
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
                  value={machineName}
                  onChange={(event) => setMachineName(event.target.value)}
                />
              </FieldRow>

              <FieldRow label="枠色">
                <select
                  className="w-full rounded border border-slate-200 px-3 py-2"
                  value={frameColor}
                  onChange={(event) => setFrameColor(event.target.value)}
                >
                  <option value="">枠色を選択してください</option>
                  <option value="赤">赤</option>
                  <option value="青">青</option>
                  <option value="黒">黒</option>
                </select>
              </FieldRow>

              <FieldRow label="出品数" required>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(Number.isNaN(value) ? "" : value);
                  }}
                  className="w-full rounded border border-slate-200 px-3 py-2"
                />
              </FieldRow>

              <FieldRow label="販売単価（税抜）" required={!isNegotiable}>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPrice(Number.isNaN(value) ? "" : value);
                  }}
                  className={`w-full rounded border px-3 py-2 ${
                    isNegotiable ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200"
                  }`}
                  disabled={isNegotiable}
                />
              </FieldRow>

              <FieldRow label="応相談">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={isNegotiable}
                    onChange={(event) => setIsNegotiable(event.target.checked)}
                  />
                  <span>応相談</span>
                </label>
              </FieldRow>
            </Section>

            <Section title="配送・出庫・条件">
              <FieldRow label="送料回数" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shipping"
                      className="h-4 w-4"
                      checked={shippingFeeCount === 1}
                      onChange={() => setShippingFeeCount(1)}
                    />
                    <span>1個口（1台につき1個口分）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shipping"
                      className="h-4 w-4"
                      checked={shippingFeeCount === 2}
                      onChange={() => setShippingFeeCount(2)}
                    />
                    <span>2個口</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="出庫手数料回数" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="handlingFee"
                      className="h-4 w-4"
                      checked={handlingFeeCount === 1}
                      onChange={() => setHandlingFeeCount(1)}
                    />
                    <span>1個口（1台につき1個口分）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="handlingFee"
                      className="h-4 w-4"
                      checked={handlingFeeCount === 2}
                      onChange={() => setHandlingFeeCount(2)}
                    />
                    <span>2個口</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="バラ売り" required>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="separateSale"
                      className="h-4 w-4"
                      checked={allowPartial}
                      onChange={() => setAllowPartial(true)}
                    />
                    <span>可</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="separateSale"
                      className="h-4 w-4"
                      checked={!allowPartial}
                      onChange={() => setAllowPartial(false)}
                    />
                    <span>不可</span>
                  </label>
                </div>
              </FieldRow>

              <FieldRow label="搬出日">
                <input type="date" className="w-full rounded border border-slate-200 px-3 py-2" />
              </FieldRow>

              <FieldRow label="保管場所" required>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="店舗名"
                      className="rounded border border-slate-200 px-3 py-2"
                      required
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="住所"
                      className="rounded border border-slate-200 px-3 py-2"
                      required
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="都道府県"
                      className="rounded border border-slate-200 px-3 py-2"
                      value={prefecture}
                      onChange={(event) => setPrefecture(event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="市区町村"
                      className="rounded border border-slate-200 px-3 py-2"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    className="w-full rounded border border-slate-200 px-3 py-2"
                    placeholder="備考を入力"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </FieldRow>
            </Section>

            <Section title="写真">
              <FieldRow label="外観写真">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((slot) => (
                    <label
                      key={slot}
                      className="flex aspect-[4/3] cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-neutral-500"
                    >
                      <span>+ 画像追加</span>
                      <input type="file" className="hidden" disabled />
                    </label>
                  ))}
                </div>
              </FieldRow>

              <FieldRow label="動画">
                <label className="flex h-24 cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-neutral-500">
                  <span>+ 動画を追加</span>
                  <input type="file" className="hidden" disabled />
                </label>
              </FieldRow>
            </Section>

            <Section title="注意事項">
              <div className="space-y-3 text-sm leading-relaxed text-neutral-900">
                <p>出品内容を確認のうえ登録してください。</p>
                <p>フォームの入力状態はこの画面内でのみ保持され、他ページへ移動するとクリアされます。</p>
              </div>
            </Section>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-neutral-700">合計 {totals.quantity} 台</p>
                  <p className="text-xl font-bold text-slate-900">
                    {isNegotiable || typeof price !== "number" ? "応相談" : `${totals.subtotal.toLocaleString()} 円`}
                  </p>
                  <p className="text-xs text-neutral-700">
                    税抜小計 {isNegotiable || typeof price !== "number" ? "-" : `${totals.subtotal.toLocaleString()} 円`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {submitError && <p className="text-xs text-rose-600">{submitError}</p>}
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "登録中..." : "この内容で出品する"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">取引の流れ</h3>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-neutral-900">
              <li>出品内容を入力し、掲載を開始</li>
              <li>購入希望者とマッチングし条件調整</li>
              <li>合意後に取引確定し出荷手配</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">ヒント</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-900">
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
