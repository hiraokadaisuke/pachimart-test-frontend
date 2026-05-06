import { formatFinancialCsvRows } from "@/features/inventory/financials";
import { getFinancialCsvData } from "@/features/inventory/server";
export async function GET() {
  const { purchases: rows } = await getFinancialCsvData();
  const csv = formatFinancialCsvRows(["仕入日","在庫ID","メーカー","機種名","台数","仕入単価","送料","その他費用","仕入合計","支払ステータス","関連取引ID","作成種別","取消","メモ"], rows.map((r)=>[r.purchaseDate.toISOString().slice(0,10),r.inventoryItemId,r.inventoryItem.makerNameSnapshot ?? "",r.inventoryItem.modelNameSnapshot,r.quantity,r.unitCost,r.shippingCost,r.otherCost,r.totalCost,r.paymentStatus,r.dealingId ?? "",(r.memo??"").includes("AUTO")?"自動":"手動",r.paymentStatus==="CANCELED"?"取消":"",r.memo ?? ""]));
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8" } });
}
