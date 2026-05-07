import Link from 'next/link';
import { listInboundMobile } from '@/features/inventory/inbound-work';

export default async function Page() {
  const rows = await listInboundMobile();

  return (
    <div className='space-y-3 p-3'>
      <h1 className='text-lg font-bold'>入庫予定(スマホ)</h1>
      {rows.length === 0 && <div className='rounded border p-3 text-sm text-slate-500'>表示できる入庫予定はありません。</div>}
      {rows.map((r) => {
        const done = r.status === 'RECEIVED';
        return (
          <div key={r.id} className={`rounded border p-3 text-sm shadow-sm space-y-1 ${done ? 'opacity-60' : 'border-blue-300'}`}>
            <div className='text-xs text-slate-500'>{r.expectedDate.toISOString().slice(0, 10)} / {r.status}</div>
            <div className='text-base font-bold'>{r.modelNameSnapshot}</div>
            <div>{r.quantity}台 / {r.supplierName ?? '取引先未設定'}</div>
            <div className='text-xs'>入庫先: {r.destinationLocation?.name ?? '-'}</div>
            <div className='grid grid-cols-3 gap-1 text-xs'>
              <div>QR {r.progress.qrDoneCount}/{r.progress.total}</div>
              <div>番号 {r.progress.displayCodeDoneCount}/{r.progress.total}</div>
              <div>動確 {r.progress.checkDoneCount}/{r.progress.total}</div>
            </div>
            <Link href={`/inventory/inbounds/${r.id}/work`} className='inline-block rounded border border-slate-300 bg-blue-100 px-2 py-1'>入庫作業</Link>
          </div>
        );
      })}
    </div>
  );
}
