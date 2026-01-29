"use client";

import Image from "next/image";
import { useEffect } from "react";
import { UserPlus, ClipboardList, Handshake } from "lucide-react";


const HERO_IMAGE_SRC = "/lp/hero.jpg";
const HERO_VIDEO_SRC = "/lp/hero.mp4";

const NEWS_ITEMS = [
  {
    type: "campaign",
    title: "体験キャンペーン実施中｜対象取引1台につき2,000円を進呈",
    href: "#campaign",
    isNew: true,
  },
  {
    type: "update",
    title: "ナビ機能を改善｜取引状況がより分かりやすくなりました",
    href: "/lp#navi",
    isNew: true,
  },
  {
    type: "info",
    title: "サービス拡大中につき、現在は月額無料で提供しています",
    href: "/signup",
    isNew: false,
  },
] as const;

const NEWS_TYPE = {
  campaign: { label: "キャンペーン", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70" },
  update: { label: "システム改善", badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70" },
  info: { label: "お知らせ", badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/70" },
} as const;


const OPPORTUNITY_CARDS = [
  {
    title: "オンライン問い合わせ",
    lead: "電話がつながらない時の“受付窓口”として使えます",
    points: [
      "営業時間外でも問い合わせを残せます",
      "条件・台数を先に共有できるので、折り返しが早い",
    ],
    
  },
  {
    title: "即決売買",
    lead: "条件が合う相手とは、確認の手間を減らして進められます",
    points: [
      "価格・台数・エリアなど条件が合えばそのまま成約",
      "“確認待ち”が減り、タイミングを逃しにくい",
    ],
    
  },
] as const;

const NOTIFY_ITEMS = [
  { title: "新着出品", body: "P北斗の拳9　¥350,000/5台", time: "1分前" },
  { title: "成約情報", body: "L押忍！番長4　¥250,000/10台", time: "5分前" },
  { title: "成約情報", body: "e牙狼　¥130,000/8台", time: "30分前" },
];

const COST_CARDS = [
  { title: "月額利用料", value: "無料" },
  { title: "初期導入・設定費用", value: "なし" },
  { title: "最低利用期間", value: "なし" },
];

const FLOW_STEPS = [
  {
    step: "1",
    title: "Webで無料登録",
    Icon: UserPlus,
    tone: { bg: "bg-emerald-50", fg: "text-emerald-700", ring: "ring-emerald-200/70" },
  },
  {
    step: "2",
    title: "基本情報を入力",
    Icon: ClipboardList,
    tone: { bg: "bg-sky-50", fg: "text-sky-700", ring: "ring-sky-200/70" },
  },
  {
    step: "3",
    title: "取引を始める",
    Icon: Handshake,
    tone: { bg: "bg-amber-50", fg: "text-amber-800", ring: "ring-amber-200/70" },
  },
] as const;


const NAVI_FEATURES = [
  { title: "電話での微調整もスムーズに", body: "条件のすり合わせはこれまで通り電話で対応できます。" },
  { title: "進捗と履歴の管理", body: "取引の状況をひと目で確認できます。" },
  { title: "お金の流れもまとめて確認", body: "金額・支払い状況を分かりやすく管理できます。" },
] as const;


const WHY_FREE_POINTS = [
  {
    title: "サービス拡大中につき月額0円で提供",
    body: "まずは業界で使っていただくことを最優先しています。",
    note: "※ 将来的に有料化する場合も事前にご案内します。",
  },
  {
    title: "あんしん決済の手数料も無料",
    body: "支払いリスクを減らすための決済機能を手数料0円で提供しています。",
    note: "※ 直接のお振り込みにも対応しています",
  },
] as const;

const CAMPAIGN_POINTS = [
  { title: "対象", body: "売っても、買っても対象です。" },
  { title: "特典", body: "対象取引 1台につき 2,000円を進呈します。" },
  { title: "条件", body: "本体5万円以上の取引で、取引が最後まで完了していること。" },
  { title: "お支払い", body: "月末締め／翌月20日に指定口座へお振込みします。" },
] as const;

// 伸びてる“イメージ”用（数字は後から差し替えOK）
const GROWTH_STATS = [
  { label: "登録販売業者", value: "増加中" },
  { label: "物件掲載", value: "増加中" },
  { label: "改善反映", value: "継続中" },
] as const;

const PROOF_LITE = [
  {
    src: "/lp/navi-list.png",
    title: "取引ナビ",
    body: "進捗や条件を、取引ごとに確認できます。",
  },
  {
    src: "/lp/listings.png",
    title: "出品一覧",
    body: "探す・比較する・問い合わせまでをシンプルに。",
  },
] as const;



const PROOF_FACTS = [
  { title: "電話での微調整に対応", body: "取引はこれまで通り電話中心で進められます。" },
  { title: "改善を継続して反映", body: "現場の声をもとに、使いやすさを継続的に見直しています。" },
  { title: "月額無料で提供中", body: "拡大フェーズのため、現在は月額0円で提供しています。" },
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
  中古遊技機 売買サイト
  <br />
  「パチマート」
</h1>

<p className="text-base leading-relaxed text-slate-700 sm:text-lg">
  出品・取引・進捗管理ができる
  <br />
  低コストで利用できる中古機売買サービスです。
</p>

<div className="flex flex-wrap gap-4">
  <a
    href="/signup"
    className="rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
  >
    無料で登録する
  </a>

  {/* 補助導線は “ヒーロー直下” ではなく別セクションへ移動推奨 */}
  {/* <a href="/listings" className="...">出品一覧を見る</a> */}
</div>

{/* 補助リンク（控えめ） */}
<div className="pt-2">
 
</div>
          </div>
        </div>
      </section>


{/* 最新情報（Hero直下） */}
<section className="border-b border-slate-200/70 bg-white">
  <div className="mx-auto w-full max-w-7xl px-6 py-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-700">最新情報</p>
      <a
        href="/news"
        className="hidden text-sm font-semibold text-[#2A8FA0] hover:underline sm:inline"
      >
        もっと見る →
      </a>
    </div>

    <div className="mt-3 divide-y divide-slate-200/70 rounded-2xl border border-slate-200 bg-white">
      {NEWS_ITEMS.slice(0, 3).map((item) => (
        <a
          key={item.title}
          href={item.href}
          className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/60 sm:px-6"
        >
          {/* 種別バッジ */}
          <span
            className={[
              "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold",
              NEWS_TYPE[item.type].badge,
            ].join(" ")}
          >
            {NEWS_TYPE[item.type].label}
          </span>

          {/* NEW */}
          {item.isNew && (
            <span className="hidden rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white sm:inline">
              NEW
            </span>
          )}

          {/* 本文 */}
          <span className="flex-1 text-sm text-slate-700 group-hover:text-slate-900">
            {item.title}
          </span>

          {/* 矢印 */}
          <span className="text-sm text-slate-400 group-hover:text-slate-600" aria-hidden="true">
            →
          </span>
        </a>
      ))}
    </div>

    {/* SPだけ「もっと見る」 */}
    <div className="mt-3 sm:hidden">
      <a href="/news" className="text-sm font-semibold text-[#2A8FA0] hover:underline">
        もっと見る →
      </a>
    </div>
  </div>
</section>



{/* 今まで通り + 取引ナビ */}
<section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F7FBFD]">
  <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-24 lg:py-32">
    {/* 上段：補強（センター） */}
    <div className="mx-auto max-w-3xl text-center" data-reveal>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
        業界で慣れている取引フローをベースに設計
      </h2>
      <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
        新しい操作を覚えなくても、これまでの感覚で使えます。
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
          ナビ機能搭載
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
        取引のきっかけを逃さないために
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        取引は今まで通り電話が中心。<br />
必要な場面だけ使える新しい取引の選択肢もご用意しています。
      </p>
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
        探さなくても情報が届きます
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        新着出品・成約情報をLINEで受け取れる機能　『パチ通知』搭載<br />
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
<section
  className="relative border-t border-slate-200/70"
  style={{
    backgroundImage: "url('/lp/cost-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* オーバーレイ */}
  <div className="absolute inset-0 bg-[#F7FBFD]/70" />

  <div className="relative mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
    <div className="max-w-3xl space-y-4" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        導入コスト0円ですぐに使えます
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        登録・導入・初期設定にかかる費用は一切ありません。<br />
        まずはお試しください。
      </p>
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

    <p className="text-sm text-slate-500" data-reveal>
      ※ 現在、サービス拡大のため無料で提供しています。
    </p>
  </div>
</section>


{/* なぜ無料なのか */}
<section className="bg-white border-t border-slate-200/70">
  <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
    <div className="max-w-3xl space-y-4" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        なぜ、無料で提供できるのか
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        「まずは使っていただくこと」を最優先にしています。<br />
        取引の現場で“本当に役に立つ形”に育てるため、今は無料で提供しています。
      </p>
    </div>

    <div className="grid gap-8 lg:grid-cols-2" data-reveal>
      {WHY_FREE_POINTS.map((p) => (
        <div
          key={p.title}
          className="rounded-2xl border border-slate-200 bg-[#F7FBFD] p-10 shadow-sm"
        >
          <p className="text-xl font-semibold text-slate-900">{p.title}</p>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            {p.body}
          </p>
          <p className="mt-4 text-sm text-slate-500">{p.note}</p>

          {/* さりげない “比較の匂い” を出したいならここをON */}
          {/* <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            競合は月額の値上げ・決済手数料（330〜660円/台）が発生するケースがあります。
          </div> */}
        </div>
      ))}
    </div>
  </div>
</section>

      {/* フロー */}
<section className="relative overflow-hidden bg-white border-t border-slate-200/70">
  {/* ほんのり背景（やりすぎない） */}
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    <div className="absolute -right-40 top-12 h-[520px] w-[520px] rounded-full bg-[#E6F2F7]/45 blur-3xl" />
    <div className="absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-slate-100/60 blur-3xl" />
  </div>

  <div className="relative mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
    <div className="max-w-3xl space-y-3" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        導入フロー
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        登録から取引開始まで特別な準備は必要ありません。
      </p>
    </div>

    {/* Steps */}
    <div className="relative" data-reveal>
      <div className="mx-auto flex max-w-5xl flex-col gap-10 text-center lg:flex-row lg:items-start lg:justify-between lg:gap-0">
        {FLOW_STEPS.map((step) => {
          const Icon = step.Icon;
          return (
            <div key={step.step} className="flex w-full flex-col items-center lg:w-1/3">
              {/* icon chip */}
              <div
                className={[
                  "flex h-14 w-14 items-center justify-center rounded-2xl",
                  "bg-gradient-to-b from-white to-slate-50",
                  "ring-1 shadow-[0_10px_26px_rgba(15,23,42,0.10)]",
                  step.tone.bg,
                  step.tone.ring,
                ].join(" ")}
              >
                <Icon className={["h-7 w-7", step.tone.fg].join(" ")} />
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                  {step.step}
                </span>
                <span>STEP</span>
              </div>

              <p className="mt-3 text-base font-semibold text-slate-900 sm:text-lg">
                {step.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* コネクタ（PCだけ、ステップ間だけ） */}
      <div className="pointer-events-none absolute left-0 right-0 top-[28px] hidden lg:block" aria-hidden="true">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-[16.66%]">
          {/* 1→2 */}
          <div className="flex items-center">
            <div className="h-px w-20 bg-slate-200/80" />
            <div className="ml-2 h-2 w-2 rotate-45 border-r-2 border-t-2 border-slate-200/80" />
          </div>
          {/* 2→3 */}
          <div className="flex items-center">
            <div className="h-px w-20 bg-slate-200/80" />
            <div className="ml-2 h-2 w-2 rotate-45 border-r-2 border-t-2 border-slate-200/80" />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


{/* キャンペーン（強調版） */}
<section className="relative overflow-hidden border-t border-slate-200/70 bg-gradient-to-b from-[#E6F2F7] via-white to-[#F7FBFD]">
  {/* 装飾レイヤー */}
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#2A8FA0]/20 blur-3xl" />
    <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-[#3BB4C6]/25 blur-3xl" />
  </div>

  <div className="relative mx-auto w-full max-w-7xl space-y-16 px-6 py-32 lg:py-36">
    {/* ヘッダー */}
    <div className="mx-auto max-w-3xl text-center space-y-6" data-reveal>
      <div className="inline-flex items-center gap-3 rounded-full 
                bg-[#2A8FA0] px-8 py-3 
                text-base font-semibold text-white 
                shadow-lg shadow-[#2A8FA0]/30">
  体験キャンペーン実施中
</div>


      <h2 className="text-balance text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
        対象取引 <span className="text-[#2A8FA0]">1台につき</span><br />
        <span className="text-5xl sm:text-6xl">2,000円</span> を進呈
      </h2>

      <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
        パチマートの取引フローを、実際の取引で体験していただくための
        <br className="hidden sm:block" />
        期間限定キャンペーンです。
      </p>
    </div>

    {/* コンテンツ */}
    <div className="grid gap-10 lg:grid-cols-2" data-reveal>
      {/* 左：条件 */}
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-lg backdrop-blur-[2px]">
        <h3 className="text-lg font-semibold text-slate-900">キャンペーン概要</h3>

        <dl className="mt-6 space-y-5">
          {CAMPAIGN_POINTS.map((p) => (
            <div key={p.title}>
              <dt className="text-sm font-semibold text-slate-500">{p.title}</dt>
              <dd className="mt-1 text-base text-slate-900">{p.body}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 右：数字＋CTA（重複ゼロ版） */}
<div className="rounded-3xl border border-[#2A8FA0]/30 bg-white/95 p-10 shadow-xl backdrop-blur-[2px]">
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-s font-semibold text-slate-500">キャンペーン特典</p>
    </div>

    {/* バッジ（目立つけど煽らない） */}
    <span className="rounded-full bg-[#2A8FA0] px-3 py-1 text-xs font-semibold text-white shadow-sm">
      期間限定
    </span>
  </div>

  {/* 金額 */}
  <div className="mt-7 flex items-end gap-3">
    <span className="text-6xl font-semibold tracking-tight text-[#2A8FA0]">2,000</span>
    <span className="mb-2 text-lg font-semibold text-slate-700">円 / 1台</span>
  </div>

  {/* CTA */}
  <div className="mt-10 flex flex-wrap gap-4">
    <a
      href="/signup"
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5"
    >
      無料で登録する
    </a>
    
  </div>

  {/* 注釈（終了条件だけ） */}
  <div className="mt-7 rounded-2xl bg-[#F7FBFD] p-4 text-s leading-relaxed text-slate-600">
    ※ 予算上限に達し次第、終了となります。
  </div>
</div>

    </div>
  </div>
</section>

{/* Proof（Step4：最終版） */}
<section className="border-t border-slate-200/70 bg-white">
  <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
    <div className="max-w-3xl space-y-3" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        実際の画面で確認できます
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        業界で慣れている取引フローをベースに、
        必要な情報だけをシンプルにまとめています。
      </p>
    </div>

    <div className="grid gap-6 lg:grid-cols-2" data-reveal>
      {PROOF_LITE.map((item) => (
        <div
          key={item.title}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative aspect-[16/9] bg-slate-50">
            <Image
              src={item.src}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-1 p-6">
            <p className="text-base font-semibold text-slate-900">
              {item.title}
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="pt-6" data-reveal>
      <a
        href="/signup"
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5"
      >
        無料で登録する
      </a>
    </div>
  </div>
</section>



{/* 登録が増えているイメージ */}
<section className="border-t border-slate-200/70 bg-white">
  <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
    <div className="max-w-3xl space-y-4" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        登録が増えています
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
        現場の運用に合わせて、改善を続けながら広がっています。
      </p>
    </div>

    <div className="grid gap-6 lg:grid-cols-3" data-reveal>
      {GROWTH_STATS.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-500">{s.label}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{s.value}</p>
          <div className="mt-6 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 w-2/3 rounded-full bg-[#2A8FA0]/35" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            ※ 数値は順次公開予定です（拡大フェーズのため）
          </p>
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
