import { Suspense } from 'react';

import ProductListPage from '@/components/products/ProductListPage';

export default function ProductsPage() {
  return (
    <div className="w-full max-w-none mx-0 px-0 bg-white">
      <Suspense fallback={<div className="px-4 py-6 text-sm text-slate-600">読み込み中...</div>}>
        <ProductListPage />
      </Suspense>
    </div>
  );
}
