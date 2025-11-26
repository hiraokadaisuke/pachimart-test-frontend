import Link from 'next/link';
import { findItemById, items } from '@/lib/mockData';

export function generateStaticParams() {
  return items.map((item) => ({ id: item.id.toString() }));
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const itemId = Number(params.id);
  const item = findItemById(itemId);

  if (!item) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">アイテムが見つかりませんでした。</p>
        <p className="mt-2 text-sm text-slate-600">URL を確認するか、一覧ページから選択し直してください。</p>
        <div className="mt-4">
          <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-700" href="/items">
            ← 一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-700" href="/items">
        ← 一覧に戻る
      </Link>
      <article className="rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item #{item.id}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{item.name}</h1>
          </div>
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            ¥{item.price.toLocaleString()}
          </span>
        </div>
        <p className="mt-4 text-base text-slate-700">{item.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {tag}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
