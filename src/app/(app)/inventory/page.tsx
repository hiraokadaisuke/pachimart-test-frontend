import Link from "next/link";

import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentActivities } from "@/features/inventory/mock";

const kpi = [
  ["現在庫", "128台"], ["入庫予定", "24台"], ["発送予定", "17台"], ["出品中", "43台"], ["今月販売", "31台"], ["粗利", "¥1,240,000"],
];

export default function InventoryPage() {
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-3xl font-bold">在庫管理</h1><p className="mt-2 text-slate-600">パチマートの取引情報と連携し、在庫・入庫予定・発送予定を一元管理できます。</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kpi.map(([l,v])=><Card key={l}><CardHeader><CardTitle className="text-sm text-slate-500">{l}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{v}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>最近の在庫の動き</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>日付</th><th>区分</th><th>機種名</th><th>台数</th><th>保管場所</th><th>ステータス</th></tr></thead><tbody>{recentActivities.map((a)=><tr key={`${a.date}${a.modelName}`} className="border-t"><td className="py-3">{a.date}</td><td>{a.category}</td><td>{a.modelName}</td><td>{a.quantity}台</td><td>{a.location}</td><td><InventoryStatusBadge status={a.status} /></td></tr>)}</tbody></table></div></CardContent></Card>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["在庫物件一覧を見る","/inventory/items"],["入庫予定を見る","/inventory/inbound"],["発送予定を見る","/inventory/outbound"]].map(([label,href])=><Link key={href} href={href} className="rounded-lg border bg-white p-4 text-center font-semibold hover:bg-slate-50">{label}</Link>)}</div>
  </div>;
}
