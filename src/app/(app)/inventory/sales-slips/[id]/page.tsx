import Link from 'next/link';
import { getSalesSlip } from '@/features/inventory/sales-slips';
import { notFound } from 'next/navigation';

type SlipLine = NonNullable<Awaited<ReturnType<typeof getSalesSlip>>>['lines'][number];
const toSafeNumber = (value: number | null | undefined) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slip = await getSalesSlip(id);
  if (!slip) return notFound();

  return (
    <div className='space-y-2 text-sm'>
      <h1 className='font-bold'>販売伝票詳細</h1>
      <div>販売先: {slip.customerName}</div>
      <div>合計: {toSafeNumber(slip.totalAmount).toLocaleString()} 粗利:{toSafeNumber(slip.grossProfitAmount).toLocaleString()}</div>
      <table className='w-full border border-slate-400'>
        <tbody>
          {slip.lines.length === 0 && <tr><td colSpan={3} className='p-3 text-center text-slate-500'>明細がありません。</td></tr>}
          {slip.lines.map((line: SlipLine) => (
            <tr key={line.id} className='border-b border-slate-300'>
              <td className='p-1'>{line.machineName}</td><td className='p-1 text-right'>{toSafeNumber(line.amount).toLocaleString()}</td><td className='p-1'>{line.inventoryUnit?.displayCode ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='flex gap-2'>
        {['sales-slip', 'invoice', 'contract', 'shipping-request'].map((type: string) => (
          <Link key={type} href={`/inventory/sales-slips/${slip.id}/documents/${type}`} className='border px-2 bg-blue-100'>{type}</Link>
        ))}
      </div>
    </div>
  );
}
