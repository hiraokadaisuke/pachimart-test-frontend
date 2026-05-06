import Link from "next/link";
import { redirect } from "next/navigation";
import { parseInventoryImportRows, validateImportRows } from "@/features/inventory/csv-import";
import { runInventoryCsvImport } from "@/features/inventory/server";

export default async function InventoryCsvImportPage({ searchParams }: { searchParams: Promise<{ csv?: string; result?: string }> }) {
  const params = await searchParams;
  const csv = params.csv ?? "";
  const parsed = csv ? parseInventoryImportRows(csv) : { rows: [], issues: [] };
  const issues = [...parsed.issues, ...validateImportRows(parsed.rows)];
  async function previewAction(formData: FormData) { "use server"; redirect(`/inventory/import/csv?csv=${encodeURIComponent(String(formData.get("csv") ?? ""))}`); }
  async function importAction(formData: FormData) { "use server"; await runInventoryCsvImport(String(formData.get("csv") ?? "")); redirect("/inventory/import/csv?result=ok"); }

  return <div className="mx-auto max-w-5xl px-4 py-8 text-sm"><h1 className="text-2xl font-bold">在庫CSVインポート</h1><p className="mt-2"><Link className="underline text-blue-600" href="/inventory/import/csv/template.csv">テンプレートCSVダウンロード</Link></p>
  <form action={previewAction} className="mt-4 space-y-2"><textarea name="csv" defaultValue={csv} className="h-40 w-full rounded border p-2" placeholder="CSVテキストを貼り付け"/><button className="rounded bg-slate-900 px-3 py-2 text-white">プレビュー</button></form>
  {issues.length>0 && <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3"><p className="font-semibold">バリデーション結果</p><ul>{issues.map((i,idx)=><li key={idx}>[{i.level}] {i.rowNumber}行目: {i.message}</li>)}</ul></div>}
  {parsed.rows.length>0 && <div className="mt-4"><p className="font-semibold">プレビュー ({parsed.rows.length}件)</p><table className="w-full border text-xs"><thead><tr><th className="border p-1">行</th><th className="border p-1">種別</th><th className="border p-1">機種名</th><th className="border p-1">台数</th></tr></thead><tbody>{parsed.rows.slice(0,50).map(r=><tr key={r.rowNumber}><td className="border p-1">{r.rowNumber}</td><td className="border p-1">{r["種別"]}</td><td className="border p-1">{r["機種名"]}</td><td className="border p-1">{r["台数"]}</td></tr>)}</tbody></table>
  <form action={importAction} className="mt-3"><input type="hidden" name="csv" value={csv}/><button disabled={issues.some(i=>i.level==="error")} className="rounded bg-emerald-700 px-3 py-2 text-white disabled:opacity-40">インポート実行</button></form></div>}
  {params.result==="ok" && <p className="mt-3 text-emerald-700">インポートが完了しました。</p>}</div>;
}
