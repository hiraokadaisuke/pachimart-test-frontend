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
        <summary>{i + 1}台目 / QR:{u?.rawQr ? '済' : '未'} 番号:{u?.displayCode || u?.bodySerialNumber || u?.frameSerialNumber || u?.mainBoardSerialNumber ? '済' : '未'} 動確:{u?.operationCheckStatus && u.operationCheckStatus !== 'NOT_CHECKED' ? '済' : '未'}</summary>
        <form action={action} className='grid gap-1 mt-2'>
          {u && <input type='hidden' name='unitId' value={u.id} />}
          <input name='rawQr' defaultValue={u?.rawQr ?? ''} placeholder='rawQr' className='border p-1' />
          <input name='displayCode' defaultValue={u?.displayCode ?? ''} placeholder='displayCode(正番号)' className='border p-1' />
          <input name='bodySerialNumber' defaultValue={u?.bodySerialNumber ?? ''} placeholder='本体/セル番号' className='border p-1' />
          <input name='frameSerialNumber' defaultValue={u?.frameSerialNumber ?? ''} placeholder='枠/筐体番号' className='border p-1' />
          <input name='mainBoardSerialNumber' defaultValue={u?.mainBoardSerialNumber ?? ''} placeholder='主基板番号' className='border p-1' />
          <input name='codeType' defaultValue={u?.codeType ?? 'UNKNOWN'} placeholder='codeType' className='border p-1' />
          <select name='operationCheckStatus' defaultValue={u?.operationCheckStatus ?? 'NOT_CHECKED'} className='border p-1'><option value='NOT_CHECKED'>動確未</option><option value='OK'>動確OK</option><option value='NG'>動確NG</option><option value='NEEDS_RECHECK'>動確再確認</option></select>
          <input name='operationMemo' defaultValue={u?.operationMemo ?? ''} placeholder='動確メモ' className='border p-1' />
          <select name='glassStatus' defaultValue={u?.glassStatus ?? 'UNKNOWN'} className='border p-1'><option value='UNKNOWN'>ガラス未</option><option value='OK'>ガラスOK</option><option value='NG'>ガラスNG</option><option value='MISSING'>ガラス欠品</option></select>
          <select name='nailSheetStatus' defaultValue={u?.nailSheetStatus ?? 'UNKNOWN'} className='border p-1'><option value='UNKNOWN'>釘シート未</option><option value='PRESENT'>釘シート有</option><option value='MISSING'>釘シート無</option><option value='NOT_REQUIRED'>釘シート不要</option></select>
          <select name='inspectionStatus' defaultValue={u?.inspectionStatus ?? 'NOT_INSPECTED'} className='border p-1'><option value='NOT_INSPECTED'>検品未</option><option value='INSPECTED'>検品済</option><option value='ISSUE_FOUND'>検品課題あり</option></select>
          <input name='inspectionMemo' defaultValue={u?.inspectionMemo ?? ''} placeholder='検品メモ' className='border p-1' />
          <input name='accessoryMemo' defaultValue={u?.accessoryMemo ?? ''} placeholder='付属品メモ' className='border p-1' />
          <input name='memo' defaultValue={u?.memo ?? ''} placeholder='memo / 動確済 など' className='border p-1' />
          <button className='bg-blue-100 border px-2 py-1'>保存</button>
        </form>
      </details>;
    })}
    <form action={completeAction}><button className='rounded border bg-emerald-100 px-3 py-2'>入庫完了</button></form>
  </div>;
}
