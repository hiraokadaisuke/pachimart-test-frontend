"use client";

import { useEffect } from "react";

const HERO_BADGES = [
  "月額利用料：無料（サービス拡大中）",
  "安心決済費用：無料",
  "社内アカウント：20名まで無料",
];

const RELIEF_CARDS = [
  "電話での問い合わせ・条件調整は今まで通り",
  "オンライン取引を強制しません",
  "今お使いのサービスと併用できます",
];

const FAQ_ITEMS = [
  "担当者不在で折り返し待ちになる",
  "急ぎの時に連絡がつかない",
  "やり取りの経緯が後から追えない",
];

const NAVI_CARDS = ["取引の進捗管理", "履歴管理", "社内共有"];

const OPPORTUNITY_CARDS = [
  {
    title: "オンライン問い合わせ",
    body: "営業時間外でも受付可能",
  },
  {
    title: "即決売買",
    body: "条件が合えば即座に成約",
  },
];

const NOTIFY_ITEMS = [
  {
    title: "新着出品",
    body: "CRO○○○ 5台 / 関東エリア",
    time: "1分前",
  },
  {
    title: "成約情報",
    body: "パチスロ○○○ ¥XX,XXX / 10台",
    time: "5分前",
  },
  {
    title: "相場速報",
    body: "CRO○○○ 平均価格が上昇中",
    time: "30分前",
  },
];

const COST_CARDS = [
  {
    title: "月額利用料",
    value: "無料",
  },
  {
    title: "初期費用",
    value: "なし",
  },
  {
    title: "契約縛り",
    value: "なし",
  },
];

const FLOW_STEPS = [
  {
    step: "1",
    title: "無料登録",
  },
  {
    step: "2",
    title: "基本情報・通知設定",
  },
  {
    step: "3",
    title: "いつものやり方で取引開始",
  },
];

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
    <main className="bg-white text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -top-24 right-10 h-80 w-80 rounded-full bg-slate-100/80 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-slate-100/70 blur-3xl" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-20 px-6 py-32 lg:grid-cols-[minmax(0,520px)_1fr] lg:py-40">
          <div className="space-y-8" data-reveal>
            <p className="text-sm font-medium tracking-[0.2em] text-slate-400">
              安心感のある取引へ
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              今お使いの取引方法は、
              <br />
              そのままで。
            </h1>
            <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
              電話での問い合わせを中心に、
              <br />
              必要なところだけオンラインも使える
              <br />
              中古パチンコ・スロット売買プラットフォーム。
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800">
                無料で登録する
              </button>
              <button className="rounded-full border border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400">
                出品一覧を見る
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {HERO_BADGES.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              無理に運用を変える必要はありません
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3" data-reveal>
            {RELIEF_CARDS.map((text, index) => (
              <div
                key={text}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-400">{`0${index + 1}`}</p>
                <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-900">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              こんな場面、ありませんか？
            </h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200" data-reveal>
            {FAQ_ITEMS.map((item) => (
              <div key={item} className="py-6 sm:py-8">
                <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-6 py-24 lg:py-32">
          <div className="text-center" data-reveal>
            <h2 className="text-3xl font-semibold leading-relaxed text-slate-900 sm:text-4xl">
              今まで通りの取引に、使えます
            </h2>
            <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
              電話でのやり取りを中心に、
              <br />
              必要なところだけオンラインも使えます。
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              取引ナビ機能（標準搭載）
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3" data-reveal>
            {NAVI_CARDS.map((card) => (
              <div
                key={card}
                className="rounded-2xl border border-slate-200 bg-white p-8 text-lg font-semibold text-slate-900 shadow-sm"
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              取引のきっかけを、逃さないために
            </h2>
          </div>
          <div className="grid gap-10 lg:grid-cols-2" data-reveal>
            {OPPORTUNITY_CARDS.map((card) => (
              <div key={card.title} className="rounded-2xl bg-white p-10 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              探さなくても、情報が届きます
            </h2>
          </div>
          <div
            className="rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm lg:p-14"
            data-reveal
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              {NOTIFY_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {item.title}
                    </p>
                    <p className="mt-1 text-base text-slate-600">
                      {item.body}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              まずは、費用をかけずに使えます
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3" data-reveal>
            {COST_CARDS.map((card) => (
              <div key={card.title} className="rounded-2xl bg-white p-10 shadow-sm">
                <p className="text-base font-semibold text-slate-500">
                  {card.title}
                </p>
                <p className="mt-6 text-5xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              導入フロー
            </h2>
          </div>
          <div
            className="flex flex-col items-center justify-center gap-10 text-center lg:flex-row"
            data-reveal
          >
            {FLOW_STEPS.map((step, index) => (
              <div key={step.step} className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 text-2xl font-semibold text-slate-700">
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

      <section className="bg-slate-900">
        <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:py-36">
          <div
            className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 p-12 text-white shadow-2xl"
            data-reveal
          >
            <div className="max-w-3xl space-y-8">
              <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
                今すぐ始められます
              </h2>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5">
                  無料で登録する
                </button>
                <button className="rounded-full border border-white/50 px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white">
                  出品一覧を見る
                </button>
              </div>
              <div className="pt-8 text-sm text-slate-400">
                <p>パチマート</p>
                <p>© 2026 All rights reserved.</p>
              </div>
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
