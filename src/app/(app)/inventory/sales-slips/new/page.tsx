import { createSalesSlip, listSelectableSalesUnits } from '@/features/inventory/sales-slips';
import { redirect } from 'next/navigation';

type SelectableUnit = Awaited<ReturnType<typeof listSelectableSalesUnits>>[number];

export default async function Page() {
  const units = await listSelectableSalesUnits();

  async function action(formData: FormData) {
    'use server';
    const slip = await createSalesSlip(formData);
    redirect(`/inventory/sales-slips/${slip.id}`);
  }

  return (
    <form action={action} className='space-y-4 text-sm'>
      <h1 className='font-bold'>販売伝票作成</h1>
      <section className='space-y-2 border p-3'>
        <h2 className='font-semibold'>基本情報</h2>
        <input name='customerName' placeholder='販売先' className='border p-1 w-full' required />
        <input name='salesContactName' placeholder='担当' className='border p-1 w-full' />
      </section>
      <section className='space-y-2 border p-3'>
        <h2 className='font-semibold'>支払情報</h2>
        <input type='date' name='paymentDueDate' className='border p-1' />
      </section>
      <section className='space-y-2 border p-3'>
        <h2 className='font-semibold'>明細</h2>
        <div className='grid grid-cols-3 gap-2'>
          <input name='machineName' placeholder='機種名' className='border p-1' />
          <input name='purchaseUnitPrice' placeholder='仕入単価' className='border p-1' />
          <input name='salesUnitPrice' placeholder='売価' className='border p-1' />
        </div>
        <select name='inventoryUnitId' className='border p-1 w-full'>
          <option value=''>Unit未選択</option>
          {units.map((u: SelectableUnit) => (
            <option key={u.id} value={u.id}>{u.displayCode ?? '-'} / {u.rawQr ?? '-'} / {u.memo ?? '-'}</option>
          ))}
        </select>
      </section>
      <section className='space-y-1 border p-3'>
        <h2 className='font-semibold'>合計</h2>
        <p className='text-slate-600'>登録時に明細1行から税額・合計を自動計算します。</p>
      </section>
      <button className='border px-3 py-1 bg-blue-100'>登録</button>
    </form>
  );
}
