'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  UserPlus,
  ClipboardList,
  Handshake,
  Search,
  Phone,
  Files,
  MessageSquare,
  Zap,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    image: '/lp/office1.png',
    alt: 'オフィス風景',
    eyebrow: '取引をもっと見やすく',
    title: '掲載・問い合わせ・進行管理を\nひとつの流れで',
    body: '電話中心の運用はそのままに、必要な情報だけを整理して見やすくまとめます。',
  },
  {
    image: '/lp/souko.png',
    alt: '倉庫風景',
    eyebrow: '現場の動きもつながる',
    title: '倉庫・在庫の流れも\nイメージしやすく',
    body: '売買だけでなく、その先の現場運用も見据えた使いやすさを目指しています。',
  },
  {
    image: '/lp/listings.png',
    alt: 'パチマート画面',
    eyebrow: '画面からすぐ確認',
    title: '出品一覧や取引状況を\n分かりやすく表示',
    body: '必要な情報を探しやすく、比較しやすいUIで日々の確認をスムーズにします。',
  },
  {
    image: '/lp/campaign.png',
    alt: 'パチマート画面',
    eyebrow: '画面からすぐ確認',
    title: '出品一覧や取引状況を\n分かりやすく表示',
    body: '必要な情報を探しやすく、比較しやすいUIで日々の確認をスムーズにします。',
  },
] as const;

const NEWS_ITEMS = [
  {
    type: 'campaign',
    title: '体験キャンペーン実施中｜対象取引1台につき2,000円を進呈',
    href: '#campaign',
    isNew: true,
  },
  {
    type: 'update',
    title: 'ナビ機能を改善｜取引状況がより分かりやすくなりました',
    href: '/lp#navi',
    isNew: true,
  },
  {
    type: 'info',
    title: 'サービス拡大中につき、現在は月額無料で提供しています',
    href: '/signup',
    isNew: false,
  },
] as const;

const NEWS_TYPE = {
  campaign: {
    label: 'キャンペーン',
    badge: 'bg-[#FFF7E6] text-[#C27803] ring-1 ring-[#F5D7A1]',
  },
  update: {
    label: 'システム改善',
    badge: 'bg-[#EAF2F8] text-[#1E4F7A] ring-1 ring-[#C9DCEC]',
  },
  info: {
    label: 'お知らせ',
    badge: 'bg-[#F4F5F7] text-slate-600 ring-1 ring-slate-200',
  },
} as const;

const OPPORTUNITY_CARDS = [
  {
    title: 'オンライン問い合わせ',
    label: 'ONLINE',
    lead: '電話がつながらない時の“受付窓口”として使えます',
    Icon: MessageSquare,
    tone: {
      bg: 'bg-[#E6F2F7]',
      fg: 'text-[#2A8FA0]',
      accent: 'bg-[#2A8FA0]',
    },
    points: [
      '営業時間外でも問い合わせを残せます',
      '条件・台数を先に共有できるので、折り返しが早い',
    ],
  },
  {
    title: '即決売買',
    label: 'INSTANT',
    lead: '条件が合う相手とは、確認の手間を減らして進められます',
    Icon: Zap,
    tone: {
      bg: 'bg-[#FFF4E5]',
      fg: 'text-[#C27803]',
      accent: 'bg-[#F39A2D]',
    },
    points: [
      '価格・台数・エリアなど条件が合えばそのまま成約',
      '“確認待ち”が減り、タイミングを逃しにくい',
    ],
  },
] as const;

const NOTIFY_ITEMS = [
  { title: '新着出品', body: 'P北斗の拳9　¥350,000/5台', time: '1分前' },
  { title: '成約情報', body: 'L押忍！番長4　¥250,000/10台', time: '5分前' },
  { title: '成約情報', body: 'e牙狼　¥130,000/8台', time: '30分前' },
];

const COST_CARDS = [
  { title: '月額利用料', value: '無料' },
  { title: '初期導入・設定費用', value: 'なし' },
  { title: '最低利用期間', value: 'なし' },
];

const FLOW_STEPS = [
  {
    step: 1,
    title: 'Webで無料登録',
    description:
      '新規登録ボタンをクリック',
    Icon: UserPlus,
    tone: {
      fg: 'text-emerald-600',
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-100',
    },
  },
  {
    step: 2,
    title: '基本情報を入力',
    description:
      '担当者や企業情報を入力のうえ、登録申請',
    Icon: ClipboardList,
    tone: {
      fg: 'text-sky-600',
      bg: 'bg-sky-50/70',
      border: 'border-sky-100',
    },
  },
  {
    step: 3,
    title: '取引を始める',
    description:
      '承認後、取引を進められます。',
    Icon: Handshake,
    tone: {
      fg: 'text-amber-600',
      bg: 'bg-amber-50/70',
      border: 'border-amber-100',
    },
  },
] as const;

const TRANSACTION_FLOW = [
  {
    step: '1',
    title: '掲載情報を確認',
    body: '出品一覧から、条件に合う機械を探します。',
    Icon: Search,
  },
  {
    step: '2',
    title: '電話で問い合わせ',
    body: '価格・台数・条件の細かい調整は、これまで通り電話で進められます。',
    Icon: Phone,
  },
  {
    step: '3',
    title: 'ナビで進行を可視化',
    body: '取引状況・条件・支払いの流れを、分かりやすく整理できます。',
    Icon: Files,
  },
] as const;


const NAVI_FEATURES = [
  {
    title: '電話での微調整もスムーズに',
    body: '条件のすり合わせはこれまで通り電話で対応できます。',
  },
  { title: '進捗と履歴の管理', body: '取引の状況をひと目で確認できます。' },
  {
    title: 'お金の流れもまとめて確認',
    body: '金額・支払い状況を分かりやすく管理できます。',
  },
] as const;

const WHY_FREE_POINTS = [
  {
    title: 'サービス拡大中につき月額0円で提供',
    body: 'まずは業界で使っていただくことを最優先しています。',
    note: '※ 将来的に有料化する場合も事前にご案内します。',
  },
  {
    title: 'あんしん決済の手数料も無料',
    body: '支払いリスクを減らすための決済機能を手数料0円で提供しています。',
    note: '※ 直接のお振り込みにも対応しています',
  },
] as const;

const CAMPAIGN_POINTS = [
  { title: '対象', body: '売っても、買っても対象です。' },
  { title: '特典', body: '対象取引 1台につき 2,000円を進呈します。' },
  {
    title: '条件',
    body: '本体5万円以上の取引で、取引が最後まで完了していること。',
  },
  { title: 'お支払い', body: '月末締め／翌月20日に指定口座へお振込みします。' },
] as const;

// 伸びてる“イメージ”用（数字は後から差し替えOK）
const GROWTH_STATS = [
  { label: '登録販売業者', value: '100社以上' },
  { label: '物件掲載', value: '増加中' },
  { label: '改善反映', value: '継続中' },
] as const;

const PROOF_LITE = [
  {
    src: '/lp/navi-list.png',
    title: '取引ナビ',
    body: '進捗や条件を、取引ごとに確認できます。',
  },
  {
    src: '/lp/listings.png',
    title: '出品一覧',
    body: '探す・比較する・問い合わせまでをシンプルに。',
  },
] as const;

const PROOF_FACTS = [
  {
    title: '電話での微調整に対応',
    body: '取引はこれまで通り電話中心で進められます。',
  },
  {
    title: '改善を継続して反映',
    body: '現場の声をもとに、使いやすさを継続的に見直しています。',
  },
  {
    title: '月額無料で提供中',
    body: '拡大フェーズのため、現在は月額0円で提供しています。',
  },
] as const;

function DotPattern() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* 右寄せの薄ドット（全面敷きNGのルールに合わせて） */}
      <div className="absolute -right-24 top-0 h-[520px] w-[720px] opacity-[0.12]">
        <svg viewBox="0 0 400 300" className="h-full w-full">
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.6" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            width="400"
            height="300"
            fill="url(#dots)"
            className="text-slate-900"
          />
        </svg>
      </div>
    </div>
  );
}

export default function LpPage() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10%' },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="text-slate-900">


        {/* HERO */}
      <section className="relative overflow-hidden bg-[#F4F5F7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,245,247,0.9)_45%,rgba(244,245,247,1)_100%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-8 lg:grid-cols-2 lg:gap-10 lg:py-10">   
         
         {/* 左カラム */}
          <div className="max-w-2xl space-y-8" data-reveal>
            <div className="space-y-3">
              <p className="text-xl font-bold tracking-tight text-slate-700 sm:text-2xl">
                中古遊技機 売買サイト
              </p>

              <img
                src="/lp/logo.png"
                alt="パチマート"
                className="h-14 sm:h-16 lg:h-44 w-auto -ml-6"
              />
<br />
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                <span className="relative inline-block">
                  中古機流通を
                  <span className="absolute left-0 -bottom-1 h-2 w-[95%] bg-[#FFE066] -z-10" />
                </span>
                <br />
                <span className="relative inline-block">
                  よりスムーズに。
                  <span className="absolute left-0 -bottom-1 h-2 w-[90%] bg-[#FFE066] -z-10" />
                </span>
              </h1>

              <p className="text-xl font-bold tracking-tight text-slate-700 sm:text-2xl">
                誰もが安心して使える取引環境へ。
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
  <a
    href="/register"
    className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
  >
    いますぐ新規登録
  </a>

  <a
    href="/contact"
    className="inline-flex items-center justify-center rounded-full bg-[#F39A2D] px-8 py-4 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90"
  >
    お問い合わせ
  </a>
</div>
          </div>

          {/* 右カラム：スライド */}
<div className="relative lg:h-full" data-reveal>
  <div className="relative h-[420px] overflow-hidden rounded-[10px] border border-white/70 bg-white/70 shadow-[0_24px_56px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:h-[460px] lg:h-[520px]">
    <div className="relative h-full w-full">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.alt}
          className={[
            'absolute inset-0 transition-all duration-700',
            index === activeHeroSlide
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-6 opacity-0',
          ].join(' ')}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>

    {/* 矢印 */}
    <button
      type="button"
      aria-label="前のスライド"
      onClick={() =>
        setActiveHeroSlide((prev) =>
          prev === 0 ? HERO_SLIDES.length - 1 : prev - 1,
        )
      }
      className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 text-slate-700 shadow-md transition hover:bg-white lg:inline-flex"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>

    <button
      type="button"
      aria-label="次のスライド"
      onClick={() =>
        setActiveHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)
      }
      className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 text-slate-700 shadow-md transition hover:bg-white lg:inline-flex"
    >
      <ChevronRight className="h-5 w-5" />
    </button>

    {/* ドット */}
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
      {HERO_SLIDES.map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`スライド${index + 1}`}
          onClick={() => setActiveHeroSlide(index)}
          className={[
            'h-2.5 rounded-full transition-all',
            index === activeHeroSlide
              ? 'w-8 bg-white'
              : 'w-2.5 bg-white/55',
          ].join(' ')}
        />
      ))}
    </div>
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
                    'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold',
                    NEWS_TYPE[item.type].badge,
                  ].join(' ')}
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
                <span
                  className="text-sm text-slate-400 group-hover:text-slate-600"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            ))}
          </div>

          {/* SPだけ「もっと見る」 */}
          <div className="mt-3 sm:hidden">
            <a
              href="/news"
              className="text-sm font-semibold text-[#2A8FA0] hover:underline"
            >
              もっと見る →
            </a>
          </div>
        </div>
      </section>

     {/* 取引フロー + ナビ機能 */}
<section
  id="navi"
  className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white to-[#F7FBFD]"
>
  <div
    className="pointer-events-none absolute inset-0"
    aria-hidden="true"
  >
    <div className="absolute right-[-120px] top-10 h-[320px] w-[320px] rounded-full bg-[#E6F2F7]/70 blur-3xl" />
    <div className="absolute left-[-100px] bottom-0 h-[260px] w-[260px] rounded-full bg-slate-100/80 blur-3xl" />
  </div>

  <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:py-24 lg:py-28">
    {/* 見出し */}
    <div className="mx-auto max-w-4xl text-center" data-reveal>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-4xl">
        業界で慣れている取引フローをベースに設計
      </h2>
      <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
        掲載情報を見て、電話で問い合わせ、ナビでやり取りを整理。
        <br className="hidden sm:block" />
        これまでの進め方を変えすぎず、必要な情報だけ見やすくまとめています。
      </p>
    </div>

    {/* 3ステップ */}
    <div className="mt-14" data-reveal>
  <div className="grid gap-6 lg:grid-cols-3">
    {TRANSACTION_FLOW.map((item, index) => {
      const Icon = item.Icon;
      return (
        <div key={item.title} className="relative">
          <div className="h-full rounded-3xl border-4 border-[#9ab3d3] bg-[#ffffff] p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2A8FA0]/10 text-[#2A8FA0] ring-1 ring-[#CFE3E8]">
                <Icon className="h-7 w-7" />
              </div>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#2A8FA0] px-3 text-xs font-semibold text-white shadow-sm shadow-[#2A8FA0]/20">
                STEP {item.step}
              </span>
            </div>

            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              {item.body}
            </p>
          </div>

          {index < TRANSACTION_FLOW.length - 1 && (
            <div
              className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block"
              aria-hidden="true"
            >
              <div className="flex items-center gap-0">
                <div className="h-px w-10 bg-[#9ac3d5]" />
                <div className="h-5 w-5 rotate-45 border-r-2 border-t-2 border-[#9ac3d5]" />
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>
    </div>
    
    
</section>

      {/* きっかけ（画像背景） */}
<section className="relative overflow-hidden border-t border-slate-200/70 lg:min-h-[80vh]">
  {/* 背景画像 */}
  <div className="absolute inset-0">
    <Image
      src="/lp/MTG.png"
      alt=""
      fill
      className="object-cover object-[62%_center]"
      priority={false}
    />

    {/* 全体をしっかり白寄せ */}
    <div className="absolute inset-0 bg-white/86" />

    {/* 左側の文字エリアをさらに読みやすく */}
    <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/68 to-white/28" />

    {/* ほんのり空気感だけ足す */}
    <div className="absolute inset-0 bg-[#EAF4F7]/18" />
  </div>

{/* 白ベース強化 */}
<div className="absolute inset-0 bg-white/92" />

{/* 左だけさらに白 */}
<div className="absolute inset-0 bg-gradient-to-r from-white via-white/98 to-transparent" />

  {/* 中身 */}
  <div className="relative mx-auto w-full max-w-7xl space-y-12 px-6 py-20 sm:py-24 lg:py-28">
    <div className="max-w-3xl space-y-4" data-reveal>
      <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        取引のきっかけを逃さないための選択肢も
      </h2>
      <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
        取引は今まで通り電話が中心。
        <br />
        必要な場面だけ使える新しい取引の選択肢もご用意しています。
      </p>
    </div>

    <div className="grid gap-10 lg:grid-cols-2" data-reveal>
      {OPPORTUNITY_CARDS.map((card) => (
        <div
          key={card.title}
          className="group rounded-2xl border border-slate-200 bg-white/95 p-10
            shadow-[0_14px_36px_rgba(15,23,42,0.10)]
            backdrop-blur-sm
            transition hover:-translate-y-0.5 hover:border-slate-300
            hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center gap-3 border-b border-[#E6F2F7] pb-4">
            <div className={`h-6 w-1.5 rounded-full ${card.tone.accent}`} />
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              {card.title}
            </h3>
          </div>

          <p className="mt-5 text-base font-semibold leading-relaxed text-slate-700 sm:text-lg">
            {card.lead}
          </p>

          <ul className="mt-6 space-y-4 text-base leading-relaxed text-slate-700">
            {card.points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#EAF4F7] text-[#2A8FA0] ring-1 ring-[#D7E8EE]"
                  aria-hidden="true"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* 通知（LINE風） */}
<section className="relative overflow-hidden border-t border-slate-200/70 bg-white">
  <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-28">
    {/* 右：人物画像（背景寄りに配置） */}
    <div
      className="pointer-events-none absolute right-[6%] top-[140px] hidden lg:block"
      data-reveal
      aria-hidden="true"
    >
      <div className="relative w-[420px]">
        <div className="absolute inset-x-10 bottom-8 top-20 -z-10 rounded-full bg-[#2A8FA0]/12 blur-3xl" />
        <img
          src="/lp/line2.png"
          alt=""
          className="w-full h-auto object-contain drop-shadow-[0_28px_50px_rgba(15,23,42,0.18)]"
        />
      </div>
    </div>

    {/* 左コンテンツ */}
    <div className="relative z-10 max-w-[720px]">
      {/* 見出し */}
      <div className="max-w-3xl space-y-4" data-reveal>
        <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          通知機能を使うと情報が届きます
        </h2>
        <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
          新着出品・成約情報をLINEで受け取れる機能『パチ通知』搭載
        </p>
      </div>

      {/* LINE風メッセージ */}
      <div
        className="mt-10 rounded-3xl border border-slate-200 bg-[#DCEAF8] p-8 shadow-sm"
        data-reveal
      >
        <div className="flex flex-col gap-6">
          {NOTIFY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="relative flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              <span className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-white" />

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6F2F7] text-sm font-bold text-slate-600">
                P
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-[#06C755]">
                  {item.title}
                </p>
                <p className="mt-1 text-base text-slate-700">{item.body}</p>
              </div>

              <span className="mt-1 text-xs text-slate-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 補足 */}
      <p className="mt-8 text-sm text-slate-500" data-reveal>
        ※ LINE通知は任意です。事前に登録した機種の情報が通知されます。
      </p>
    </div>
  </div>
</section>

       {/* 料金・決済セクション */}
<section className="border-t border-slate-200 bg-[#cae8f1]">
  <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-28">
    <div className="text-center" data-reveal>
      <h2 className="text-4xl font-bold text-slate-900 sm:text-4xl">
        料金について
      </h2>
      <div className="mx-auto mt-5 h-1 w-28 rounded-full bg-[#52a7c1]" />
    </div>

    <div className="mt-14 space-y-10">
      {/* 料金プランカード */}
      <div
        className="overflow-hidden rounded-[40px] bg-white px-8 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:px-10 sm:py-12 lg:px-14 lg:py-16"
        data-reveal
      >
        <div className="grid gap-10 lg:grid-cols-[180px_1fr] lg:gap-14">
          {/* 左番号 */}
          <div className="flex items-start lg:justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#52a7c1] text-4xl font-semibold text-[#52a7c1]">
              01
            </div>
          </div>

          {/* 右本文 */}
          <div>
            <h3 className="inline-block border-b-[6px] border-[#fed169] text-4xl font-semibold leading-tight text-slate-900">
              月額料金制のサービスですが、
              <br className="hidden sm:block" />
              現在は無料でご利用いただけます
            </h3>

            <div className="mt-10 mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              {/* テキスト */}
              <div>
                <p className="mt-6 text-xl leading-relaxed text-slate-700 sm:text-xl">
                  登録・導入・初期設定にかかる費用は一切ありません。
                  <br />
                  <br />まずは実際に使っていただき、取引の現場で本当に役に立つ形へ
                  育てていくことを優先しています。
                  <br />
                  <br />※将来的に有料化する場合も、事前にご案内します。
                </p>

                <div className="mt-8 space-y-4 text-slate-700">
                </div>
              </div>

              {/* イラスト */}
              <div className="flex justify-center">
                <img
                  src="/lp/plan.png"
                  alt="料金プランのイメージ"
                  className="w-full max-w-md object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* あんしん決済カード */}
      <div
        className="overflow-hidden rounded-[40px] bg-white px-8 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:px-10 sm:py-12 lg:px-14 lg:py-16"
        data-reveal
      >
        <div className="grid gap-10 lg:grid-cols-[180px_1fr] lg:gap-14">
          {/* 左番号 */}
          <div className="flex items-start lg:justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#52a7c1] text-4xl font-semibold text-[#52a7c1]">
              02
            </div>
          </div>

          {/* 右本文 */}
          <div>
            <h3 className="inline-block border-b-[6px] border-[#fed169] text-4xl font-semibold leading-tight text-slate-900">
              安全に取引を進めるための
              <br className="hidden sm:block" />
              あんしん決済も無料です
            </h3>

            <div className="mt-10 mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              {/* テキスト */}
              <div>
                <div className="mt-8 space-y-4 text-slate-700">
                  <div>
                    <p className="mt-1 text-xl leading-relaxed">
                      GMOあおぞらネット銀行と連携することで
                      <br />
                      あんしん決済サービスを無料で提供することを実現しております。
                    </p>
                  </div>

                  <div>
                    <p className="mt-1 text-xl leading-relaxed">
                      普段こうしたサービスをご利用の業者様にとっては、<br />
                      決済関連コストの見直しにつながる可能性があります。
                    </p>
                  </div>
                </div>
              </div>

              {/* イラスト */}
              <div className="flex justify-center">
                <img
                  src="/lp/bank.png"
                  alt="あんしん決済のイメージ"
                  className="w-full max-w-md object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="px-2 text-lg leading-relaxed text-slate-700">
        ※ 掲載内容は現在の提供内容に基づいています。今後料金体系を変更する場合は、事前にご案内します。
      </p>
    </div>
  </div>
</section>

      {/* フロー */}
<section className="border-t border-slate-200/70 bg-white">
  <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-28">
    <div className="max-w-3xl" data-reveal>
      <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        導入までの流れ
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
        登録から取引開始まではシンプルな3ステップで始められます。
      </p>
    </div>

    <div className="mt-16" data-reveal>
      <div className="grid gap-12 lg:grid-cols-3">
        {FLOW_STEPS.map((step) => {
          const Icon = step.Icon;

          return (
            <div key={step.step} className="relative">
              {/* 番号＋アイコン */}
              <div className="flex items-center gap-5">
                <span className="text-4xl font-bold leading-none tracking-tight text-slate-500 sm:text-5xl">
                  0{step.step}
                </span>

                <div
                  className={[
                    'flex h-16 w-16 items-center justify-center rounded-2xl border-2',
                    step.tone.bg,
                    step.tone.border,
                  ].join(' ')}
                >
                  <Icon className={['h-8 w-8', step.tone.fg].join(' ')} />
                </div>
              </div>

              {/* タイトル */}
              <h3 className="mt-7 text-2xl font-semibold leading-snug text-slate-900">
                {step.title}
              </h3>

              {/* 説明 */}
              <p className="mt-4 text-base leading-8 text-slate-600">
                {step.description}
              </p>

              {/* 下線 */}
              <div
                className={[
                  'mt-8 h-1.5 w-full rounded-full',
                  step.step === 1 && 'bg-emerald-200',
                  step.step === 2 && 'bg-sky-200',
                  step.step === 3 && 'bg-amber-200',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>
          );
        })}
      </div>
    </div>
  </div>
</section>

     {/* キャンペーン */}
<section
  id="campaign"
  className="relative overflow-hidden border-t border-slate-200/70"
>
  {/* 背景画像 */}
  <div className="absolute inset-0">
    <img
      src="/lp/campaign-haikei.png" // ←用意した画像
      alt=""
      className="w-full h-full object-cover"
    />

    {/* 白オーバーレイ（重要） */}
    <div className="absolute inset-0 bg-white/60" />

    {/* ほんのり色味（任意） */}
    <div className="absolute inset-0 bg-[#F9C97B]/20 mix-blend-multiply" />
  </div>

  <div className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
    <div
      className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-white/80 bg-white/80 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-10 sm:py-10 lg:px-14 lg:py-12"
      data-reveal
    >
      {/* 内側のうっすら光 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(255,255,255,0.72)_42%,rgba(255,255,255,0.38)_100%)]" />

      <div className="relative">
        {/* 上部ラベルエリア */}
<div className="relative flex flex-col items-center justify-center text-center">
  {/* クラッカー（左上・大きめ・浮遊アニメーション） */}
  <img
    src="/lp/kurakka-.png"
    alt=""
    className="
      pointer-events-none absolute
      -left-20 -top-2
      w-40 sm:w-48 lg:w-80
      rotate-[-14deg]
      drop-shadow-[0_20px_40px_rgba(15,23,42,0.28)]
      animate-[campaignFloat_3.2s_ease-in-out_infinite]
    "
  />


  {/* 横並びラベル */}
 <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">

  <span className="
    inline-flex items-center
    rounded-full
    bg-gradient-to-b from-[#E79B2E] to-[#C97514]
    
    px-8 py-4
    sm:px-10 sm:py-5
    
    text-xl sm:text-2xl lg:text-3xl
    font-bold
    tracking-tight
    
    text-white
    
    shadow-[0_12px_30px_rgba(201,117,20,0.35)]
    
    transition
  ">
    体験キャンペーン開催中
  </span>

</div>
</div>

        {/* メインコピー */}
<div className="mt-10 text-center">
  <p className="
  text-[clamp(1.8rem,3.5vw,3rem)]
  font-bold
  leading-tight
  tracking-tight
  text-slate-700
">
  売っても買っても
</p>

  <p className="mt-3 flex flex-wrap items-end justify-center gap-x-2 gap-y-1 text-slate-700">
    <span className="text-[clamp(1.9rem,3.2vw,3.1rem)] font-bold leading-none">
      1台ごとに
    </span>

    <span className="bg-gradient-to-b from-[#F8C54B] to-[#E39A17] bg-clip-text text-[clamp(3.3rem,7vw,6rem)] font-black leading-none text-transparent">
      2,000円
    </span>

    <span className="text-[clamp(1.9rem,3.2vw,3.1rem)] font-bold leading-none">
      プレゼント
    </span>
  </p>
</div>

        {/* 補足情報 */}
        <div className="mt-10 flex justify-center">
          <div className="max-w-2xl rounded-2xl bg-white/72 px-6 py-5 text-left text-sm leading-relaxed text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:text-base">
            <div className="space-y-3">
              <p>
                <span className="font-semibold text-slate-700">条件：</span>
                本体5万円以上の取引で、取引が最後まで完了していること。
              </p>

              <p>
                <span className="font-semibold text-slate-700">お支払い：</span>
                月末締め／翌月20日に指定口座へお振込みします。
              </p>

              <p>
                <span className="font-semibold text-slate-700">終了条件：</span>
                予算上限に達し次第、終了となります。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Proof（Step4：最終版） */}
      <section className="border-t border-slate-200/70 bg-[#eaeef6]">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-28">
          <div className="max-w-3xl space-y-3" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              実際の画面イメージ
            </h2>
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
        </div>
      </section>

      {/* 登録が増えているイメージ */}
      <section className="border-t border-slate-200/70 bg-white">
  <div className="mx-auto max-w-5xl px-6 py-20 text-center">
    
    <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
      おかげさまで登録が増えています
    </h2>

    <p className="mt-4 text-base text-slate-600 sm:text-lg">
      現場の運用に合わせて、改善を続けながら広がっています。
    </p>

    {/* メイン数字 */}
    <div className="mt-12">
      <div className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
      販売業者様 <span className="text-8xl font-weight:900 text-[#2A8FA0]">100</span> 社 以上
      </div>
      <p className="mt-4 text-base text-slate-600 sm:text-lg">
      ※2026年3月現在
    </p>
    </div>

  </div>
</section>

      {/* Contact CTA */}
      <section className="relative overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0">
          <Image src="/lp/city.jpg" alt="" fill className="object-cover" />
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
                いますぐ新規登録
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
          transition:
            opacity 600ms ease 120ms,
            transform 600ms ease 120ms;
        }
        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
