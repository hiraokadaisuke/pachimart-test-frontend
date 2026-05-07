import Link from 'next/link';
import { listInboundMobile } from '@/features/inventory/inbound-work';

type InboundMobileRow = Awaited<ReturnType<typeof listInboundMobile>>[number];

export default async function Page() {
  const rows = await listInboundMobile();

  return (
    <div className='space-y-3'>
      <h1 className='font-bold'>入庫予定(スマホ)</h1>
      {rows.length === 0 && <div className='border p-3 text-sm text-slate-500'>入庫予定はありません。</div>}
      {rows.map((r: InboundMobileRow) => (
        <div key={r.id} className='rounded border p-3 text-sm shadow-sm space-y-1'>
          <div className='font-medium'>{r.modelNameSnapshot} / {r.quantity}台</div>
          <div className='text-slate-700'>QR進捗: {r.progress.qrDone}/{r.progress.total}</div>
          <div className='text-slate-700'>動確進捗: {r.progress.checkDone}/{r.progress.total}</div>
          <Link href={`/inventory/inbounds/${r.id}/work`} className='inline-block border border-slate-300 bg-blue-100 px-2 py-1'>入庫作業</Link>
        </div>
      ))}
    </div>
  );
}
