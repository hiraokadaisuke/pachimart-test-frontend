import Image from 'next/image';
import Link from 'next/link';

const footerLinks = [
  { label: '会社概要', href: 'https://pachimart.com/company/' },
  { label: '利用規約', href: 'https://pachimart.com/term/' },
  {
    label: 'プライバシーポリシー',
    href: 'https://pachimart.com/privacy-policy-2/',
  },
  { label: 'ご利用ガイド', href: 'https://pachimart.com/guides/' },
  { label: '運営会社', href: 'https://pachimart.com/company/' },
] as const;

export function LpFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#fafafa]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 px-6 py-10 text-center sm:px-8 lg:px-10 lg:py-12">
        <Link
          href="/"
          className="flex items-center"
          aria-label="パチマート トップページへ移動"
        >
          <div className="relative h-10 w-[150px] sm:h-11 sm:w-[164px]">
            <Image
              src="/lp/logo.png"
              alt="パチマート"
              fill
              className="object-contain"
              sizes="(min-width: 640px) 164px, 150px"
            />
          </div>
        </Link>

        <nav aria-label="LPフッターナビゲーション">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            {footerLinks.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a
                  href={link.href}
                  className="transition-colors duration-200 hover:text-slate-950"
                >
                  {link.label}
                </a>
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
