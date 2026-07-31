'use client';

import { ArrowLeft, Check, Inbox, Navigation, Reply } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type WorkspaceTab = 'register' | 'list' | 'received';
type ReceivedView = 'list' | 'detail';

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

const estimateRowsStorageKey = 'estimate-workflow-demo:rows:v2';

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
  return <span className="estimate-status">{value}</span>;
}

function setControlledInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export default function EstimateDemoWorkspace({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<WorkspaceTab>('register');
  const [receivedView, setReceivedView] = useState<ReceivedView>('list');
  const [received, setReceived] = useState<ReceivedEstimate[]>(initialReceived);
  const [selectedEstimateId, setSelectedEstimateId] = useState(initialReceived[0].id);
  const [notice, setNotice] = useState('');

  const selectedEstimate = received.find((estimate) => estimate.id === selectedEstimateId) ?? received[0];
  const selectedItems = selectedEstimate.items.filter((item) => item.selected);
  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0),
    [selectedItems],
  );

  const changeTab = (value: WorkspaceTab) => {
    setTab(value);
    if (value === 'received') setReceivedView('list');
  };

  const openReceivedEstimate = (estimateId: number) => {
    setSelectedEstimateId(estimateId);
    setReceivedView('detail');
    setReceived((current) => current.map((estimate) => (
      estimate.id === estimateId && estimate.status === '未確認'
        ? { ...estimate, status: '確認中' }
        : estimate
    )));
  };

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
    setNotice('調整後の台数・単価を送信元へ返信するデモを完了しました。');
  };

  const startExistingNaviFlow = () => {
    if (selectedItems.length === 0 || typeof window === 'undefined') return;

    const rows = selectedItems.map((item, index) => ({
      id: index + 1,
      maker: item.maker,
      machine: item.machine,
      quantity: item.quantity,
      price: item.unitPrice,
      memo: item.memo,
    }));

    window.localStorage.setItem(estimateRowsStorageKey, JSON.stringify(rows));
    setNotice('');
    setTab('register');

    window.setTimeout(() => {
      const naviButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.estimate-demo-register button'))
        .find((button) => button.textContent?.includes('一括ナビ作成'));

      if (!naviButton) {
        setNotice('一括ナビ作成画面を開けませんでした。登録タブから再度お試しください。');
        return;
      }

      naviButton.click();

      window.setTimeout(() => {
        const buyerLabel = Array.from(document.querySelectorAll<HTMLLabelElement>('.fixed.inset-0 label'))
          .find((label) => label.textContent?.includes('取引先（買手）会社名'));
        const buyerInput = buyerLabel?.querySelector<HTMLInputElement>('input');
        if (buyerInput) setControlledInput(buyerInput, selectedEstimate.sender);
      }, 250);
    }, 400);
  };

  return (
    <div className="estimate-demo-workspace">
      <div className="estimate-workspace-head">
        <div className="estimate-workspace-title">
          <h1>簡単見積り</h1>
          <p>見積りをパチマート内で作成・送受信し、合意した内容を取引ナビへ引き継ぎます。</p>
        </div>

        <div className="estimate-workspace-tabs" role="tablist" aria-label="簡単見積り">
          {([
            ['register', '登録'],
            ['list', '一覧'],
            ['received', '受信'],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => changeTab(value)} className={tab === value ? 'is-active' : ''}>
              {label}
              {value === 'received' ? <span className="estimate-received-count">1</span> : null}
            </button>
          ))}
        </div>

        {notice ? (
          <div className="estimate-workspace-notice">
            <span><Check className="h-4 w-4" />{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="閉じる">×</button>
          </div>
        ) : null}
      </div>

      {tab === 'register' ? <div className="estimate-demo-register">{children}</div> : null}

      {tab === 'list' ? (
        <main className="estimate-workspace-page">
          <section className="estimate-panel">
            <div className="estimate-panel-title">作成・送信した見積り</div>
            <div className="estimate-table-scroll">
              <table className="estimate-data-table estimate-sent-table">
                <thead><tr><th>タイトル</th><th>送信先</th><th>更新日時</th><th>状態</th><th className="number">合計</th><th className="action"></th></tr></thead>
                <tbody>
                  {sentRows.map((row) => (
                    <tr key={row.title}>
                      <td className="strong">{row.title}</td><td>{row.company}</td><td>{row.updatedAt}</td><td><Status value={row.status} /></td><td className="number">{yen(row.amount)}</td><td className="action"><button type="button">開く</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      ) : null}

      {tab === 'received' && receivedView === 'list' ? (
        <main className="estimate-workspace-page estimate-received-page">
          <section className="estimate-panel">
            <div className="estimate-panel-title"><Inbox className="h-4 w-4" />受信見積り</div>
            <div className="estimate-table-scroll">
              <table className="estimate-data-table estimate-received-list-table">
                <thead><tr><th>状態</th><th>タイトル</th><th>送信元</th><th>担当者</th><th>受信日時</th><th>有効期限</th><th className="number">機種数</th><th className="number">合計</th><th className="action"></th></tr></thead>
                <tbody>
                  {received.map((estimate) => {
                    const total = estimate.items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0);
                    return (
                      <tr key={estimate.id}>
                        <td><Status value={estimate.status} /></td>
                        <td><button type="button" className="estimate-title-link" onClick={() => openReceivedEstimate(estimate.id)}>{estimate.title}</button></td>
                        <td>{estimate.sender}</td><td>{estimate.contact}</td><td>{estimate.receivedAt}</td><td>{estimate.validUntil}</td><td className="number">{estimate.items.length}</td><td className="number">{yen(total)}</td>
                        <td className="action"><button type="button" className="estimate-open-detail-button" onClick={() => openReceivedEstimate(estimate.id)}>詳細</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      ) : null}

      {tab === 'received' && receivedView === 'detail' ? (
        <main className="estimate-workspace-page estimate-received-page estimate-received-detail-page">
          <div className="estimate-detail-navigation">
            <button type="button" onClick={() => setReceivedView('list')}><ArrowLeft className="h-4 w-4" />受信一覧へ戻る</button>
            <span><Status value={selectedEstimate.status} /></span>
          </div>

          <section className="estimate-panel estimate-received-detail">
            <div className="estimate-received-detail-head">
              <div><h2>{selectedEstimate.title}</h2><p>{selectedEstimate.sender}　{selectedEstimate.contact}</p></div>
              <dl><div><dt>受信</dt><dd>{selectedEstimate.receivedAt}</dd></div><div><dt>有効期限</dt><dd>{selectedEstimate.validUntil}</dd></div></dl>
            </div>
            <div className="estimate-received-message">{selectedEstimate.message}</div>

            <div className="estimate-table-scroll">
              <table className="estimate-data-table estimate-received-items-table">
                <colgroup><col className="check" /><col className="maker" /><col className="machine" /><col className="quantity" /><col className="price" /><col className="subtotal" /><col className="memo" /></colgroup>
                <thead><tr><th></th><th>メーカー</th><th>機種名</th><th className="number">台数</th><th className="number">単価</th><th className="number">小計</th><th>メモ</th></tr></thead>
                <tbody>
                  {selectedEstimate.items.map((item) => (
                    <tr key={item.id}>
                      <td className="check-cell"><input type="checkbox" checked={item.selected} onChange={(event) => updateItem(item.id, 'selected', event.target.checked)} /></td>
                      <td>{item.maker}</td><td className="strong">{item.machine}</td>
                      <td><input type="number" min="0" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} /></td>
                      <td><input type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)} /></td>
                      <td className="number strong">{yen(toNumber(item.quantity) * toNumber(item.unitPrice))}</td><td>{item.memo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="estimate-received-actions">
              <div>選択：{selectedItems.length}機種<strong>合計 {yen(selectedTotal)}</strong></div>
              <div className="estimate-received-action-buttons">
                <button type="button" className="secondary" onClick={replyAdjustment}><Reply className="h-4 w-4" />調整内容を返信</button>
                <button type="button" className="primary" disabled={selectedItems.length === 0} onClick={startExistingNaviFlow}><Navigation className="h-4 w-4" />選択機種でナビ作成</button>
              </div>
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}
