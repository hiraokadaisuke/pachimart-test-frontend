import Link from 'next/link';
import { listSalesSlips } from '@/features/inventory/sales-slips';

type SalesSlipRow = Awaited<ReturnType<typeof listSalesSlips>>[number];
const toSafeNumber = (value: number | null | undefined) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export default async function Page() {
  const slips = await listSalesSlips();

  return (
    <div className='mx-auto w-full max-w-[1680px] px-3 py-3 md:px-5 space-y-2 text-xs'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-lg font-bold'>販売伝票一覧（検証用）</h1><p className='text-xs text-amber-700'>本運用の販売伝票導線は /sales/sales-invoice を利用してください。</p></div>
        <Link href='/inventory/sales-slips/new' className='rounded-sm border border-emerald-700 bg-emerald-700 px-3 py-1 text-xs font-semibold text-white'>新規作成</Link>
      </div>
      <div className='overflow-x-auto rounded border border-slate-300 bg-white'><table className='min-w-[760px] w-full border-collapse'>
        <thead className='bg-slate-50'>
          <tr className='border-b border-slate-400'><th className='border-r border-slate-300 p-1'>ID</th><th className='border-r border-slate-300 p-1'>販売先</th><th className='border-r border-slate-300 p-1 text-right'>合計</th><th className='p-1'>詳細</th></tr>
        </thead>
        <tbody>
          {slips.length === 0 && (
            <tr><td className='p-3 text-center text-slate-500' colSpan={4}>販売伝票はまだありません。</td></tr>
          )}
          {slips.map((s: SalesSlipRow) => (
            <tr key={s.id} className='border-b border-slate-300'>
              <td className='border-r border-slate-200 p-1'>{s.slipNumber ?? s.id.slice(0, 8)}</td>
              <td className='border-r border-slate-200 p-1'>{s.customerName}</td>
              <td className='border-r border-slate-200 p-1 text-right'>{toSafeNumber(s.totalAmount).toLocaleString()}</td>
              <td className='p-1'><Link href={`/inventory/sales-slips/${s.id}`} className='text-blue-700 underline'>詳細</Link></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
