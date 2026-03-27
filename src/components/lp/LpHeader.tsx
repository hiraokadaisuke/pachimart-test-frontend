'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type NavLink = {
  label: string;
  href: string;
  variant?: 'featured';
};

const navLinks: NavLink[] = [
  { label: 'ホーム', href: '/' },
  {
    label: '出品一覧',
    href: 'https://pachimart.jp/search/exhibit?kind=1&sort%5Btarget%5D=updated_at&sort%5Bdesc_order%5D=1',
    variant: 'featured',
  },
  { label: '料金体系', href: '#pricing' },
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
];

const ctaLink = {
  label: 'お問い合わせ',
  href: 'https://pachimart.com/contact/',
} as const;

function scrollToPricing() {
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
}

function HeaderLink({
  href,
  label,
  variant,
  onNavigate,
  mobile = false,
}: {
  href: string;
  label: string;
  variant?: 'featured';
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const baseClassName = mobile
    ? 'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-950'
    : 'transition-colors duration-200 hover:text-slate-950';

  const featuredClassName = mobile
    ? 'inline-flex w-full items-center justify-center rounded-full bg-[#52a7c1] px-4 py-3 text-sm font-bold text-white shadow-md transition duration-200 hover:bg-[#3e8fa6]'
    : 'inline-flex h-10 items-center justify-center rounded-full bg-[#52a7c1] px-4 text-[13px] font-bold text-white shadow-md transition duration-200 hover:bg-[#3e8fa6] hover:shadow-[0_12px_24px_-14px_rgba(82,167,193,0.9)] xl:text-sm';

  const className =
    variant === 'featured' ? featuredClassName : baseClassName;

  if (href === '#pricing') {
    return (
      <a
        href={href}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          scrollToPricing();
          onNavigate?.();
        }}
      >
        <span>{label}</span>
        {mobile && variant !== 'featured' ? (
          <span className="text-slate-400">›</span>
        ) : null}
      </a>
    );
  }

  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onNavigate?.()}
      >
        <span>{label}</span>
        {mobile && variant !== 'featured' ? (
          <span className="text-slate-400">↗</span>
        ) : null}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={() => onNavigate?.()}>
      <span>{label}</span>
      {mobile && variant !== 'featured' ? (
        <span className="text-slate-400">›</span>
      ) : null}
    </Link>
  );
}

function HamburgerButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
      aria-expanded={open}
      aria-controls="lp-mobile-menu"
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
    >
      <span className="relative block h-4 w-5">
        <span
          className={`absolute left-0 top-0 h-[2px] w-5 rounded-full bg-current transition-all duration-200 ${
            open ? 'top-[7px] rotate-45' : ''
          }`}
        />
        <span
          className={`absolute left-0 top-[7px] h-[2px] w-5 rounded-full bg-current transition-all duration-200 ${
            open ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`absolute left-0 top-[14px] h-[2px] w-5 rounded-full bg-current transition-all duration-200 ${
            open ? 'top-[7px] -rotate-45' : ''
          }`}
        />
      </span>
    </button>
  );
}

export function LpHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        <Link
          href="/"
          className="flex items-center"
          aria-label="パチマート トップページへ移動"
          onClick={closeMenu}
        >
          <div className="relative h-9 w-[138px] sm:h-10 sm:w-[148px] lg:h-12 lg:w-[176px]">
            <Image
              src="/lp/logo.png"
              alt="パチマート"
              fill
              priority
              className="object-contain object-left"
              sizes="(min-width: 1024px) 176px, (min-width: 640px) 148px, 138px"
            />
          </div>
        </Link>

        <div className="hidden lg:flex lg:items-center lg:gap-6">
          <nav aria-label="LPナビゲーション">
            <ul className="flex items-center gap-x-5 text-[13px] font-semibold tracking-[0.01em] text-slate-700 xl:gap-x-6 xl:text-sm">
              {navLinks.map((link) => (
                <li
                  key={`${link.label}-${link.href}`}
                  className="whitespace-nowrap"
                >
                  <HeaderLink
                    href={link.href}
                    label={link.label}
                    variant={link.variant}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={ctaLink.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#f7941d] px-6 text-sm font-bold text-white shadow-[0_12px_24px_-14px_rgba(247,148,29,0.95)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ef8610] hover:shadow-[0_18px_30px_-16px_rgba(247,148,29,0.95)]"
          >
            {ctaLink.label}
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={ctaLink.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#f7941d] px-4 text-[13px] font-bold text-white shadow-[0_12px_24px_-14px_rgba(247,148,29,0.95)] transition duration-200 hover:bg-[#ef8610]"
          >
            お問い合わせ
          </a>

          <HamburgerButton
            open={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          />
        </div>
      </div>

      <div
        className={`lg:hidden ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`fixed inset-0 top-[68px] z-30 bg-slate-900/25 transition-opacity duration-200 sm:top-[72px] ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMenu}
        />

        <div
          id="lp-mobile-menu"
          className={`absolute left-0 right-0 top-full z-40 border-t border-slate-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-all duration-200 ${
            menuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0'
          }`}
        >
          <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6">
            <nav aria-label="モバイルナビゲーション">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <HeaderLink
                      href={link.href}
                      label={link.label}
                      variant={link.variant}
                      mobile
                      onNavigate={closeMenu}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <a
                href={ctaLink.href}
                target="_blank"
                rel="noreferrer"
                onClick={closeMenu}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#f7941d] px-6 text-sm font-bold text-white shadow-[0_12px_24px_-14px_rgba(247,148,29,0.95)] transition duration-200 hover:bg-[#ef8610]"
              >
                {ctaLink.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}