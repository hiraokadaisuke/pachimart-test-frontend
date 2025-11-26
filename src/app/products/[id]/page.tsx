import MainContainer from '@/components/layout/MainContainer';
import { products } from '@/lib/dummyData';

interface ProductDetailPageProps {
  params: { id: string };
}

const formatPrice = (price: number) => `¥${price.toLocaleString()} 税抜`;

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const productId = Number(params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return (
      <MainContainer>
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-slate-700 shadow-sm">
          商品が見つかりません
        </div>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold text-slate-500">{product.maker}</p>
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
            <p className="text-sm font-semibold text-emerald-700">在庫{product.quantity}台（バラ売り可）</p>
            <p className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">詳細情報</h2>
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
              <DetailRow label="種別" value={product.type} />
              <DetailRow label="枠色" value="レッド" />
              <DetailRow label="送料" value={`${product.shippingUnit}個口（1台につき1個口分）`} />
              <DetailRow label="出庫手数料" value={`${product.handlingUnit}個口`} />
              <DetailRow label="釘シート" value={product.hasNailSheet ? 'あり' : 'なし'} />
              <DetailRow label="取扱説明書" value={product.hasManual ? 'あり' : 'なし'} />
              <DetailRow label="引き取り" value={product.allowPickup ? '可' : '不可'} />
              <DetailRow label="撤去日" value={product.removalDate} />
              <DetailRow label="配送までの指定日" value={product.shippingSpecifyDate} />
              <DetailRow label="前設置（都道府県）" value={product.prefecture} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">不備</h2>
            <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              <DetailRow label="目視項目" value="特になし" />
              <DetailRow label="動作項目" value="特になし" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500">遊技機販売業者等</h3>
            <p className="text-lg font-bold text-slate-900">{product.sellerName}</p>
            <div className="space-y-1 text-sm text-slate-700">
              <p>担当者名：田中 太郎</p>
              <p>担当者電話番号：090-1234-5678</p>
              <p>代表番号：03-1234-5678</p>
              <p>評価：★★★☆☆</p>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            出品者さんに質問
          </button>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">購入手続き</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold">ご希望の台数（在庫数{product.quantity}）</label>
                <select className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {Array.from({ length: product.quantity }, (_, idx) => idx + 1).map((num) => (
                    <option key={num}>{num} 台</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">自社引き取りを希望しますか？</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pickup" defaultChecked />
                    希望しない
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pickup" />
                    希望する
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">お届け先</label>
                <select className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>北海道</option>
                  <option>東京都</option>
                  <option>大阪府</option>
                  <option>福岡県</option>
                </select>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">売買実績公開</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="publicity" defaultChecked />
                    公開
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="publicity" />
                    非公開
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              支払い金額を見る
            </button>
          </div>
        </div>
      </div>
    </MainContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
