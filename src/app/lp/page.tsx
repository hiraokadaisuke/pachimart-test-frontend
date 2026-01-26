"use client";

import { useEffect } from "react";

const HERO_BADGES = [
  "月額利用料：無料（サービス拡大中）",
  "安心決済費用：無料",
  "社内アカウント：20名まで無料",
];

const RELIEF_CARDS = [
  {
    title: "電話中心の運用を、そのまま続けられます",
    body: "これまで通り電話でのやり取りを主軸に、必要な場面だけオンラインを補助します。",
  },
  {
    title: "無理なオンライン化は不要です",
    body: "既存の取引フローを崩さず、変えたくない部分はそのまま維持できます。",
  },
  {
    title: "社内共有も自然に",
    body: "担当者が変わっても履歴が残るので、引き継ぎや確認がスムーズです。",
  },
];

const FAQ_ITEMS = [
  "担当者不在で折り返し待ちになる",
  "急ぎの時に連絡がつかない",
  "やり取りの経緯が後から追えない",
  "電話の内容が社内で共有しづらい",
  "探している情報が最新か分からない",
];

const NAVI_CARDS = [
  {
    title: "取引の進捗管理",
    body: "いま何がどこまで進んでいるか、社内で同じ景色を見られます。",
  },
  {
    title: "履歴の整理",
    body: "過去のやり取りをまとめて残せるので、探す手間が減ります。",
  },
  {
    title: "社内共有",
    body: "担当者の不在時も、履歴を見ればすぐに状況が把握できます。",
  },
];

const OPPORTUNITY_CARDS = [
  {
    title: "問い合わせの見落としを防ぐ",
    body: "問い合わせが届いた瞬間に把握できるため、機会を逃しません。",
  },
  {
    title: "即決のタイミングに強くなる",
    body: "動きの早い案件でも、情報が整っているので対応が早くなります。",
  },
];

const NOTIFY_ITEMS = [
  {
    title: "新着情報",
    body: "出品が追加されました",
  },
  {
    title: "成約速報",
    body: "成約情報が更新されました",
  },
  {
    title: "相場通知",
    body: "平均価格が動き始めています",
  },
];

const COST_CARDS = [
  {
    title: "月額利用料",
    highlight: "無料",
    body: "まずは費用を気にせず、安心して試せます。",
  },
  {
    title: "初期費用",
    highlight: "なし",
    body: "導入時の負担を抑えて、すぐに始められます。",
  },
  {
    title: "契約縛り",
    highlight: "なし",
    body: "必要な期間だけ、無理なく使えます。",
  },
];

const FLOW_STEPS = [
  {
    step: "1",
    title: "無料登録",
    body: "基本情報を入力するだけで完了します。",
  },
  {
    step: "2",
    title: "通知設定",
    body: "欲しい情報だけを選んで受け取れます。",
  },
  {
    step: "3",
    title: "いつものやり方で取引開始",
    body: "電話中心のまま、必要な場面だけオンライン。",
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
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-32 lg:flex-row lg:items-center lg:gap-24 lg:py-40">
          <div className="space-y-8" data-reveal style={{ transitionDelay: "100ms" }}>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              安心感のある取引へ
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              今お使いの取引方法は、そのままで。
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              電話での問い合わせを中心に、
              <br />
              必要なところだけオンラインも使える。
              <br />
              いつもの取引に、静かに寄り添うプラットフォームです。
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800">
                無料で登録する
              </button>
              <button className="rounded-xl border border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400">
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
          <div className="hidden h-72 w-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 lg:block" aria-hidden="true" />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              無理に運用を変える必要はありません
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              既存の取引フローをそのまま活かしながら、
              必要なところだけオンラインで補助します。
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3" data-reveal style={{ transitionDelay: "180ms" }}>
            {RELIEF_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-white p-8 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              こんな場面、ありませんか？
            </h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200" data-reveal style={{ transitionDelay: "180ms" }}>
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
          <p
            className="text-center text-3xl font-semibold leading-relaxed text-slate-900 sm:text-4xl"
            data-reveal
            style={{ transitionDelay: "140ms" }}
          >
            今まで通りの取引に、
            <br />
            そっと寄り添う立ち位置です。
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              取引ナビ機能（標準搭載）
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              取引を大げさに変えるのではなく、整理と共有を静かに支えます。
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3" data-reveal style={{ transitionDelay: "180ms" }}>
            {NAVI_CARDS.map((card) => (
              <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              取引のきっかけを、逃さないために
            </h2>
          </div>
          <div className="grid gap-10 lg:grid-cols-2" data-reveal style={{ transitionDelay: "180ms" }}>
            {OPPORTUNITY_CARDS.map((card) => (
              <div key={card.title} className="rounded-xl bg-white p-10 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              探さなくても、情報が届きます
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              必要な情報が自動で届くので、画面を開きに行く手間がありません。
            </p>
          </div>
          <div
            className="rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm lg:p-14"
            data-reveal
            style={{ transitionDelay: "180ms" }}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              {NOTIFY_ITEMS.map((item) => (
                <div
                  key={item.body}
                  className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-md"
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-100" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {item.title}
                    </p>
                    <p className="mt-1 text-base text-slate-600">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              まずは、費用をかけずに使えます
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3" data-reveal style={{ transitionDelay: "180ms" }}>
            {COST_CARDS.map((card) => (
              <div key={card.title} className="rounded-xl bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                  {card.title}
                </p>
                <p className="mt-4 text-5xl font-semibold text-slate-900">
                  {card.highlight}
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal style={{ transitionDelay: "120ms" }}>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              導入フロー
            </h2>
          </div>
          <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center" data-reveal style={{ transitionDelay: "180ms" }}>
            {FLOW_STEPS.map((step, index) => (
              <div key={step.step} className="flex flex-1 flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 text-2xl font-semibold text-slate-700">
                  {step.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {step.body}
                </p>
                {index < FLOW_STEPS.length - 1 && (
                  <div className="mt-6 flex h-10 items-center text-2xl text-slate-300 lg:hidden">
                    ↓
                  </div>
                )}
                {index < FLOW_STEPS.length - 1 && (
                  <div className="hidden h-10 items-center text-3xl text-slate-300 lg:flex">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto w-full max-w-6xl px-6 py-28 lg:py-36">
          <div
            className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-12 text-white shadow-2xl"
            data-reveal
            style={{ transitionDelay: "140ms" }}
          >
            <div className="max-w-3xl space-y-6">
              <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
                いつもの取引のまま、
                <br />
                もっと安心できる環境へ。
              </h2>
              <p className="text-base leading-relaxed text-slate-200 sm:text-lg">
                費用も運用負担も増やさず、
                今の取引に必要な情報だけを丁寧に届けます。
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5">
                  無料で登録する
                </button>
                <button className="rounded-xl border border-slate-500 px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white">
                  まずは相談する
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 600ms ease, transform 600ms ease;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
