import { createBankAccount, listBankAccounts } from '@/features/inventory/settings';

type BankAccountRow = Awaited<ReturnType<typeof listBankAccounts>>[number];

export default async function Page() {
  const rows = await listBankAccounts();

  async function action(fd: FormData) {
    'use server';
    await createBankAccount(fd);
  }

  return (
    <div className='space-y-2 text-sm'>
      <h1 className='font-bold'>振込口座設定</h1>
      <form action={action} className='flex gap-1'>
        <input name='bankName' placeholder='銀行名' className='border p-1' />
        <input name='accountNumber' placeholder='口座番号' className='border p-1' />
        <input name='accountHolder' placeholder='名義' className='border p-1' />
        <button className='border bg-blue-100 px-2'>登録</button>
      </form>
      <table className='w-full border'>
        <tbody>
          {rows.map((r: BankAccountRow) => (
            <tr key={r.id} className='border-b'>
              <td>{r.bankName}</td><td>{r.accountNumber}</td><td>{r.accountHolder}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
