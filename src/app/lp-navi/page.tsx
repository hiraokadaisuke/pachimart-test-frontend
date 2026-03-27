import Image from 'next/image';
import Link from 'next/link';

type Step = {
  number: string;
  title: string;
  description: string;
  role?: 'buyer' | 'seller' | 'both';
  note?: string;
  image?: string;
  tall?: boolean;
};

const SIMPLE_STEPS = [
  {
    title: '電話で条件決定',
    description: 'まずは物件を見つけて、いつものように電話で条件を確認します。',
  },
  {
    title: '売り手がナビ作成',
    description: '電話で決まった内容を、売り手がナビに登録します。',
  },
  {
    title: '買い手が承認して取引開始',
    description: '買い手が内容を確認・承認すると、取引がそのまま進行します。',
  },
];

const DETAILED_STEPS: Step[] = [
  {
    number: '01',
    title: '物件を検索',
    description:
      '出品一覧から、購入する物件を検索します。メーカー名や機種名、条件を見ながら問い合わせ先を確認します。',
    role: 'buyer',
    image: '/lp/step01-search.png',
  },
  {
    number: '02',
    title: '電話で問い合わせ',
    description:
      '詳細条件や在庫状況、価格などを電話で確認します。ここは従来の取引フローと同じです。',
    role: 'both',
    image: '/lp/step02-phone.png',
  },
  {
    number: '03',
    title: '売り手がナビを作成',
    description:
      '電話で決まった内容をもとに、売り手がナビを作成します。出品一覧から作成する方法と、「ナビ作成」から作成する方法の2パターンがあります。',
    role: 'seller',
    note: '※ ここはキャプチャを2枚並べても分かりやすいです',
    image: '/lp/step03-create.png',
  },
  {
    number: '04',
    title: '買い手が届いたナビを承認',
    description:
      '買い手側に届いたナビを開き、内容を確認して承認します。条件に問題がないか、この画面で最終確認できます。',
    role: 'buyer',
    image: '/images/navi/step04-approve.png',
  },
  {
    number: '05',
    title: '買い手が発送日までに支払い',
    description:
      '承認後、買い手は発送日までにお支払いを行います。取引状況もナビ上で確認できます。',
    role: 'buyer',
    image: '/images/navi/step05-payment.png',
  },
  {
    number: '06',
    title: '売り手は入金後に発送',
    description:
      '売り手は入金を確認後、発送対応を行います。発送予定日に向けて準備を進めます。',
    role: 'seller',
    image: '/images/navi/step06-shipping.png',
  },
  {
    number: '07',
    title: '買い手は到着後に動作確認',
    description:
      '商品到着後、買い手は内容や状態を確認し、必要な動作確認を行います。',
    role: 'buyer',
    image: '/images/navi/step07-check.png',
  },
  {
    number: '08',
    title: '売り手に入金',
    description:
      '買い手側の確認完了後、売り手へ入金されて取引完了です。最後まで状況を見える形で進められます。',
    role: 'seller',
    image: '/images/navi/step08-complete.png',
  },
];

const ROLE_STYLES = {
  buyer: {
    label: '買い手',
    className: 'border border-sky-200 bg-sky-50 text-sky-700',
  },
  seller: {
    label: '売り手',
    className: 'border border-orange-200 bg-orange-50 text-orange-700',
  },
  both: {
    label: '双方',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

function CaptureImage({
  src,
  alt,
  tall = false,
}: {
  src: string;
  alt: string;
  tall?: boolean;
}) {
  return (
    <div
      className={[
        'relative w-full overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-sm',
        tall ? 'min-h-[320px] sm:min-h-[380px]' : 'min-h-[260px] sm:min-h-[320px]',
      ].join(' ')}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
      />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-sm font-semibold tracking-[0.18em] text-[#52a7c1]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function LpNaviPage() {
  return (
    <main className="bg-[#F7FBFD] text-slate-900">

        
      <section className="border-b border-slate-200 bg-white">
  <div className="mx-auto w-full max-w-5xl px-6 py-14">
    
    <p className="text-xs font-semibold tracking-[0.22em] text-[#52a7c1]">
      NAVI GUIDE
    </p>

    <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-6xl">
      ナビ機能の使い方
    </h1>

    <p className="mt-4 text-xl font-semibold text-slate-900">
      取引の流れを、画面を見ながらご案内します。
    </p>

    <p className="mt-3 text-xl text-slate-600 sm:text-xl">
      電話で決めた内容を、画面上で確認しながら進められるのがナビ機能です。
    </p>

  </div>
</section>

      {/* Detailed timeline */}
      <section id="flow" className="bg-[#3871ab]">
        <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-14 lg:pt-8 lg:pb-16">
          <div className="mt-14 space-y-8">
            {DETAILED_STEPS.map((step, index) => {
              const roleStyle = step.role ? ROLE_STYLES[step.role] : null;

              return (
                <div key={step.number} className="relative">
                  {index !== DETAILED_STEPS.length - 1 ? (
                    <div className="absolute left-6 top-16 hidden h-[calc(100%+2rem)] w-px bg-slate-200 lg:block" />
                  ) : null}

                  <div className="grid gap-6 lg:grid-cols-[72px_1fr] lg:gap-8">
                    <div className="hidden lg:flex">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#52a7c1] text-sm font-bold text-white shadow-sm">
                        {step.number}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-[#F7FBFD] p-5 sm:p-7 lg:p-8">
                      <div className="mb-5 flex items-center gap-3 lg:hidden">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#52a7c1] text-sm font-bold text-white shadow-sm">
                          {step.number}
                        </div>
                        {roleStyle ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleStyle.className}`}
                          >
                            {roleStyle.label}
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                        <div>
                          <CaptureImage
                            src={step.image || '/images/navi/placeholder.png'}
                            alt={step.title}
                            tall={step.tall}
                          />
                        </div>

                        <div>
                          <div className="hidden lg:block">
                            {roleStyle ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleStyle.className}`}
                              >
                                {roleStyle.label}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-0 text-2xl font-bold leading-tight text-slate-900 lg:mt-4">
                            {step.title}
                          </h3>

                          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                            {step.description}
                          </p>

                          {step.note ? (
                            <p className="mt-4 text-sm leading-relaxed text-slate-500">
                              {step.note}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

     
      {/* CTA */}
      <section className="border-t border-slate-200 bg-[#ffffff]">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#52a7c1]">
            START NAVI
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            まずは1件、ナビ機能で
            <br />
            取引の流れを試してみませんか
          </h2>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#52a7c1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              パチマートへ戻る
            </Link>
            <a
              href="#flow"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              もう一度流れを見る
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}