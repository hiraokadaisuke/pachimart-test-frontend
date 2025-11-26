import Link from 'next/link';

const navLinks = [
  { label: '商品一覧', href: '/products' },
  { label: '新規出品', href: '/sell' },
  { label: 'お知らせ', href: '#' },
  { label: 'やる事リスト', href: '#' },
  { label: '商品のコメント', href: '#' },
  { label: 'パチ通知', href: '#' },
];

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:flex-nowrap">
        <div className="flex flex-wrap items-center gap-6 md:flex-nowrap">
          <Link href="/products" className="text-2xl font-extrabold tracking-tight text-sky-800">
            パチマート
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-2 py-1 transition hover:bg-sky-50 hover:text-sky-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 flex-col items-end gap-2 md:flex-none">
          <div className="flex flex-col items-end text-xs leading-tight text-slate-700">
            <span className="font-bold text-slate-900">平岡大祐 さん</span>
            <span className="font-semibold text-sky-800">パチマート残高 ¥2,270,650</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <span className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                パチマート2大新サービス登場!!
              </span>
              <span className="rounded bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                パチ通知 / オファー型売買
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-2 text-sm font-semibold">
              <Link
                href="#"
                className="rounded border border-sky-700 px-3 py-1 text-sky-800 transition hover:bg-sky-50"
              >
                お問い合わせ
              </Link>
              <Link
                href="/mypage/exhibits"
                className="flex items-center gap-1 rounded bg-sky-700 px-3 py-1 text-white shadow hover:bg-sky-800"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sky-700">👤</span>
                <span>マイページ</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
