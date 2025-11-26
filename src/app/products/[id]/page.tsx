interface ProductDetailPageProps {
  params: { id: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-slate-700 shadow-sm">
      TODO: 商品詳細ページ（ID: {params.id}）
    </div>
  );
}
