import Link from 'next/link';
import { items } from '@/lib/mockData';

export const metadata = {
  title: 'アイテム一覧',
};

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">アイテム一覧</h1>
          <p className="text-sm text-slate-600">モックデータで構成されたサンプルのアイテムです。</p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
          {items.length} 件
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
              <span className="text-sm font-semibold text-slate-700">¥{item.price.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-700" href={`/items/${item.id}`}>
                詳細を見る
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
