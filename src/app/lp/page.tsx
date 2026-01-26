"use client";

import Image from "next/image";
import { useEffect } from "react";

const HERO_IMAGE_SRC = "/lp/hero.jpg";
const HERO_VIDEO_SRC = "/lp/hero.mp4";

const OPPORTUNITY_CARDS = [
  {
    title: "オンライン問い合わせ",
    lead: "電話がつながらない時の“受付窓口”として使えます",
    points: [
      "営業時間外でも問い合わせを残せます",
      "条件・台数を先に共有できるので、折り返しが早い",
      "※ 取引は電話のままでもOK",
    ],
    href: "/signup",
    linkLabel: "詳しく見る",
  },
  {
    title: "即決売買",
    lead: "条件が合う相手とは、確認の手間を減らして進められます",
    points: [
      "価格・台数・エリアなど条件が合えばそのまま成約",
      "“確認待ち”が減り、タイミングを逃しにくい",
      "※ 即決を強制しません（必要な時だけ）",
    ],
    href: "/signup",
    linkLabel: "詳しく見る",
  },
] as const;

const NOTIFY_ITEMS = [
  { title: "新着出品", body: "P北斗の拳9　¥350,000　/　5台", time: "1分前" },
  { title: "成約情報", body: "L押忍！番長4　¥250,000　/　10台", time: "5分前" },
  { title: "成約情報", body: "e牙狼　¥130,000　/　8台", time: "30分前" },
];

const COST_CARDS = [
  { title: "月額利用料", value: "無料" },
  { title: "初期費用", value: "なし" },
  { title: "契約縛り", value: "なし" },
];

const FLOW_STEPS = [
  { step: "1", title: "無料登録" },
  { step: "2", title: "基本情報・通知設定" },
  { step: "3", title: "いつものやり方で取引開始" },
];

const NAVI_FEATURES = [
  { title: "取引の進捗管理", body: "やり取りと状況をひと目で確認できます" },
  { title: "履歴管理", body: "後から経緯を追えるので引き継ぎも安心です" },
  { title: "社内共有", body: "担当が変わっても同じ情報で進められます" },
] as const;


function DotPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {/* 右寄せの薄ドット（全面敷きNGのルールに合わせて） */}
      <div className="absolute -right-24 top-0 h-[520px] w-[720px] opacity-[0.12]">

        <svg viewBox="0 0 400 300" className="h-full w-full">
          <defs>
            <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#dots)" className="text-slate-900" />
        </svg>
      </div>
    </div>
  );
}

export default function LpPage() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10%" }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7FBFD] via-white to-[#F7FBFD]">
        <DotPattern />

        <div className="absolute inset-0">
          {/* 背景画像/動画は “主張しない” 方向。無ければグラデのみでも成立 */}
          <div className="absolute inset-0">
            <video
              className="h-full w-full object-cover opacity-0 lg:opacity-100"
              autoPlay
              muted
              loop
              playsInline
              poster={HERO_IMAGE_SRC}
            >
              <source src={HERO_VIDEO_SRC} type="video/mp4" />
            </video>
            <div className="absolute inset-0 lg:hidden">
              <Image src={HERO_IMAGE_SRC} alt="" fill priority className="object-cover" />
            </div>
            {/* 明るく・静かに整えるための薄いオーバーレイ */}
            <div className="absolute inset-0 bg-white/70" aria-hidden="true" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-2xl space-y-8" data-reveal>
            

            <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              今お使いの取引方法は、
              <br />
              そのままで。
            </h1>

            <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
  電話での問い合わせを中心に、
  <br />
  必要なところだけオンラインも使える
  <br />
  中古パチンコ・スロット売買プラットフォーム。
</p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/signup"
                className="rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
              >
                無料で登録する
              </a>
              <a
                href="/listings"
                className="rounded-full border border-slate-300 bg-white/70 px-8 py-4 text-base font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                出品一覧を見る
              </a>
            </div>
          </div>
        </div>
      </section>





{/* HERO直下：今まで通り補強 + 取引ナビ（同一セクション） */}
<section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F7FBFD]">
  <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-24 lg:py-32">
    {/* 上段：補強（センター） */}
    <div className="mx-auto max-w-3xl text-center" data-reveal>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
        今まで通りの取引に、使えます
      </h2>
      <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
        電話でのやり取りを中心に、
        <br />
        必要なところだけオンラインも使えます。
      </p>
    </div>

    {/* 区切り（同じ章の中の段落切替） */}
    <div className="mx-auto mt-16 max-w-5xl" aria-hidden="true">
      <div className="h-px w-full bg-slate-200/70" />
    </div>

    {/* 下段：取引ナビ */}
    <div className="mt-16 space-y-10" data-reveal>
      <div className="space-y-3">
        <h3 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          ナビ機能（標準搭載）
        </h3>
        
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {NAVI_FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-200 bg-white p-8
                       shadow-[0_14px_36px_rgba(15,23,42,0.15)]
hover:shadow-[0_18px_44px_rgba(15,23,42,0.19)]"
          >            
            <p className="mt-4 text-lg font-semibold text-slate-900">{f.title}</p>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>



      {/* きっかけ（画像背景） */}
<section className="relative overflow-hidden border-t border-slate-200/70 lg:min-h-[92vh]">
  {/* 背景画像 */}
  <div className="absolute inset-0">
    <Image
      src="/lp/opportunity.jpg"
      alt=""
      fill
      className="object-cover"
      priority={false}
    />
    {/* 読みやすさ用の薄いオーバーレイ（白寄せ） */}
    <div className="absolute inset-0 bg-white/70" />
    {/* ほんのり色味（青ベタじゃなく“空気感”だけ足す） */}
    <div className="absolute inset-0 bg-[#E6F2F7]/40 mix-blend-multiply" />
  </div>

  {/* 中身 */}
  <div className="relative mx-auto w-full max-w-7xl space-y-12 px-6 py-20 sm:py-24 lg:py-32">
    <div className="max-w-3xl space-y-4" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        取引のきっかけを、逃さないために
      </h2>
    </div>

    <div className="grid gap-10 lg:grid-cols-2" data-reveal>
      {OPPORTUNITY_CARDS.map((card) => (
        <div
          key={card.title}
          className="group rounded-2xl border border-slate-200 bg-white/95 p-10
                     shadow-[0_14px_36px_rgba(15,23,42,0.10)]
                     backdrop-blur-[2px]
                     transition hover:-translate-y-0.5 hover:border-slate-300
                     hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
        >
          <h3 className="text-2xl font-semibold text-slate-900">{card.title}</h3>

          <p className="mt-3 text-base font-semibold leading-relaxed text-slate-700 sm:text-lg">
            {card.lead}
          </p>

          <ul className="mt-5 space-y-3 text-base leading-relaxed text-slate-600">
            {card.points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span
                  className="mt-[3px] inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <a
              href={card.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F7F8E] hover:underline"
            >
              {card.linkLabel}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* 通知（LINE風） */}
<section className="bg-white border-t border-slate-200/70">
  <div className="mx-auto w-full max-w-7xl space-y-14 px-6 py-24 lg:py-28">
    {/* 見出し＋説明 */}
    <div className="max-w-3xl space-y-4" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        探さなくても、情報が届きます
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        新着出品・成約情報を、LINEで受け取れます。<br />
      </p>
    </div>

    {/* LINEトーク風カード */}
    <div
      className="rounded-3xl border border-slate-200 bg-[#DCEAF8] p-10 shadow-sm lg:p-14"
      data-reveal
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {NOTIFY_ITEMS.map((item) => (
          <div
            key={item.title}
            className="relative flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm"
          >
            {/* 吹き出しのしっぽ */}
            <span className="absolute -left-2 top-6 h-4 w-4 rotate-45 bg-white" />

            {/* 送信元アイコン（Pachimart） */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDEAF6] text-sm font-bold text-slate-600">
              P
            </div>

            {/* 本文 */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#06C755]">
                {item.title}
              </p>
              <p className="mt-1 text-base text-slate-700">
                {item.body}
              </p>
            </div>

            {/* 時刻 */}
            <span className="mt-1 text-xs font-medium text-slate-400">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* 補足 */}
    <p className="text-sm text-slate-500">
      ※ LINE通知は任意です。事前に登録した機種の情報が通知されます。
    </p>
  </div>
</section>

      {/* コスト */}
      <section className="bg-[#F7FBFD] border-t border-slate-200/70">

        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              まずは、費用をかけずに使えます
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3" data-reveal>
            {COST_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm"
              >
                <p className="text-base font-semibold text-slate-500">{card.title}</p>
                <p className="mt-6 text-5xl font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* フロー */}
      <section className="bg-white border-t border-slate-200/70">

        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              導入フロー
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center gap-10 text-center lg:flex-row" data-reveal>
            {FLOW_STEPS.map((step, index) => (
              <div key={step.step} className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl font-semibold text-slate-700 shadow-sm">
                    {step.step}
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900 sm:text-lg">
                    {step.title}
                  </p>
                </div>
                {index < FLOW_STEPS.length - 1 && (
                  <span className="hidden text-3xl text-slate-300 lg:inline">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

     {/* Contact CTA */}
<section className="relative overflow-hidden">
  {/* 背景 */}
  <div className="absolute inset-0">
    <Image
      src="/lp/city.jpg"
      alt=""
      fill
      className="object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#3AA6BF]/55 via-[#5CB8CC]/45 to-[#6EC6D6]/55 mix-blend-multiply" />
  </div>

  {/* 中身 */}
  <div className="relative mx-auto w-full max-w-7xl px-6 py-28 lg:py-36 text-center text-white">
    <div className="space-y-6" data-reveal>
      <h2 className="text-4xl font-semibold tracking-wide sm:text-5xl">
        Contact
      </h2>
      <p className="text-sm tracking-widest text-white/90">
        お問い合わせ
      </p>

      <p className="mt-4 text-base sm:text-lg">
        パチマートに関するご質問・ご相談はこちらから
      </p>

      {/* CTA群 */}
      <div className="mt-12 flex flex-wrap justify-center gap-4">
        {/* メイン：お問い合わせ */}
        <a
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-[#F39A2D] px-12 py-4 text-base font-semibold text-white shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:bg-[#EE8E1E]"
        >
          お問い合わせ
        </a>

        {/* サブ：無料登録 */}
        <a
          href="/signup"
          className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-semibold text-slate-900 shadow-md shadow-black/20 transition hover:-translate-y-0.5"
        >
          無料で登録する
        </a>

        {/* サブ：出品一覧 */}
        <a
          href="/listings"
          className="inline-flex items-center justify-center rounded-full border border-white/70 px-10 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white"
        >
          出品一覧を見る
        </a>
      </div>
    </div>
  </div>
</section>


      <style jsx>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 600ms ease 120ms, transform 600ms ease 120ms;
        }
        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
