'use client';

import { Check, ChevronRight, Inbox, Navigation, Reply } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type WorkspaceTab = 'register' | 'list' | 'received';

type ReceivedItem = {
  id: number;
  selected: boolean;
  maker: string;
  machine: string;
  quantity: string;
  unitPrice: string;
  memo: string;
};

type ReceivedEstimate = {
  id: number;
  sender: string;
  contact: string;
  title: string;
  receivedAt: string;
  validUntil: string;
  status: '未確認' | '確認中' | '調整依頼中' | '合意済み';
  message: string;
  items: ReceivedItem[];
};

const initialReceived: ReceivedEstimate[] = [
  {
    id: 101,
    sender: '株式会社サンプル商事',
    contact: '山田様',
    title: '8月上旬 販売見積り',
    receivedAt: '2026/07/31 10:18',
    validUntil: '2026/08/06',
    status: '未確認',
    message: '下記機種のお見積りをご確認ください。価格や台数は画面上で調整いただけます。',
    items: [
      { id: 1, selected: true, maker: '銀座', machine: 'P真北斗無双3ジャギの逆襲GEE', quantity: '2', unitPrice: '138000', memo: '枠色は要確認' },
      { id: 2, selected: true, maker: 'サミー', machine: 'スマスロ北斗の拳', quantity: '3', unitPrice: '265000', memo: '8月上旬出庫予定' },
      { id: 3, selected: true, maker: '三共', machine: 'eフィーバーからくりサーカス2 魔王ver.', quantity: '1', unitPrice: '420000', memo: '' },
    ],
  },
  {
    id: 102,
    sender: '株式会社テスト流通',
    contact: '佐藤様',
    title: '在庫機種 買取見積り',
    receivedAt: '2026/07/30 16:42',
    validUntil: '2026/08/04',
    status: '確認中',
    message: 'ご希望金額がございましたら、単価を修正してご返信ください。',
    items: [
      { id: 1, selected: true, maker: '平和', machine: 'L ToLOVEるダークネス', quantity: '2', unitPrice: '305000', memo: '書類あり' },
      { id: 2, selected: true, maker: '大都技研', machine: 'L押忍！番長4', quantity: '4', unitPrice: '92000', memo: '' },
    ],
  },
  {
    id: 103,
    sender: '株式会社パチンコ商会',
    contact: '高橋様',
    title: '7月末 機械見積り',
    receivedAt: '2026/07/29 11:05',
    validUntil: '2026/08/02',
    status: '合意済み',
    message: 'ご確認ありがとうございました。',
    items: [
      { id: 1, selected: true, maker: '京楽', machine: 'e仮面ライダー電王', quantity: '1', unitPrice: '480000', memo: '' },
    ],
  },
];

const sentRows = [
  { title: '8月上旬 販売見積り', company: '株式会社サンプル商事', updatedAt: '2026/07/31 10:12', status: '送信済み', amount: 1491000 },
  { title: '7月末 在庫見積り', company: '株式会社テスト流通', updatedAt: '2026/07/30 15:08', status: '回答待ち', amount: 978000 },
  { title: '買取価格回答', company: '株式会社パチンコ商会', updatedAt: '2026/07/29 09:31', status: '下書き', amount: 630000 },
];

function yen(value: number) {
  return `${value.toLocaleString('ja-JP')}円`;
}

function toNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function Status({ value }: { value: string }) {
  return <span className="inline-flex border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800">{value}</span>;
}

export default function EstimateDemoWorkspace({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<WorkspaceTab>('register');
  const [received, setReceived] = useState<ReceivedEstimate[]>(initialReceived);
  const [selectedEstimateId, setSelectedEstimateId] = useState(initialReceived[0].id);
  const [notice, setNotice] = useState('');
  const [showNavi, setShowNavi] = useState(false);

  const selectedEstimate = received.find((estimate) => estimate.id === selectedEstimateId) ?? received[0];
  const selectedItems = selectedEstimate.items.filter((item) => item.selected);
  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0),
    [selectedItems],
  );

  const updateItem = (itemId: number, key: 'selected' | 'quantity' | 'unitPrice', value: boolean | string) => {
    setReceived((current) => current.map((estimate) => (
      estimate.id !== selectedEstimate.id
        ? estimate
        : {
            ...estimate,
            status: estimate.status === '未確認' ? '確認中' : estimate.status,
            items: estimate.items.map((item) => item.id === itemId ? { ...item, [key]: value } : item),
          }
    )));
  };

  const replyAdjustment = () => {
    setReceived((current) => current.map((estimate) => estimate.id === selectedEstimate.id ? { ...estimate, status: '調整依頼中' } : estimate));
    setNotice('調整後の台数・単価を、送信元へ返信するデモを完了しました。');
  };

  return (
    <div className="estimate-demo-workspace">
      <div className="mx-auto w-full max-w-[1480px] px-4 pt-6">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-slate-950">簡単見積り</h1>
          <p className="mt-1 text-sm text-slate-700">見積りをパチマート内で作成・送受信し、合意した内容を取引ナビへ引き継ぎます。</p>
        </div>

        <div className="mb-2 flex border-b border-slate-300 text-sm font-semibold">
          {([
            ['register', '登録'],
            ['list', '一覧'],
            ['received', '受信'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`relative min-w-20 border border-b-0 px-5 py-2 ${tab === value ? 'bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
            >
              {label}
              {value === 'received' ? <span className="ml-2 inline-flex min-w-5 justify-center bg-rose-600 px-1 text-[10px] text-white">1</span> : null}
            </button>
          ))}
        </div>

        {notice ? (
          <div className="mb-2 flex items-center justify-between border border-emerald-400 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            <span className="flex items-center gap-2"><Check className="h-4 w-4" />{notice}</span>
            <button type="button" onClick={() => setNotice('')} className="px-2">×</button>
          </div>
        ) : null}
      </div>

      {tab === 'register' ? <div className="estimate-demo-register">{children}</div> : null}

      {tab === 'list' ? (
        <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 text-slate-950">
          <div className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-slate-100 px-3 py-2 text-sm font-bold">作成・送信した見積り</div>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs">
                <tr>
                  <th className="border-b border-r border-slate-300 px-3 py-2">タイトル</th>
                  <th className="border-b border-r border-slate-300 px-3 py-2">送信先</th>
                  <th className="border-b border-r border-slate-300 px-3 py-2">更新日時</th>
                  <th className="border-b border-r border-slate-300 px-3 py-2">状態</th>
                  <th className="border-b border-r border-slate-300 px-3 py-2 text-right">合計</th>
                  <th className="w-24 border-b border-slate-300 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sentRows.map((row) => (
                  <tr key={row.title} className="border-b border-slate-200 last:border-0">
                    <td className="border-r border-slate-200 px-3 py-2 font-semibold">{row.title}</td>
                    <td className="border-r border-slate-200 px-3 py-2">{row.company}</td>
                    <td className="border-r border-slate-200 px-3 py-2">{row.updatedAt}</td>
                    <td className="border-r border-slate-200 px-3 py-2"><Status value={row.status} /></td>
                    <td className="border-r border-slate-200 px-3 py-2 text-right">{yen(row.amount)}</td>
                    <td className="px-3 py-2 text-center"><button type="button" className="border border-slate-400 bg-white px-3 py-1 text-xs">開く</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      ) : null}

      {tab === 'received' ? (
        <main className="mx-auto grid w-full max-w-[1480px] grid-cols-[360px_minmax(0,1fr)] gap-3 px-4 pb-10 text-slate-950 max-[900px]:grid-cols-1">
          <section className="border border-slate-300 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-100 px-3 py-2 text-sm font-bold"><Inbox className="h-4 w-4" />受信見積り</div>
            <div>
              {received.map((estimate) => (
                <button
                  key={estimate.id}
                  type="button"
                  onClick={() => setSelectedEstimateId(estimate.id)}
                  className={`block w-full border-b border-slate-200 px-3 py-3 text-left last:border-0 ${selectedEstimate.id === estimate.id ? 'bg-sky-50' : 'bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-bold">{estimate.title}</span>
                    <Status value={estimate.status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold">{estimate.sender}</p>
                  <p className="mt-1 text-[11px] text-slate-600">{estimate.receivedAt}　{estimate.items.length}機種</p>
                </button>
              ))}
            </div>
          </section>

          <section className="min-w-0 border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-slate-100 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold">{selectedEstimate.title}</h2>
                  <p className="mt-0.5 text-xs">{selectedEstimate.sender}　{selectedEstimate.contact}</p>
                </div>
                <div className="text-right text-xs"><p>受信：{selectedEstimate.receivedAt}</p><p>有効期限：{selectedEstimate.validUntil}</p></div>
              </div>
            </div>

            <div className="border-b border-slate-300 px-3 py-2 text-sm">{selectedEstimate.message}</div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] table-fixed border-collapse text-xs">
                <colgroup><col className="w-10" /><col className="w-28" /><col className="w-72" /><col className="w-20" /><col className="w-32" /><col className="w-36" /><col /></colgroup>
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="border-b border-r border-slate-300 px-2 py-2"></th>
                    <th className="border-b border-r border-slate-300 px-2 py-2">メーカー</th>
                    <th className="border-b border-r border-slate-300 px-2 py-2">機種名</th>
                    <th className="border-b border-r border-slate-300 px-2 py-2 text-right">台数</th>
                    <th className="border-b border-r border-slate-300 px-2 py-2 text-right">単価</th>
                    <th className="border-b border-r border-slate-300 px-2 py-2 text-right">小計</th>
                    <th className="border-b border-slate-300 px-2 py-2">メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEstimate.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200 last:border-0">
                      <td className="border-r border-slate-200 px-2 py-1 text-center"><input type="checkbox" checked={item.selected} onChange={(event) => updateItem(item.id, 'selected', event.target.checked)} /></td>
                      <td className="border-r border-slate-200 px-2 py-1">{item.maker}</td>
                      <td className="border-r border-slate-200 px-2 py-1 font-semibold">{item.machine}</td>
                      <td className="border-r border-slate-200 p-1"><input type="number" min="0" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} className="h-8 w-full rounded-none border border-slate-300 px-2 text-right text-xs" /></td>
                      <td className="border-r border-slate-200 p-1"><input type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)} className="h-8 w-full rounded-none border border-slate-300 px-2 text-right text-xs" /></td>
                      <td className="border-r border-slate-200 px-2 py-1 text-right font-bold">{yen(toNumber(item.quantity) * toNumber(item.unitPrice))}</td>
                      <td className="px-2 py-1">{item.memo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-slate-50 px-3 py-3">
              <div className="text-sm"><span className="mr-3">選択：{selectedItems.length}機種</span><strong className="text-base">合計 {yen(selectedTotal)}</strong></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={replyAdjustment} className="inline-flex h-9 items-center gap-2 border border-sky-600 bg-white px-4 text-sm font-bold text-sky-800"><Reply className="h-4 w-4" />調整内容を返信</button>
                <button type="button" disabled={selectedItems.length === 0} onClick={() => setShowNavi(true)} className="inline-flex h-9 items-center gap-2 bg-slate-900 px-4 text-sm font-bold text-white disabled:bg-slate-400"><Navigation className="h-4 w-4" />選択機種でナビ作成</button>
              </div>
            </div>
          </section>
        </main>
      ) : null}

      {showNavi ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl border border-slate-400 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-4 py-3">
              <h2 className="font-bold">受信見積りからナビ作成</h2>
              <button type="button" onClick={() => setShowNavi(false)} className="text-xl">×</button>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p>取引先：<strong>{selectedEstimate.sender}</strong></p>
              <p>選択機種：<strong>{selectedItems.length}機種</strong>　合計：<strong>{yen(selectedTotal)}</strong></p>
              <p className="border border-sky-300 bg-sky-50 px-3 py-2">調整後の台数・単価を引き継ぎ、次に発送日・支払日・送料・取引条件などの共通条件を入力します。</p>
              <table className="w-full border-collapse text-xs">
                <tbody>{selectedItems.map((item) => <tr key={item.id} className="border-b border-slate-200"><td className="py-2 font-semibold">{item.machine}</td><td className="py-2 text-right">{item.quantity}台</td><td className="py-2 text-right">{yen(toNumber(item.unitPrice))}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-300 px-4 py-3">
              <button type="button" onClick={() => setShowNavi(false)} className="h-9 border border-slate-400 bg-white px-4 text-sm">キャンセル</button>
              <button type="button" onClick={() => { setShowNavi(false); setNotice('受信見積りの内容をナビ作成へ引き継ぐデモを完了しました。'); }} className="inline-flex h-9 items-center gap-2 bg-slate-900 px-4 text-sm font-bold text-white">共通条件入力へ<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
