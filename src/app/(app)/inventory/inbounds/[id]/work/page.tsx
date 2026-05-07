import { completeInboundSchedule } from '@/features/inventory/server';
import { getInboundWork, saveInboundWork } from '@/features/inventory/inbound-work';
import { notFound, redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getInboundWork(id);
  if (!s) return notFound();

  async function action(fd: FormData) {
    'use server';
    await saveInboundWork(id, fd);
    redirect(`/inventory/inbounds/${id}/work`);
  }

  async function completeAction() {
    'use server';
    const current = await getInboundWork(id);
    if (!current) throw new Error('not found');
    if (current.progress.unitRegisteredCount < current.quantity) throw new Error('台数不足のため完了できません');
    if (current.progress.displayCodeDoneCount < current.quantity) throw new Error('displayCode未入力があります');
    if (current.progress.checkDoneCount < current.quantity) throw new Error('動確未完了があります');
    await completeInboundSchedule(id);
    redirect('/inventory/inbound');
  }

  const units = s.inventoryUnits;
  return <div className='space-y-3 p-3 text-sm'>
    <h1 className='text-lg font-bold'>入庫作業</h1>
    <div className='rounded border p-2'>
      <div className='font-semibold'>{s.modelNameSnapshot} / {s.quantity}台</div>
      <div className='text-xs text-slate-600'>QR {s.progress.qrDoneCount}/{s.progress.total} / 番号 {s.progress.displayCodeDoneCount}/{s.progress.total} / 動確 {s.progress.checkDoneCount}/{s.progress.total}</div>
    </div>
    {Array.from({ length: s.quantity }).map((_, i) => {
      const u = units[i];
      return <details key={i} className='rounded border p-2'>
        <summary>{i + 1}台目 / QR:{u?.rawQr ? '済' : '未'} 番号:{u?.displayCode ? '済' : '未'} 動確:{(u?.memo ?? '').includes('動確済') ? '済' : '未'}</summary>
        <form action={action} className='grid gap-1 mt-2'>
          {u && <input type='hidden' name='unitId' value={u.id} />}
          <input name='rawQr' defaultValue={u?.rawQr ?? ''} placeholder='rawQr' className='border p-1' />
          <input name='displayCode' defaultValue={u?.displayCode ?? ''} placeholder='displayCode(正番号)' className='border p-1' />
          <input name='codeType' defaultValue={u?.codeType ?? 'UNKNOWN'} placeholder='codeType' className='border p-1' />
          <input name='memo' defaultValue={u?.memo ?? ''} placeholder='memo / 動確済 など' className='border p-1' />
          <button className='bg-blue-100 border px-2 py-1'>保存</button>
        </form>
      </details>;
    })}
    <form action={completeAction}><button className='rounded border bg-emerald-100 px-3 py-2'>入庫完了</button></form>
  </div>;
}
