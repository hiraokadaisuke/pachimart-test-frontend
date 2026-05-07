import Link from 'next/link';
import { listInboundMobile } from '@/features/inventory/inbound-work';
export default async function Page(){const rows=await listInboundMobile();return <div className='space-y-3'><h1 className='font-bold'>入庫予定(スマホ)</h1>{rows.map(r=><div key={r.id} className='border p-2 text-sm'><div>{r.modelNameSnapshot} / {r.quantity}台</div><div>QR {r.progress.qrDone}/{r.progress.total} 動確 {r.progress.checkDone}/{r.progress.total}</div><Link href={`/inventory/inbounds/${r.id}/work`} className='text-blue-700'>入庫作業</Link></div>)}</div>}
