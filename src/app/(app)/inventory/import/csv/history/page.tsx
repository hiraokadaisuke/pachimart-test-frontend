import Link from "next/link";
import { getInventoryImportHistory } from "@/features/inventory/server";

export default async function Page() {
  const batches = await getInventoryImportHistory();
  return <div className="mx-auto max-w-5xl px-4 py-8 text-sm"><h1 className="text-2xl font-bold">CSVインポート履歴</h1><table className="mt-4 w-full border text-xs"><thead><tr><th className="border p-1">実行日時</th><th className="border p-1">ファイル名</th><th className="border p-1">ステータス</th><th className="border p-1">総行数</th><th className="border p-1">成功</th><th className="border p-1">エラー</th><th className="border p-1">詳細</th></tr></thead><tbody>{batches.map((b)=><tr key={b.id}><td className="border p-1">{b.createdAt.toISOString()}</td><td className="border p-1">{b.fileName}</td><td className="border p-1">{b.status}</td><td className="border p-1">{b.totalRows}</td><td className="border p-1">{b.successRows}</td><td className="border p-1">{b.errorRows}</td><td className="border p-1"><Link className="underline" href={`/inventory/import/csv/history/${b.id}`}>詳細</Link></td></tr>)}</tbody></table></div>;
}
