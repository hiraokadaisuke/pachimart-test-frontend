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
} from 'lucide-react';

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

const NOTIFY_ITEMS = [
  { title: '新着出品', body: 'P北斗の拳9　¥350,000/5台', time: '1分前' },
  { title: '成約情報', body: 'L押忍！番長4　¥250,000/10台', time: '5分前' },
  { title: '成約情報', body: 'e牙狼　¥130,000/8台', time: '30分前' },
] as const;

const FLOW_STEPS = [
  {
    step: 1,
    title: 'Webで無料登録',
    description: '新規登録ボタンをクリック',
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
    description: '担当者や企業情報を入力のうえ、登録申請',
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
    description: '承認後、取引を進められます。',
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

const PROOF_LITE = [
  {
    src: '/lp/navi-list.png',
    title: 'ナビ作成ページ',
    body: '電話での合意内容をまとめて取引先に送信します。',
  },
  {
    src: '/lp/listings.png',
    title: '商品一覧ページ',
    body: '探す・比較する・問い合わせまでをシンプルに。',
  },
] as const;

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
      setActiveHeroSlide((prev) => (prev + 1) % 4);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="text-slate-900">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#F4F5F7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,245,247,0.9)_45%,rgba(244,245,247,1)_100%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-10 lg:py-16">
          <div className="max-w-2xl space-y-6 sm:space-y-7" data-reveal>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-base font-bold tracking-tight text-slate-700 sm:text-lg lg:text-2xl">
                中古遊技機 売買サイト
              </p>

              <img
                src="/lp/logo.png"
                alt="パチマート"
                className="h-11 w-auto sm:h-14 lg:h-40"
              />

              <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-6xl">
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

              <p className="text-lg font-bold tracking-tight text-slate-700 sm:text-xl lg:text-2xl">
                誰もが安心して使える取引環境へ。
              </p>

              <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
                現場で使いやすい形を目指して改善を続けています。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <a
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 sm:px-8 sm:py-4 sm:text-base"
              >
                いますぐ新規登録
              </a>

              <a
                href="/contact"
                className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#F39A2D] px-8 py-4 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90"
              >
                お問い合わせ
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[430px] lg:block" data-reveal>
            <div className="absolute left-5 -top-10 z-10 h-[195px] w-[260px] overflow-hidden rounded-[36px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
              <Image
                src="/lp/souko.png"
                alt="倉庫風景"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute right-0 top-20 z-20 h-[380px] w-[520px] overflow-hidden rounded-[56px] bg-white shadow-[0_24px_56px_rgba(15,23,42,0.14)]">
              <Image
                src="/lp/office1.png"
                alt="オフィス風景"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-20 right-130 z-20 h-[165px] w-[250px] overflow-hidden rounded-[36px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
              <Image
                src="/lp/listings.png"
                alt="パチマート画面"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute right-10 top-0 h-20 w-20 rounded-full bg-[#E8F4F6]" />
            <div className="absolute bottom-0 right-8 h-16 w-16 rounded-full bg-[#FCE7D6]" />
          </div>
        </div>
      </section>

      {/* 最新情報 */}
      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">最新情報</p>
            <a
              href="/news"
              className="hidden text-sm font-semibold text-[#2A8FA0] hover:underline sm:inline"
            >
              もっと見る →
            </a>
          </div>

          <div className="mt-3 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {NEWS_ITEMS.slice(0, 3).map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/60 sm:px-5"
              >
                <span
                  className={[
                    'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs',
                    NEWS_TYPE[item.type].badge,
                  ].join(' ')}
                >
                  {NEWS_TYPE[item.type].label}
                </span>

                {item.isNew && (
                  <span className="hidden rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white sm:inline">
                    NEW
                  </span>
                )}

                <span className="flex-1 text-xs leading-relaxed text-slate-700 group-hover:text-slate-900 sm:text-sm">
                  {item.title}
                </span>

                <span
                  className="text-sm text-slate-400 group-hover:text-slate-600"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            ))}
          </div>

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
      <section className="border-t border-slate-200/70 bg-[linear-gradient(180deg,#f8fcff_0%,#ffffff_100%)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="text-center" data-reveal>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              パチマートの取引方法
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#52a7c1] sm:mt-5 sm:w-28" />
          </div>

          <div className="mx-auto mt-8 max-w-4xl text-center sm:mt-10" data-reveal>
            <h3 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
              業界で使い慣れているナビ機能を実装
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
              掲載情報を見て、電話で問い合わせ、ナビでやり取りを整理。
              <br className="hidden sm:block" />
              これまでの進め方を変えすぎず、必要な情報だけ見やすくまとめています。
            </p>
          </div>

          <div className="mt-10 sm:mt-14" data-reveal>
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {TRANSACTION_FLOW.map((item, index) => {
                const Icon = item.Icon;
                return (
                  <div key={item.title} className="relative">
                    <div className="h-full rounded-3xl border-4 border-[#9ab3d3] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)] sm:p-6 lg:p-8">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2A8FA0]/10 text-[#2A8FA0] ring-1 ring-[#CFE3E8] sm:h-14 sm:w-14">
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#2A8FA0] px-3 text-[11px] font-semibold text-white shadow-sm shadow-[#2A8FA0]/20 sm:text-xs">
                          STEP {item.step}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-semibold text-slate-900 sm:mt-6 sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
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

      {/* 通知（LINE風） */}
      <section className="relative overflow-hidden border-t border-slate-200/70 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="text-center" data-reveal>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              パチマートのLINE通知機能
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#52a7c1] sm:mt-5 sm:w-28" />
          </div>

          <div
            className="pointer-events-none absolute right-[6%] top-[180px] hidden lg:block"
            data-reveal
            aria-hidden="true"
          >
            <div className="relative w-[420px]">
              <div className="absolute inset-x-10 bottom-8 top-20 -z-10 rounded-full bg-[#2A8FA0]/12 blur-3xl" />
              <img
                src="/lp/line2.png"
                alt=""
                className="h-auto w-full object-contain drop-shadow-[0_28px_50px_rgba(15,23,42,0.18)]"
              />
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-[720px] sm:mt-12">
            <div className="max-w-3xl space-y-3 sm:space-y-4" data-reveal>
              <h3 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                通知機能を使うと情報が届きます
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
                新着出品・成約情報をLINEで受け取れる機能『パチ通知』搭載
              </p>
            </div>

            <div
              className="mt-8 rounded-3xl border border-slate-200 bg-[#DCEAF8] p-4 shadow-sm sm:mt-10 sm:p-6 lg:p-8"
              data-reveal
            >
              <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
                {NOTIFY_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="relative flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
                  >
                    <span className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-white" />

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E6F2F7] text-sm font-bold text-slate-600 sm:h-10 sm:w-10">
                      P
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-[#06C755] sm:text-xs">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-700 sm:text-base">
                        {item.body}
                      </p>
                    </div>

                    <span className="mt-1 whitespace-nowrap text-[10px] text-slate-400 sm:text-xs">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-500 sm:mt-8 sm:text-sm" data-reveal>
              ※ LINE通知は任意です。事前に登録した機種の情報が通知されます。
            </p>
          </div>
        </div>
      </section>

      {/* 料金・決済 */}
      <section id="pricing" className="border-t border-slate-200 bg-[#cae8f1]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="text-center" data-reveal>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              料金について
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#52a7c1] sm:mt-5 sm:w-28" />
          </div>

          <div className="mt-10 space-y-6 sm:mt-14 sm:space-y-8 lg:space-y-10">
            <div
              className="overflow-hidden rounded-[28px] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:rounded-[34px] sm:px-8 sm:py-8 lg:rounded-[40px] lg:px-14 lg:py-16"
              data-reveal
            >
              <div className="grid gap-6 lg:grid-cols-[140px_1fr] lg:gap-12">
                <div className="flex items-start lg:justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#52a7c1] text-2xl font-semibold text-[#52a7c1] sm:h-20 sm:w-20 sm:text-3xl lg:h-24 lg:w-24 lg:text-4xl">
                    01
                  </div>
                </div>

                <div>
                  <h3 className="inline-block border-b-[5px] border-[#fed169] text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                    月額料金制のサービスですが、
                    <br className="hidden sm:block" />
                    現在は無料でご利用いただけます
                  </h3>

                  <div className="mt-6 grid max-w-5xl gap-6 sm:mt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10">
                    <div>
                      <p className="text-sm leading-relaxed text-slate-700 sm:text-base lg:text-xl">
                        登録・導入・初期設定にかかる費用は一切ありません。
                        <br />
                        <br />
                        まずは実際に使っていただき、取引の現場で本当に役に立つ形へ育てていくことを優先しています。
                        <br />
                        <br />
                        ※将来的に有料化する場合も、事前にご案内します。
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <img
                        src="/lp/plan.png"
                        alt="料金プランのイメージ"
                        className="w-full max-w-[260px] object-contain sm:max-w-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="overflow-hidden rounded-[28px] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:rounded-[34px] sm:px-8 sm:py-8 lg:rounded-[40px] lg:px-14 lg:py-16"
              data-reveal
            >
              <div className="grid gap-6 lg:grid-cols-[140px_1fr] lg:gap-12">
                <div className="flex items-start lg:justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#52a7c1] text-2xl font-semibold text-[#52a7c1] sm:h-20 sm:w-20 sm:text-3xl lg:h-24 lg:w-24 lg:text-4xl">
                    02
                  </div>
                </div>

                <div>
                  <h3 className="inline-block border-b-[5px] border-[#fed169] text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                    安全に取引を進めるための
                    <br className="hidden sm:block" />
                    あんしん決済も無料です
                  </h3>

                  <div className="mt-6 grid max-w-5xl gap-6 sm:mt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10">
                    <div className="space-y-4 text-slate-700">
                      <p className="text-sm leading-relaxed sm:text-base lg:text-xl">
                        GMOあおぞらネット銀行と連携することで、
                        <br className="hidden sm:block" />
                        あんしん決済サービスを無料で提供することを実現しております。
                      </p>

                      <p className="text-sm leading-relaxed sm:text-base lg:text-xl">
                        普段こうしたサービスをご利用の業者様にとっては、
                        <br className="hidden sm:block" />
                        決済関連コストの見直しにつながる可能性があります。
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <img
                        src="/lp/bank.png"
                        alt="あんしん決済のイメージ"
                        className="w-full max-w-[260px] object-contain sm:max-w-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="px-1 text-sm leading-relaxed text-slate-700 sm:px-2 sm:text-base lg:text-lg">
              ※ 掲載内容は現在の提供内容に基づいています。今後料金体系を変更する場合は、事前にご案内します。
            </p>
          </div>
        </div>
      </section>

      {/* 導入フロー */}
      <section className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="text-center" data-reveal>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              導入までの流れ
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#52a7c1] sm:mt-5 sm:w-28" />
          </div>

          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10" data-reveal>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
              登録から取引開始まではシンプルな3ステップで始められます。
            </p>
          </div>

          <div className="mt-10 sm:mt-14" data-reveal>
            <div className="grid gap-8 sm:gap-10 lg:grid-cols-3 lg:gap-12">
              {FLOW_STEPS.map((step) => {
                const Icon = step.Icon;

                return (
                  <div key={step.step} className="relative">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <span className="text-3xl font-bold leading-none tracking-tight text-slate-500 sm:text-4xl lg:text-5xl">
                        0{step.step}
                      </span>

                      <div
                        className={[
                          'flex h-14 w-14 items-center justify-center rounded-2xl border-2 sm:h-16 sm:w-16',
                          step.tone.bg,
                          step.tone.border,
                        ].join(' ')}
                      >
                        <Icon className={['h-7 w-7 sm:h-8 sm:w-8', step.tone.fg].join(' ')} />
                      </div>
                    </div>

                    <h3 className="mt-5 text-xl font-semibold leading-snug text-slate-900 sm:mt-6 sm:text-2xl">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:mt-4 sm:text-base sm:leading-8">
                      {step.description}
                    </p>

                    <div
                      className={[
                        'mt-6 h-1.5 w-full rounded-full sm:mt-8',
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
        <div className="absolute inset-0">
          <img
            src="/lp/campaign-haikei.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-white/60" />
          <div className="absolute inset-0 bg-[#F9C97B]/20 mix-blend-multiply" />
        </div>

        <div className="relative">
          <div
            className="mx-auto w-full max-w-7xl px-4 pt-16 text-center sm:px-6 sm:pt-20 lg:pt-24"
            data-reveal
          >
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              キャンペーン
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#52a7c1] sm:mt-5 sm:w-28" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:pb-24 lg:pt-14">
            <div
              className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white/80 px-4 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:rounded-[32px] sm:px-8 sm:py-8 lg:rounded-[36px] lg:px-14 lg:py-12"
              data-reveal
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(255,255,255,0.72)_42%,rgba(255,255,255,0.38)_100%)]" />

              <div className="relative">
                <div className="relative flex flex-col items-center justify-center text-center">
                  <img
                    src="/lp/kurakka-.png"
                    alt=""
                    className="pointer-events-none absolute -left-10 -top-2 hidden w-32 rotate-[-14deg] drop-shadow-[0_20px_40px_rgba(15,23,42,0.28)] sm:block lg:-left-20 lg:w-80"
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                    <span className="inline-flex items-center rounded-full bg-gradient-to-b from-[#E79B2E] to-[#C97514] px-5 py-3 text-base font-bold tracking-tight text-white shadow-[0_12px_30px_rgba(201,117,20,0.35)] sm:px-8 sm:py-4 sm:text-xl lg:px-10 lg:py-5 lg:text-3xl">
                      体験キャンペーン開催中
                    </span>
                  </div>
                </div>

                <div className="mt-8 text-center sm:mt-10">
                  <p className="text-[clamp(1.4rem,5vw,3rem)] font-bold leading-tight tracking-tight text-slate-700">
                    売っても買っても
                  </p>

                  <p className="mt-2 flex flex-wrap items-end justify-center gap-x-2 gap-y-1 text-slate-700 sm:mt-3">
                    <span className="text-[clamp(1.2rem,4.8vw,3.1rem)] font-bold leading-none">
                      1台ごとに
                    </span>

                    <span className="bg-gradient-to-b from-[#F8C54B] to-[#E39A17] bg-clip-text text-[clamp(2.4rem,10vw,6rem)] font-black leading-none text-transparent">
                      2,000円
                    </span>

                    <span className="text-[clamp(1.2rem,4.8vw,3.1rem)] font-bold leading-none">
                      プレゼント
                    </span>
                  </p>
                </div>

                <div className="mt-8 flex justify-center sm:mt-10">
                  <div className="max-w-2xl rounded-2xl bg-white/72 px-4 py-4 text-left text-xs leading-relaxed text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-6 sm:py-5 sm:text-sm lg:text-base">
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

                <div className="mt-6 flex justify-center sm:hidden">
                  <a
                    href="/register"
                    className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#2A8FA0] px-6 py-3.5 text-sm font-semibold text-white shadow-md"
                  >
                    まずは新規登録
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 実際の画面イメージ */}
      <section className="border-t border-slate-200/70 bg-[#eaeef6]">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-16 sm:px-6 lg:py-20">
          <div className="space-y-3 text-center sm:space-y-4" data-reveal>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              実際の画面イメージ
            </h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-[#52a7c1]" />
            <p className="text-sm text-slate-600 sm:text-base">
              実際の取引の流れや操作画面を一部ご紹介します
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6" data-reveal>
            {PROOF_LITE.map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-50">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="space-y-1.5 px-4 py-4 sm:px-5">
                  <p className="text-lg font-bold text-slate-900 sm:text-xl">
                    {item.title}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 登録 */}
      <section className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            おかげさまで登録が増えています
          </h2>

          <p className="mt-4 text-sm text-slate-600 sm:text-base lg:text-lg">
            現場の運用に合わせて、改善を続けながら広がっています。
          </p>

          <div className="mt-10 sm:mt-12">
            <div className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              販売業者様{' '}
              <span className="text-5xl font-black text-[#2A8FA0] sm:text-7xl lg:text-8xl">
                100
              </span>{' '}
              社以上
            </div>
            <p className="mt-4 text-sm text-slate-600 sm:text-base lg:text-lg">
              ※2026年3月現在
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/lp/city.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3AA6BF]/55 via-[#5CB8CC]/45 to-[#6EC6D6]/55 mix-blend-multiply" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 text-center text-white sm:px-6 sm:py-24 lg:py-32">
          <div className="space-y-5 sm:space-y-6" data-reveal>
            <h2 className="text-3xl font-semibold tracking-wide sm:text-4xl lg:text-5xl">
              Contact
            </h2>
            <p className="text-xs tracking-[0.2em] text-white/90 sm:text-sm">
              お問い合わせ
            </p>

            <p className="mx-auto max-w-2xl text-sm leading-relaxed sm:text-base lg:text-lg">
              パチマートに関するご質問・ご相談はこちらから
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <a
                href="/contact"
                className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-[#F39A2D] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:bg-[#EE8E1E] sm:w-auto sm:px-12 sm:py-4 sm:text-base"
              >
                お問い合わせ
              </a>

              <a
                href="/signup"
                className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-md shadow-black/20 transition hover:-translate-y-0.5 sm:w-auto sm:px-10 sm:py-4 sm:text-base"
              >
                いますぐ新規登録
              </a>
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