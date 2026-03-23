import Image from 'next/image';
import Link from 'next/link';

const navLinks = [
  { label: '出品一覧', href: '/list' },
  { label: 'ご利用ガイド', href: '/guide' },
  { label: '会社概要', href: '/company' },
] as const;

export function LpHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4 sm:px-8 lg:flex-nowrap lg:px-10">
        <Link
          href="/"
          className="flex items-center"
          aria-label="パチマート トップページへ移動"
        >
          <div className="relative h-10 w-[148px] sm:h-11 sm:w-[162px]">
            <Image
              src="/lp/logo.png"
              alt="パチマート"
              fill
              priority
              className="object-contain object-left"
              sizes="162px"
            />
          </div>
        </Link>

        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <nav aria-label="LPナビゲーション" className="w-full sm:w-auto">
            <ul className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-sm font-semibold text-slate-700 sm:justify-end lg:gap-x-7">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-slate-950"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ffb236] to-[#ff7a21] px-7 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(249,115,22,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-16px_rgba(249,115,22,0.95)]"
          >
            無料で登録する
          </Link>
        </div>
      </div>
    </header>
  );
}
