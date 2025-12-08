const links = ['会社概要', '利用規約', 'プライバシーポリシー', 'ご利用ガイド', '運送会社'];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 py-4 text-sm text-neutral-800">
        {links.map((link) => (
          <span key={link} className="cursor-pointer hover:text-slate-800">
            {link}
          </span>
        ))}
      </div>
    </footer>
  );
}
