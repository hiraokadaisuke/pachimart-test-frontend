"use client";

const transferAccounts = [
  {
    id: "tr-001",
    nickname: "本社口座",
    bankName: "ゆうちょ銀行",
    branchName: "〇一八",
    accountType: "当座",
    accountNumber: "1234567",
    accountHolder: "カ）パチテック",
    default: true,
  },
  {
    id: "tr-002",
    nickname: "店舗A口座",
    bankName: "りそな銀行",
    branchName: "渋谷支店",
    accountType: "普通",
    accountNumber: "9876543",
    accountHolder: "カ）パチテック",
    default: false,
  },
];

export function TransferAccountTabContent() {
  return (
    <section className="space-y-3 text-neutral-900">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">振込先口座</h2>
        <p className="text-sm text-neutral-700">
          出金時に使用する振込先口座の一覧です。現在はダミーデータのみで、今後は口座の選択や切替が可能になります。
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-auto text-sm text-slate-800">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">表示名</th>
              <th className="px-3 py-2">銀行名</th>
              <th className="px-3 py-2">支店名</th>
              <th className="px-3 py-2">種別</th>
              <th className="px-3 py-2">口座番号</th>
              <th className="px-3 py-2">口座名義</th>
              <th className="px-3 py-2">優先設定</th>
            </tr>
          </thead>
          <tbody>
            {transferAccounts.map((account) => (
              <tr key={account.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{account.nickname}</td>
                <td className="px-3 py-2">{account.bankName}</td>
                <td className="px-3 py-2">{account.branchName}</td>
                <td className="px-3 py-2">{account.accountType}</td>
                <td className="px-3 py-2">{account.accountNumber}</td>
                <td className="px-3 py-2">{account.accountHolder}</td>
                <td className="px-3 py-2">{account.default ? "優先" : "-"}</td>
              </tr>
            ))}
            {transferAccounts.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-sm text-neutral-600" colSpan={7}>
                  登録済みの振込先口座はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
