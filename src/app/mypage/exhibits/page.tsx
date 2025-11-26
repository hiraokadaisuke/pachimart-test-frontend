import MainContainer from '@/components/layout/MainContainer';
import { products } from '@/lib/dummyData';

const menuSections = [
  {
    title: '商品の管理',
    items: ['出品中', '下書き'],
  },
  {
    title: '取引の管理',
    items: ['購入一覧', '売却一覧'],
  },
  {
    title: 'パチマート残高管理',
    items: ['パチマート残高', '入出金履歴', 'パチマートへの入金口座', 'パチマートからの出金申請', '振込先口座登録・変更'],
  },
  {
    title: '設定',
    items: ['担当者情報の設定', '遊技機保管倉庫の設定'],
  },
];

export default function MyPageExhibitsPage() {
  const listedProducts = products.filter((product) => product.status === '出品中');

  return (
    <MainContainer>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="space-y-4 text-sm text-slate-800">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">{section.title}</p>
                <div className="flex flex-col">
                  {section.items.map((item) => {
                    const isActive = item === '出品中';
                    return (
                      <a
                        key={item}
                        href="/mypage/exhibits"
                        className={`rounded-md px-3 py-2 font-semibold transition-colors ${
                          isActive ? 'bg-slate-100 text-blue-600' : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">出品中の商品</h1>
            <div className="ml-auto">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                新規出品
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600">全件数：{listedProducts.length}件</p>

          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">更新日</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">機種名</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">商品種別</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">出品数</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">販売数</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">残数</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">撤去日</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">状況</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">備考</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {listedProducts.map((product, idx) => {
                  const zebra = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                  return (
                    <tr key={product.id} className={`${zebra} transition-colors`}>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{product.updatedAt}</td>
                      <td className="px-4 py-3 align-top font-semibold text-blue-600">{product.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{product.type}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{product.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">0</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{product.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{product.removalDate}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{product.status}</td>
                      <td className="px-4 py-3 align-top text-slate-600">{product.note ?? '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-700"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            取り下げ
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainContainer>
  );
}
