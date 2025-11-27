"use client";

import MainContainer from '@/components/layout/MainContainer';
import { products } from '@/lib/dummyData';
import { calculateQuote, type QuoteResult } from '@/lib/quotes/calculateQuote';
import { useMemo, useState } from 'react';

interface ProductDetailPageProps {
  params: { id: string };
}

const formatPrice = (price: number) => `¥${price.toLocaleString()} 税抜`;
const formatCurrency = (value: number) => `¥${value.toLocaleString()}`;

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const productId = Number(params.id);
  const product = products.find((item) => item.id === productId);

  const [quantity, setQuantity] = useState(1);
  const [selfPickup, setSelfPickup] = useState(false);
  const [deliveryWarehouseId, setDeliveryWarehouseId] = useState('wh-01');
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(false);

  const fallbackWarehouse = product?.warehouseName ?? '未設定の倉庫';
  const unitPrice = product?.price ?? 0;

  const warehouses = useMemo(
    () => [
      { id: 'wh-01', name: fallbackWarehouse },
      { id: 'wh-02', name: '東京第2倉庫' },
      { id: 'wh-03', name: '名古屋ハブ倉庫' },
      { id: 'wh-04', name: '九州ロジスティクス' },
    ],
    [fallbackWarehouse],
  );

  const quoteInput = useMemo(
    () => ({
      unitPrice,
      quantity,
      shippingFee: selfPickup ? 0 : 7500 * quantity,
      handlingFee: 5000 * quantity,
      taxRate: 0.1,
    }),
    [quantity, selfPickup, unitPrice],
  );

  if (!product) {
    return (
      <MainContainer>
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-slate-700 shadow-sm">
          商品が見つかりません
        </div>
      </MainContainer>
    );
  }

  const handleCalculateQuote = () => {
    const result = calculateQuote(quoteInput);
    setQuoteResult(result);
  };

  const handleOfferClick = () => {
    const result = calculateQuote(quoteInput);
    setQuoteResult(result);

    const offerPayload = {
      productId: product.id,
      quantity,
      selfPickup,
      deliveryWarehouseId,
      quote: result,
    };

    console.log('Offer payload for TradeNavi draft:', offerPayload);
  };

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
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500">遊技機販売業者等</h3>
            <p className="text-lg font-bold text-slate-900">{product.sellerName}</p>
            <p className="text-sm text-slate-600">
              担当者名：田中 太郎 / 代表番号：03-1234-5678
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
              onClick={() => setShowPhoneNumbers((prev) => !prev)}
            >
              電話で相談する
            </button>
            <p className="text-xs leading-relaxed text-slate-600">
              電話で条件がまとまった後は、売手様から取引Naviが送られてきます。パチマート上で内容を確認し、承認するだけでお取引が成立します。
            </p>
            {showPhoneNumbers && (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-800">
                <p className="font-semibold">担当者電話番号：090-1234-5678</p>
                <p className="font-semibold">会社電話番号：03-1234-5678</p>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">購入条件の入力</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold">ご希望の台数（在庫数{product.quantity}）</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                >
                  {Array.from({ length: product.quantity }, (_, idx) => idx + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} 台
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">自社引き取りを希望しますか？</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pickup"
                      value="no"
                      checked={!selfPickup}
                      onChange={() => setSelfPickup(false)}
                    />
                    希望しない
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pickup"
                      value="yes"
                      checked={selfPickup}
                      onChange={() => setSelfPickup(true)}
                      disabled={!product.allowPickup}
                    />
                    <span className={!product.allowPickup ? 'text-slate-400 line-through' : ''}>希望する</span>
                    {!product.allowPickup && <span className="text-xs text-slate-400">（出品者設定で不可）</span>}
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">お届け先（倉庫）</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={deliveryWarehouseId}
                  onChange={(event) => setDeliveryWarehouseId(event.target.value)}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700"
              onClick={handleCalculateQuote}
            >
              金額を試算する
            </button>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">金額サマリー</h3>
              <p className="text-xs text-slate-500">税込表示</p>
            </div>

            {quoteResult ? (
              <div className="space-y-3 text-sm text-slate-700">
                <SummaryRow label="商品代金" value={formatCurrency(quoteResult.productSubtotal)} />
                <SummaryRow label="送料" value={formatCurrency(quoteResult.shippingFee)} />
                <SummaryRow label="出庫手数料" value={formatCurrency(quoteResult.handlingFee)} />
                <SummaryRow label="小計" value={formatCurrency(quoteResult.subtotal)} />
                <SummaryRow label="消費税" value={formatCurrency(quoteResult.tax)} />
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-base font-semibold text-slate-900">合計</span>
                  <span className="text-xl font-bold text-emerald-700">{formatCurrency(quoteResult.total)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">金額を試算すると、ここに概算が表示されます。</p>
            )}
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
            onClick={handleOfferClick}
          >
            オンラインでオファーする
          </button>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
