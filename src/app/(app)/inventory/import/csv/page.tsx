import Link from "next/link";
import { redirect } from "next/navigation";
import { parseInventoryImportRows, validateImportRows } from "@/features/inventory/csv-import";
import { getInventoryCsvDuplicateWarning, runInventoryCsvImport } from "@/features/inventory/server";

export default async function InventoryCsvImportPage({ searchParams }: { searchParams: Promise<{ csv?: string; result?: string }> }) {
  const params = await searchParams;
  const csv = params.csv ?? "";
  const parsed = csv ? parseInventoryImportRows(csv) : { rows: [], issues: [] };
  const issues = [...parsed.issues, ...validateImportRows(parsed.rows)];
  const duplicateWarning = csv ? await getInventoryCsvDuplicateWarning(csv) : null;
  const successCount = parsed.rows.filter((r) => !issues.some((i) => i.rowNumber === r.rowNumber && i.level === "error")).length;
  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;
  const quantityTotal = parsed.rows.reduce((sum, r) => sum + (Number(r["台数"]) || 0), 0);
  const purchaseTotal = parsed.rows.reduce((sum, r) => sum + ((Number(r["台数"]) || 0) * (Number(r["仕入単価"]) || 0)), 0);
  const saleTotal = parsed.rows.reduce((sum, r) => sum + ((Number(r["台数"]) || 0) * (Number(r["販売予定単価"]) || 0)), 0);
  async function previewAction(formData: FormData) { "use server"; redirect(`/inventory/import/csv?csv=${encodeURIComponent(String(formData.get("csv") ?? ""))}`); }
  async function importAction(formData: FormData) { "use server"; await runInventoryCsvImport(String(formData.get("csv") ?? "")); redirect("/inventory/import/csv?result=ok"); }

  return <div className="mx-auto max-w-5xl px-4 py-8 text-sm"><h1 className="text-2xl font-bold">在庫CSVインポート</h1><p className="mt-2"><Link className="underline text-blue-600" href="/inventory/import/csv/template.csv">テンプレートCSVダウンロード</Link></p>
  <form action={previewAction} className="mt-4 space-y-2"><textarea name="csv" defaultValue={csv} className="h-40 w-full rounded border p-2" placeholder="CSVテキストを貼り付け"/><button className="rounded bg-slate-900 px-3 py-2 text-white">プレビュー</button></form>
  {duplicateWarning && <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-amber-900">{duplicateWarning}</p>}
  {issues.length>0 && <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3"><p className="font-semibold">バリデーション結果</p><ul>{issues.map((i,idx)=><li key={idx}>{i.rowNumber}行目 / {i.field ?? "-"} / {i.value ?? "-"} / {i.message}</li>)}</ul></div>}
  {parsed.rows.length>0 && <div className="mt-4"><p className="font-semibold">プレビュー ({parsed.rows.length}件)</p><table className="w-full border text-xs"><thead><tr><th className="border p-1">行</th><th className="border p-1">種別</th><th className="border p-1">機種名</th><th className="border p-1">台数</th></tr></thead><tbody>{parsed.rows.slice(0,50).map(r=><tr key={r.rowNumber}><td className="border p-1">{r.rowNumber}</td><td className="border p-1">{r["種別"]}</td><td className="border p-1">{r["機種名"]}</td><td className="border p-1">{r["台数"]}</td></tr>)}</tbody></table>
  <div className="mt-2 space-y-1"><p>成功予定件数: {successCount}</p><p>エラー件数: {errorCount}</p><p>warning件数: {warningCount}</p><p>作成予定在庫台数合計: {quantityTotal}</p><p>仕入単価合計: {purchaseTotal}</p><p>販売予定金額合計: {saleTotal}</p></div>
  <form action={importAction} className="mt-3"><input type="hidden" name="csv" value={csv}/><button disabled={issues.some(i=>i.level==="error")} className="rounded bg-emerald-700 px-3 py-2 text-white disabled:opacity-40">インポート実行</button></form></div>}
  {params.result==="ok" && <div className="mt-3 text-emerald-700"><p>インポートが完了しました。</p><p><Link className="underline" href="/inventory">在庫一覧へ</Link> / <Link className="underline" href="/inventory/import/csv/history">インポート履歴へ</Link></p></div>}</div>;
}
