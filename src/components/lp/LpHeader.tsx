'use client';

import Image from 'next/image';
import Link from 'next/link';

const navLinks = [
  { label: 'ホーム', href: '/' },
  { label: '料金体系', href: '#pricing' },
  {
    label: '出品一覧',
    href: 'https://pachimart.jp/search/exhibit?kind=1&sort%5Btarget%5D=updated_at&sort%5Bdesc_order%5D=1',
  },
  {
    label: '登録業者様一覧',
    href: 'https://pachimart.com/registered-sellers/',
  },
  { label: 'ご利用ガイド', href: 'https://pachimart.com/guides/' },
  { label: '会社概要', href: 'https://pachimart.com/company/' },
  {
    label: 'ログイン',
    href: 'https://pachimart.jp/login?redirectTo=/mypage/exhibits',
  },
  { label: '新規登録', href: 'https://pachimart.jp/register' },
] as const;

const ctaLink = {
  label: 'お問い合わせ',
  href: 'https://pachimart.com/contact/',
} as const;

function HeaderLink({ href, label }: { href: string; label: string }) {
  if (href === '#pricing') {
    return (
      <a
        href={href}
        className="transition-colors duration-200 hover:text-slate-950"
        onClick={(event) => {
          event.preventDefault();
          const pricingSection = document.getElementById('pricing');
          if (!pricingSection) return;

          const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
          ).matches;
          pricingSection.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
          window.history.replaceState(null, '', '#pricing');
        }}
      >
        {label}
      </a>
    );
  }

  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        className="transition-colors duration-200 hover:text-slate-950"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="transition-colors duration-200 hover:text-slate-950"
    >
      {label}
    </Link>
  );
}

export function LpHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 xl:px-10">
        <Link
          href="/"
          className="flex items-center"
          aria-label="パチマート トップページへ移動"
        >
          <div className="relative h-10 w-[148px] sm:h-11 sm:w-[164px] lg:h-12 lg:w-[176px]">
            <Image
              src="/lp/logo.png"
              alt="パチマート"
              fill
              priority
              className="object-contain object-left"
              sizes="(min-width: 1024px) 176px, (min-width: 640px) 164px, 148px"
            />
          </div>
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-6">
          <nav aria-label="LPナビゲーション" className="overflow-x-auto">
            <ul className="flex min-w-max flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold tracking-[0.01em] text-slate-700 lg:justify-end lg:gap-x-5 xl:gap-x-6 xl:text-sm">
              {navLinks.map((link) => (
                <li
                  key={`${link.label}-${link.href}`}
                  className="whitespace-nowrap"
                >
                  <HeaderLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={ctaLink.href}
            className="inline-flex h-11 shrink-0 items-center justify-center self-start rounded-full bg-[#f7941d] px-6 text-sm font-bold text-white shadow-[0_12px_24px_-14px_rgba(247,148,29,0.95)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ef8610] hover:shadow-[0_18px_30px_-16px_rgba(247,148,29,0.95)] lg:self-auto"
          >
            {ctaLink.label}
          </a>
        </div>
      </div>
    </header>
  );
}
