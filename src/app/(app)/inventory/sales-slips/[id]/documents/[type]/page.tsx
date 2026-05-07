import { getSalesSlip } from '@/features/inventory/sales-slips';

type SlipLine = NonNullable<Awaited<ReturnType<typeof getSalesSlip>>>['lines'][number];
const toSafeNumber = (value: number | null | undefined) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export default async function Page({ params }: { params: Promise<{ id: string; type: string }> }) {
  const { id, type } = await params;
  const slip = await getSalesSlip(id);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 12, fontSize: 12 }}>
      <style>{'@media print { body { margin: 0; } } table{border-collapse:collapse;width:100%} td,th{border:1px solid #333;padding:4px;}'}</style>
      <h1>{type}</h1>
      <p>販売先: {slip?.customerName ?? '未登録'}</p>
      <table>
        <thead><tr><th>機種</th><th>数量</th><th>金額</th></tr></thead>
        <tbody>
          {(slip?.lines ?? []).length === 0 && <tr><td colSpan={3}>明細なし</td></tr>}
          {(slip?.lines ?? []).map((line: SlipLine) => (
            <tr key={line.id}><td>{line.machineName}</td><td>{toSafeNumber(line.quantity)}</td><td>{toSafeNumber(line.amount).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
