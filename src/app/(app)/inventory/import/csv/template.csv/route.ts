import { buildTemplateCsv } from "@/features/inventory/csv-import";

export async function GET() {
  return new Response(buildTemplateCsv(), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=inventory-import-template.csv" } });
}
