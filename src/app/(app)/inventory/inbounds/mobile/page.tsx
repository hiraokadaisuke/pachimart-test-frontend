import Link from 'next/link';
import { listInboundMobile } from '@/features/inventory/inbound-work';

export default async function Page() {
  const rows = await listInboundMobile();

  return (
    <div className='mx-auto max-w-md space-y-3 bg-white p-3'>
      <header className='flex items-center justify-between rounded border border-slate-200 px-3 py-2'>
        <div className='text-xs font-semibold text-emerald-700'>▣ 在庫管理システム（倉庫）</div><div className='text-slate-500'>☰</div>
      </header>
      <h1 className='text-lg font-bold'>入庫予定一覧</h1>
      <p className='text-xs text-slate-600'>入庫予定の一覧です。QRコードを読み取ると入庫作業に進めます。</p>
      <input className='w-full rounded border border-slate-300 px-3 py-2 text-sm' placeholder='機種名・仕入先で絞り込み' />
      <div className='grid grid-cols-4 gap-1 text-xs'>
        {['すべて', '未入庫', '入庫中', '入庫済'].map((label, idx) => <button key={label} className={`rounded border px-2 py-1.5 ${idx === 0 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700'}`}>{label}<span className='ml-1 rounded bg-slate-100 px-1'>{idx === 0 ? rows.length : 0}</span></button>)}
      </div>
      {rows.length === 0 && <div className='rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600'>入庫予定はありません。PCの在庫登録または販売/仕入情報から入庫予定を作成してください。</div>}
      {rows.map((r) => {
        const done = r.status === 'RECEIVED';
        return (
          <div key={r.id} className={`rounded border bg-white p-3 text-sm shadow-sm ${done ? 'opacity-70' : 'border-slate-300'} flex gap-3`}>
            <div className='flex-1 space-y-1'>
              <div className='flex items-center gap-2 text-xs'><span className='rounded bg-sky-100 px-2 py-0.5 text-sky-700'>入庫予定</span><span className='rounded bg-slate-100 px-2 py-0.5'>{r.expectedDate.toISOString().slice(0, 10)}</span></div>
              <div className='text-lg font-bold leading-tight'>{r.modelNameSnapshot}</div>
              <div className='text-xs text-slate-600'>{r.supplierName ?? '取引先未設定'} / {r.quantity}台</div>
              <div className='text-xs text-slate-500'>保管倉庫: {r.destinationLocation?.name ?? '-'}</div>
            </div>
            <Link href={`/inventory/inbounds/${r.id}/work`} className='inline-flex min-h-[84px] items-center rounded border border-emerald-700 bg-emerald-600 px-3 text-xs font-semibold text-white'>QR読取</Link>
          </div>
        );
      })}
      <nav className='sticky bottom-2 grid grid-cols-5 gap-1 rounded border border-slate-200 bg-white p-1 text-[11px]'>
        {['入庫予定', '入庫作業', '出庫作業', '在庫照会', 'メニュー'].map((item) => <div key={item} className='rounded px-1 py-2 text-center text-slate-700'>{item}</div>)}
      </nav>
    </div>
  );
}
