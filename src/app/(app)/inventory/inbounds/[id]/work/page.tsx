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
  return <div className='mx-auto max-w-md space-y-3 bg-white p-3 text-sm'>
    <h1 className='text-lg font-bold'>入庫作業（QR読取）</h1>
    <p className='text-xs text-slate-600'>機械に貼付されているQRコードを読み取ってください。</p>
    <div className='relative rounded border-2 border-emerald-400 bg-slate-50 p-5 text-center'>
      <div className='absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-emerald-600' />
      <div className='absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-600' />
      <div className='text-3xl'>⌗</div><p className='text-xs text-slate-600'>QRスキャンエリア（カメラ連携準備中）</p><button className='mt-2 rounded border border-slate-300 bg-white px-3 py-1 text-xs'>ライトをON</button>
    </div>
    <div className='rounded border bg-white p-3'>
      <div className='font-semibold'>{s.modelNameSnapshot} / {s.quantity}台</div>
      <div className='text-xs text-slate-600'>QR {s.progress.qrDoneCount}/{s.progress.total} ・ 番号 {s.progress.displayCodeDoneCount}/{s.progress.total} ・ 動確 {s.progress.checkDoneCount}/{s.progress.total}</div>
    </div>
    <details className='rounded border bg-slate-50 p-3' open><summary className='font-semibold'>入庫作業の流れ</summary><ol className='mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-700'><li>入庫予定一覧から対象を選択</li><li>QRコードを読み取る</li><li>機種・台数を確認</li><li>入庫数を入力して登録</li></ol></details>
    {Array.from({ length: s.quantity }).map((_, i) => {
      const u = units[i];
      return <details key={i} className='rounded border bg-white p-2'>
        <summary className='text-xs font-semibold'>{i + 1}台目 / QR:{u?.rawQr ? '済' : '未'} 番号:{u?.displayCode || u?.bodySerialNumber || u?.frameSerialNumber || u?.mainBoardSerialNumber ? '済' : '未'} 動確:{u?.operationCheckStatus && u.operationCheckStatus !== 'NOT_CHECKED' ? '済' : '未'}</summary>
        <form action={action} className='mt-2 grid gap-1'>
          {u && <input type='hidden' name='unitId' value={u.id} />}
          <input name='rawQr' defaultValue={u?.rawQr ?? ''} placeholder='rawQr' className='rounded border p-2' />
          <input name='displayCode' defaultValue={u?.displayCode ?? ''} placeholder='displayCode(正番号)' className='rounded border p-2' />
          <input name='bodySerialNumber' defaultValue={u?.bodySerialNumber ?? ''} placeholder='本体/セル番号' className='rounded border p-2' />
          <input name='frameSerialNumber' defaultValue={u?.frameSerialNumber ?? ''} placeholder='枠/筐体番号' className='rounded border p-2' />
          <input name='mainBoardSerialNumber' defaultValue={u?.mainBoardSerialNumber ?? ''} placeholder='主基板番号' className='rounded border p-2' />
          <select name='operationCheckStatus' defaultValue={u?.operationCheckStatus ?? 'NOT_CHECKED'} className='rounded border p-2'><option value='NOT_CHECKED'>動確未</option><option value='OK'>動確OK</option><option value='NG'>動確NG</option><option value='NEEDS_RECHECK'>動確再確認</option></select>
          <select name='inspectionStatus' defaultValue={u?.inspectionStatus ?? 'NOT_INSPECTED'} className='rounded border p-2'><option value='NOT_INSPECTED'>検品未</option><option value='INSPECTED'>検品済</option><option value='ISSUE_FOUND'>検品課題あり</option></select>
          <input name='memo' defaultValue={u?.memo ?? ''} placeholder='メモ' className='rounded border p-2' />
          <button className='rounded bg-emerald-600 px-3 py-2 text-white'>保存</button>
        </form>
      </details>;
    })}
    <button className='w-full rounded border border-slate-300 bg-white px-3 py-2'>手入力で入庫する</button>
    <form action={completeAction}><button className='w-full rounded bg-emerald-700 px-3 py-2 text-white'>入庫完了</button></form>
  </div>;
}
