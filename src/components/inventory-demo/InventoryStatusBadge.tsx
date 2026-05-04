import { Badge } from "@/components/ui/badge";

const tone: Record<string, string> = {
  在庫: "bg-emerald-100 text-emerald-800",
  商談中: "bg-amber-100 text-amber-800",
  発送予定: "bg-sky-100 text-sky-800",
  売却済: "bg-slate-200 text-slate-700",
  未出品: "bg-slate-100 text-slate-700",
  出品中: "bg-blue-100 text-blue-800",
  成約済: "bg-purple-100 text-purple-800",
  未入庫: "bg-rose-100 text-rose-800",
  入庫待ち: "bg-amber-100 text-amber-800",
  一部入庫: "bg-indigo-100 text-indigo-800",
  発送準備中: "bg-orange-100 text-orange-800",
  未発送: "bg-yellow-100 text-yellow-800",
  発送済: "bg-green-100 text-green-800",
};

export function InventoryStatusBadge({ status }: { status: string }) {
  return <Badge className={tone[status] ?? "bg-slate-100 text-slate-700"}>{status}</Badge>;
}
