import Image from 'next/image';
import Link from 'next/link';

const footerLinks = [
  { label: '会社概要', href: '/company' },
  { label: '利用規約', href: '/terms' },
  { label: 'プライバシーポリシー', href: '/privacy' },
  { label: 'ご利用ガイド', href: '/guide' },
  { label: '運営会社', href: '/company' },
] as const;

export function LpFooter() {
  return (
    <footer className="border-t border-[#e5e7eb] bg-[#fbfcfd]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 py-10 text-center sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center"
          aria-label="パチマート トップページへ移動"
        >
          <div className="relative h-10 w-[144px] sm:h-11 sm:w-[156px]">
            <Image
              src="/lp/logo.png"
              alt="パチマート"
              fill
              className="object-contain"
              sizes="156px"
            />
          </div>
        </Link>

        <nav aria-label="LPフッターナビゲーション">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            {footerLinks.map((link) => (
              <li key={`${link.label}-${link.href}`}>
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

        <p className="text-xs leading-6 text-slate-500 sm:text-sm">
          © 2025 パチマート｜パチンコ業者様向け中古機売買サイト All Rights
          Reserved.
        </p>
      </div>
    </footer>
  );
}
