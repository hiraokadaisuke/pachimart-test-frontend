"use client";

const depositAccounts = [
  {
    id: "dep-001",
    bankName: "みずほ銀行",
    branchName: "東京中央支店",
    accountType: "普通",
    accountNumber: "1234567",
    accountHolder: "カ）パチマート",
    status: "有効",
  },
  {
    id: "dep-002",
    bankName: "三井住友銀行",
    branchName: "新宿支店",
    accountType: "普通",
    accountNumber: "7654321",
    accountHolder: "カ）パチマート",
    status: "確認中",
  },
];

export function DepositAccountTabContent() {
  return (
    <section className="space-y-3 text-neutral-900">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">入金口座</h2>
        <p className="text-sm text-neutral-700">入金先として案内する口座の一覧です。今後はここから口座の追加や編集を行う想定です。</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-auto text-sm text-slate-800">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">銀行名</th>
              <th className="px-3 py-2">支店名</th>
              <th className="px-3 py-2">種別</th>
              <th className="px-3 py-2">口座番号</th>
              <th className="px-3 py-2">口座名義</th>
              <th className="px-3 py-2">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {depositAccounts.map((account) => (
              <tr key={account.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{account.bankName}</td>
                <td className="px-3 py-2">{account.branchName}</td>
                <td className="px-3 py-2">{account.accountType}</td>
                <td className="px-3 py-2">{account.accountNumber}</td>
                <td className="px-3 py-2">{account.accountHolder}</td>
                <td className="px-3 py-2">{account.status}</td>
              </tr>
            ))}
            {depositAccounts.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-sm text-neutral-600" colSpan={6}>
                  登録済みの入金口座はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
