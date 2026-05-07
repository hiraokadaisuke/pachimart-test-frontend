import Link from 'next/link';
import { getSalesSlip } from '@/features/inventory/sales-slips';
import { notFound } from 'next/navigation';

type SlipLine = NonNullable<Awaited<ReturnType<typeof getSalesSlip>>>['lines'][number];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slip = await getSalesSlip(id);
  if (!slip) return notFound();

  return (
    <div className='space-y-2 text-sm'>
      <h1 className='font-bold'>販売伝票詳細</h1>
      <div>販売先: {slip.customerName}</div>
      <div>合計: {slip.totalAmount.toLocaleString()} 粗利:{slip.grossProfitAmount.toLocaleString()}</div>
      <table className='w-full border'>
        <tbody>
          {slip.lines.map((line: SlipLine) => (
            <tr key={line.id} className='border-b'>
              <td>{line.machineName}</td><td>{line.amount}</td><td>{line.inventoryUnit?.displayCode ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='flex gap-2'>
        {['sales-slip', 'invoice', 'contract', 'shipping-request'].map((type) => (
          <Link key={type} href={`/inventory/sales-slips/${slip.id}/documents/${type}`} className='border px-2 bg-blue-100'>{type}</Link>
        ))}
      </div>
    </div>
  );
}
