import Link from 'next/link';
import { listSalesSlips } from '@/features/inventory/sales-slips';

type SalesSlipRow = Awaited<ReturnType<typeof listSalesSlips>>[number];

export default async function Page() {
  const slips = await listSalesSlips();

  return (
    <div className='space-y-3 text-sm'>
      <div className='flex justify-between'>
        <h1 className='font-bold'>販売伝票一覧</h1>
        <Link href='/inventory/sales-slips/new'>新規作成</Link>
      </div>
      <table className='w-full border'>
        <thead>
          <tr className='border-b'><th>ID</th><th>販売先</th><th>合計</th><th>詳細</th></tr>
        </thead>
        <tbody>
          {slips.map((s: SalesSlipRow) => (
            <tr key={s.id} className='border-b'>
              <td>{s.slipNumber ?? s.id.slice(0, 8)}</td>
              <td>{s.customerName}</td>
              <td>{s.totalAmount.toLocaleString()}</td>
              <td><Link href={`/inventory/sales-slips/${s.id}`}>詳細</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
