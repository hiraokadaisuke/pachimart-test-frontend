"use client";

import { useEffect } from "react";

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
    <main className="relative overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-100 via-slate-100 to-emerald-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gradient-to-br from-slate-100 to-transparent blur-2xl" />
        <div className="noise-layer" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 sm:pt-24">
        <div className="space-y-6" data-reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            取引の不安を、静かに整える
          </div>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            今お使いの取引方法は、そのままで。
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            電話での問い合わせを中心に、
            <br />
            必要なところだけオンラインも使える
            <br />
            中古パチンコ・スロット売買プラットフォーム。
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {[
              "月額利用料：無料（サービス拡大中）",
              "安心決済費用：無料",
              "社内アカウント：20名まで無料",
            ].map((item) => (
              <span
                key={item}
                className="animate-float rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-md shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800">
              無料で登録する
            </button>
            <button className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400">
              出品一覧を見る
            </button>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3" data-reveal>
          {[
            {
              title: "無理に運用を変える必要はありません",
              items: [
                "電話での問い合わせ・条件調整は今まで通り",
                "オンライン取引を強制しません",
                "今お使いのサービスと併用できます",
              ],
            },
            {
              title: "こんな場面、ありませんか？",
              items: [
                "担当者不在で折り返し待ちになる",
                "急ぎの時に連絡がつかない",
                "やり取りの経緯が後から追えない",
              ],
            },
            {
              title: "今まで通りの取引に、使えます",
              description:
                "電話でのやり取りを中心に、必要なところだけオンラインも使えます。",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-slate-200 bg-white/80 p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-900">
                {card.title}
              </h2>
              {card.items ? (
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                  {card.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {card.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-12 px-6 pb-20" data-reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              取引ナビ機能（標準搭載）
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {["取引の進捗管理", "履歴管理", "社内共有"].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">取引のきっかけを、逃さないために</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {["オンライン問い合わせ", "即決売買"].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              必要な瞬間だけ、静かにオンラインを補助します。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20" data-reveal>
        <div className="grid items-center gap-10 rounded-lg border border-slate-200 bg-white/80 p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">探さなくても、情報が届きます</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                "出品情報の速報",
                "成約情報の速報",
                "相場感をつかむための通知",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative space-y-3">
            <div className="absolute -left-4 top-4 h-20 w-20 rounded-full bg-emerald-100 blur-2xl" />
            {[
              {
                title: "速報",
                body: "成約情報が更新されました",
              },
              {
                title: "出品速報",
                body: "人気カテゴリに新着が入りました",
              },
              {
                title: "相場通知",
                body: "平均価格が動き始めています",
              },
            ].map((toast, index) => (
              <div
                key={toast.body}
                className="toast-card relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-xs font-semibold text-emerald-600">
                  {toast.title}
                </div>
                <p className="mt-1 text-sm text-slate-700">{toast.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-12 px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-3" data-reveal>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              まずは、費用をかけずに使えます
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {["月額利用料：無料", "初期費用なし", "契約縛りなし"].map(
                (item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold">ご利用開始までの流れ</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                "1. 無料登録",
                "2. 基本情報・通知設定",
                "3. いつものやり方で取引開始",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24" data-reveal>
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-slate-200 bg-white/90 p-8 shadow-sm sm:flex-row sm:items-center">
          <h3 className="text-xl font-semibold">まずは、無料でお試しください</h3>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-md shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800">
              無料で登録する
            </button>
            <button className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400">
              まずは相談する
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .noise-layer {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#dfe4eb 0.5px, transparent 0.5px);
          background-size: 18px 18px;
          opacity: 0.25;
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .toast-card {
          animation: toastFloat 3.6s ease-in-out infinite;
        }

        .animate-float {
          animation: badgeFloat 4s ease-in-out infinite;
        }

        @keyframes badgeFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes toastFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </main>
  );
}
