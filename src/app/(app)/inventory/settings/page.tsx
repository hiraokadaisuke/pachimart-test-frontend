import Link from 'next/link';
import { getSettingsOverview } from '@/features/inventory/settings';
export default async function Page(){const x=await getSettingsOverview();return <div className='space-y-2 text-sm'><h1 className='font-bold'>詳細設定</h1><div className='flex gap-2'>{['partners','company','purchase-terms','sale-terms','bank-accounts'].map(t=><Link className='border px-2 bg-blue-100' key={t} href={`/inventory/settings/${t}`}>{t}</Link>)}</div><p>取引先:{x.partners} 自社:{x.profiles} 口座:{x.banks}</p></div>}
