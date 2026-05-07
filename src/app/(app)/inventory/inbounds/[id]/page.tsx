import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInboundWork } from '@/features/inventory/inbound-work';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getInboundWork(id);
  if (!s) return notFound();
  return <div className='p-4 space-y-3 text-sm'>
    <h1 className='text-lg font-bold'>入庫予定詳細</h1>
    <div>{s.modelNameSnapshot} / {s.status} / {s.expectedDate.toISOString().slice(0,10)}</div>
    <div>進捗: Unit {s.progress.unitRegisteredCount}/{s.progress.total} QR {s.progress.qrDoneCount}/{s.progress.total} 番号 {s.progress.displayCodeDoneCount}/{s.progress.total} 動確 {s.progress.checkDoneCount}/{s.progress.total}</div>
    <Link className='underline' href={`/inventory/inbounds/${id}/work`}>入庫作業へ</Link>
    <ul className='space-y-1'>
      {s.inventoryUnits.map((u, idx)=><li key={u.id} className='border p-2'>{idx+1}. {u.displayCode ?? '-'} / {u.rawQr ? 'QR済':'QR未'} / {u.memo ?? '-'}</li>)}
    </ul>
  </div>;
}
