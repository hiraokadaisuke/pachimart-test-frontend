import Link from "next/link";
import { notFound } from "next/navigation";
import { getInventoryImportBatchDetail } from "@/features/inventory/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await getInventoryImportBatchDetail(id);
  if (!batch) notFound();
  return <div className="mx-auto max-w-5xl px-4 py-8 text-sm"><h1 className="text-2xl font-bold">CSVインポート詳細</h1><p className="mt-2">{batch.fileName} / {batch.status} / 成功{batch.successRows} / エラー{batch.errorRows}</p><table className="mt-4 w-full border text-xs"><thead><tr><th className="border p-1">行</th><th className="border p-1">状態</th><th className="border p-1">エラー</th><th className="border p-1">在庫</th><th className="border p-1">rawData</th></tr></thead><tbody>{batch.rows.map((r)=><tr key={r.id}><td className="border p-1">{r.rowNumber}</td><td className="border p-1">{r.status}</td><td className="border p-1">{r.errorMessage ?? ""}</td><td className="border p-1">{r.inventoryItemId ? <Link className="underline" href={`/inventory/${r.inventoryItemId}`}>{r.inventoryItemId}</Link> : "-"}</td><td className="border p-1"><pre>{JSON.stringify(r.rawData)}</pre></td></tr>)}</tbody></table></div>;
}
