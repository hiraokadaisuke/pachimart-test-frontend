"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import MainContainer from "@/components/layout/MainContainer";

const PURCHASE_DOC_OPTIONS = [
  "売買契約書",
  "支払依頼書",
  "入庫検品依頼書 兼 引取依頼書",
];

const SALE_DOC_OPTIONS = ["売買契約書", "請求書", "発送依頼書"];

type InvoiceType = "業者" | "ホール";

type WorkflowStatus = "IN_STOCK" | "FOR_SALE" | "SOLD" | "COMPLETED";

type WorkflowInventory = {
  id: string;
  maker: string;
  machineName: string;
  status: WorkflowStatus;
  createdAt: string;
  saleDate?: string;
  quantity: number;
  unitPrice: number;
  type: InvoiceType;
  partner: string;
  handler: string;
  purchaseInvoiceCreated: boolean;
  saleInvoiceCreated: boolean;
};

type WorkflowInvoice = {
  id: string;
  type: InvoiceType;
  createdAt: string;
  partner: string;
  handler: string;
  machines: { maker: string; name: string; quantity: number }[];
  totalAmount: number;
  documents: string[];
};

type DocumentModalState = {
  invoiceId: string;
  kind: "purchase" | "sale";
  selections: Record<string, boolean>;
};

const workflowInventories: WorkflowInventory[] = [
  {
    id: "INV-1001",
    maker: "三洋",
    machineName: "大海物語5",
    status: "IN_STOCK",
    createdAt: "2024-06-18",
    quantity: 4,
    unitPrice: 180000,
    partner: "山本商会",
    handler: "佐藤",
    type: "業者",
    purchaseInvoiceCreated: false,
    saleInvoiceCreated: false,
  },
  {
    id: "INV-1002",
    maker: "SANKYO",
    machineName: "機動戦士ガンダムSEED",
    status: "FOR_SALE",
    createdAt: "2024-06-20",
    quantity: 3,
    unitPrice: 210000,
    partner: "Aホール",
    handler: "田中",
    type: "ホール",
    purchaseInvoiceCreated: true,
    saleInvoiceCreated: false,
  },
  {
    id: "INV-1003",
    maker: "ユニバーサル",
    machineName: "バジリスク絆3",
    status: "SOLD",
    createdAt: "2024-06-10",
    saleDate: "2024-06-25",
    quantity: 2,
    unitPrice: 320000,
    partner: "Cホール",
    handler: "中村",
    type: "ホール",
    purchaseInvoiceCreated: true,
    saleInvoiceCreated: false,
  },
  {
    id: "INV-1004",
    maker: "大都技研",
    machineName: "吉宗RISING",
    status: "COMPLETED",
    createdAt: "2024-05-30",
    saleDate: "2024-06-15",
    quantity: 5,
    unitPrice: 265000,
    partner: "堀江商事",
    handler: "佐藤",
    type: "業者",
    purchaseInvoiceCreated: true,
    saleInvoiceCreated: true,
  },
];

const purchaseInvoices: WorkflowInvoice[] = [
  {
    id: "P-20240625-01",
    type: "業者",
    createdAt: "2024-06-25",
    partner: "山本商会",
    handler: "佐藤",
    machines: [
      { maker: "三洋", name: "大海物語5", quantity: 3 },
      { maker: "SANKYO", name: "機動戦士ガンダムSEED", quantity: 1 },
    ],
    totalAmount: 780000,
    documents: PURCHASE_DOC_OPTIONS,
  },
  {
    id: "P-20240620-02",
    type: "ホール",
    createdAt: "2024-06-20",
    partner: "Aホール",
    handler: "田中",
    machines: [{ maker: "SANKYO", name: "機動戦士ガンダムSEED", quantity: 2 }],
    totalAmount: 420000,
    documents: PURCHASE_DOC_OPTIONS,
  },
];

const saleInvoices: WorkflowInvoice[] = [
  {
    id: "S-20240627-01",
    type: "ホール",
    createdAt: "2024-06-27",
    partner: "Cホール",
    handler: "中村",
    machines: [
      { maker: "ユニバーサル", name: "バジリスク絆3", quantity: 2 },
      { maker: "三洋", name: "大海物語5", quantity: 1 },
    ],
    totalAmount: 980000,
    documents: SALE_DOC_OPTIONS,
  },
];

const formatCurrency = (amount: number) => `${amount.toLocaleString()} 円`;

const summarizeMachines = (machines: WorkflowInvoice["machines"]) => {
  if (machines.length === 0) return "-";
  if (machines.length === 1) {
    const [machine] = machines;
    return `${machine.maker} ${machine.name}`;
  }

  const [first, ...rest] = machines;
  const totalQuantity = machines.reduce((sum, machine) => sum + machine.quantity, 0);
  return `${first.maker} ${first.name} 他（${totalQuantity}台）`;
};

const statusLabels: Record<WorkflowStatus, string> = {
  IN_STOCK: "未売却（在庫）",
  FOR_SALE: "売却処理中",
  SOLD: "売却（販売伝票未作成）",
  COMPLETED: "完了",
};

const statusColors: Record<WorkflowStatus, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700",
  FOR_SALE: "bg-blue-100 text-blue-700",
  SOLD: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-slate-100 text-slate-700",
};

function DocumentModal({
  modal,
  onClose,
  onConfirm,
}: {
  modal: DocumentModalState | null;
  onClose: () => void;
  onConfirm: (invoiceId: string, documents: string[]) => void;
}) {
  const modalKind = modal?.kind ?? "purchase";
  const options = modalKind === "purchase" ? PURCHASE_DOC_OPTIONS : SALE_DOC_OPTIONS;
  const [selections, setSelections] = useState<Record<string, boolean>>(modal?.selections ?? {});

  useEffect(() => {
    setSelections(modal?.selections ?? {});
  }, [modal]);

  if (!modal) return null;

  const toggle = (option: string) => {
    setSelections((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleConfirm = () => {
    const selected = options.filter((option) => selections[option]);
    onConfirm(modal.invoiceId, selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">書類一括印刷</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            閉じる
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">出力する帳票を選択してください。</p>
        <div className="mt-4 space-y-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={selections[option]}
                onChange={() => toggle(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            印刷する
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function InventoryWorkflowBoard() {
  const [purchaseType, setPurchaseType] = useState<InvoiceType>("業者");
  const [saleType, setSaleType] = useState<InvoiceType>("業者");
  const [purchaseKeyword, setPurchaseKeyword] = useState("");
  const [saleKeyword, setSaleKeyword] = useState("");
  const [modal, setModal] = useState<DocumentModalState | null>(null);

  const statusSummary = useMemo(() => {
    return workflowInventories.reduce<Record<WorkflowStatus, number>>(
      (acc, item) => ({ ...acc, [item.status]: (acc[item.status] ?? 0) + 1 }),
      { IN_STOCK: 0, FOR_SALE: 0, SOLD: 0, COMPLETED: 0 },
    );
  }, []);

  const filteredPurchaseDrafts = useMemo(() => {
    return workflowInventories.filter((item) => {
      if (item.purchaseInvoiceCreated) return false;
      if (item.type !== purchaseType) return false;
      const keyword = purchaseKeyword.trim();
      if (!keyword) return true;
      return (
        item.maker.includes(keyword) ||
        item.machineName.includes(keyword) ||
        item.partner.includes(keyword) ||
        item.handler.includes(keyword)
      );
    });
  }, [purchaseKeyword, purchaseType]);

  const filteredSaleDrafts = useMemo(() => {
    return workflowInventories.filter((item) => {
      if (item.status !== "SOLD") return false;
      if (item.saleInvoiceCreated) return false;
      if (item.type !== saleType) return false;
      const keyword = saleKeyword.trim();
      if (!keyword) return true;
      return (
        item.maker.includes(keyword) ||
        item.machineName.includes(keyword) ||
        item.partner.includes(keyword) ||
        item.handler.includes(keyword)
      );
    });
  }, [saleKeyword, saleType]);

  const openModal = (kind: "purchase" | "sale", invoiceId: string) => {
    const base = kind === "purchase" ? PURCHASE_DOC_OPTIONS : SALE_DOC_OPTIONS;
    const initialSelections = base.reduce<Record<string, boolean>>((acc, option) => ({
      ...acc,
      [option]: true,
    }), {});
    setModal({ invoiceId, kind, selections: initialSelections });
  };

  const handleConfirmModal = (_invoiceId: string, documents: string[]) => {
    console.log("print", _invoiceId, documents);
    setModal(null);
  };

  return (
    <div className="bg-gradient-to-b from-emerald-50 to-white py-6">
      <MainContainer fullWidth>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Inventory first</p>
            <h2 className="text-xl font-bold text-slate-900">在庫を起点にした伝票導線</h2>
            <p className="mt-1 text-sm text-slate-600">
              ステータス変更と伝票作成を一画面で把握し、未作成の帳票を逃さない設計です。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusSummary).map(([status, count]) => (
              <span
                key={status}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  statusColors[status as WorkflowStatus]
                }`}
              >
                {statusLabels[status as WorkflowStatus]}
                <span className="text-[11px] font-bold">{count}件</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <WorkflowCard title="未作成購入伝票" description="在庫登録済み・伝票未作成のものを抽出">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <span className="font-semibold text-emerald-700">検索</span> メーカー / 機種 / 仕入先 / 入庫日 / 担当
              </div>
              <div className="flex gap-2 text-xs">
                {["業者", "ホール"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPurchaseType(type as InvoiceType)}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      purchaseType === type ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {type}伝票
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="search"
                  placeholder="メーカー / 機種 / 仕入先 / 担当"
                  value={purchaseKeyword.trimStart()}
                  onChange={(e) => setPurchaseKeyword(e.target.value)}
                  className="h-9 w-52 rounded-md border border-slate-200 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
                <button className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700" type="button">
                  検索
                </button>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input type="checkbox" aria-label="select all" className="h-4 w-4 rounded border-slate-300" />
                    </th>
                    <th className="px-3 py-2 text-left">メーカー</th>
                    <th className="px-3 py-2 text-left">機種</th>
                    <th className="px-3 py-2 text-left">数量</th>
                    <th className="px-3 py-2 text-left">単価</th>
                    <th className="px-3 py-2 text-left">仕入先</th>
                    <th className="px-3 py-2 text-left">担当</th>
                    <th className="px-3 py-2 text-left">入庫日</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchaseDrafts.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 bg-white">
                      <td className="px-3 py-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-2 text-slate-900">{item.maker}</td>
                      <td className="px-3 py-2 text-slate-900">{item.machineName}</td>
                      <td className="px-3 py-2 text-slate-900">{item.quantity} 台</td>
                      <td className="px-3 py-2 text-slate-900">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-slate-800">{item.partner}</td>
                      <td className="px-3 py-2 text-slate-800">{item.handler}</td>
                      <td className="px-3 py-2 text-slate-800">{item.createdAt}</td>
                    </tr>
                  ))}
                  {filteredPurchaseDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                        条件に一致する在庫がありません。
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between">
              <p className="text-[11px] text-slate-500">※在庫登録済・伝票未作成のみを表示しています</p>
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                選択して購入伝票を作成
              </button>
            </div>
          </WorkflowCard>

          <WorkflowCard title="未作成販売伝票" description="ステータスが売却になった在庫のみ表示">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <span className="font-semibold text-emerald-700">検索</span> メーカー / 機種 / 販売先 / 販売日 / 担当
              </div>
              <div className="flex gap-2 text-xs">
                {["業者", "ホール"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSaleType(type as InvoiceType)}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      saleType === type ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {type}伝票
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="search"
                  placeholder="メーカー / 機種 / 販売先 / 担当"
                  value={saleKeyword.trimStart()}
                  onChange={(e) => setSaleKeyword(e.target.value)}
                  className="h-9 w-52 rounded-md border border-slate-200 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
                <button className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700" type="button">
                  検索
                </button>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input type="checkbox" aria-label="select all" className="h-4 w-4 rounded border-slate-300" />
                    </th>
                    <th className="px-3 py-2 text-left">メーカー</th>
                    <th className="px-3 py-2 text-left">機種</th>
                    <th className="px-3 py-2 text-left">数量</th>
                    <th className="px-3 py-2 text-left">販売先</th>
                    <th className="px-3 py-2 text-left">担当</th>
                    <th className="px-3 py-2 text-left">販売日</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSaleDrafts.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 bg-white">
                      <td className="px-3 py-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-2 text-slate-900">{item.maker}</td>
                      <td className="px-3 py-2 text-slate-900">{item.machineName}</td>
                      <td className="px-3 py-2 text-slate-900">{item.quantity} 台</td>
                      <td className="px-3 py-2 text-slate-800">{item.partner}</td>
                      <td className="px-3 py-2 text-slate-800">{item.handler}</td>
                      <td className="px-3 py-2 text-slate-800">{item.saleDate ?? "-"}</td>
                    </tr>
                  ))}
                  {filteredSaleDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                        条件に一致する売却在庫がありません。
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between">
              <p className="text-[11px] text-slate-500">※在庫ステータス「売却」を自動で参照しています</p>
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                選択して販売伝票を作成
              </button>
            </div>
          </WorkflowCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <WorkflowCard title="購入伝票一覧（作成済）" description="新しい順に表示">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">伝票番号</th>
                    <th className="px-3 py-2 text-left">機種</th>
                    <th className="px-3 py-2 text-left">仕入先</th>
                    <th className="px-3 py-2 text-left">担当</th>
                    <th className="px-3 py-2 text-left">作成日</th>
                    <th className="px-3 py-2 text-right">合計金額</th>
                    <th className="px-3 py-2 text-left">帳票</th>
                    <th className="px-3 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100 bg-white">
                      <td className="px-3 py-2 font-semibold text-slate-900">{invoice.id}</td>
                      <td className="px-3 py-2 text-slate-900">{summarizeMachines(invoice.machines)}</td>
                      <td className="px-3 py-2 text-slate-800">{invoice.partner}</td>
                      <td className="px-3 py-2 text-slate-800">{invoice.handler}</td>
                      <td className="px-3 py-2 text-slate-800">{invoice.createdAt}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="px-3 py-2 text-slate-800">
                        <div className="flex flex-col gap-1">
                          {invoice.documents.map((doc) => (
                            <span key={doc} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" type="button">
                            詳細
                          </button>
                          <button className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50" type="button">
                            削除
                          </button>
                          <button className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" type="button">
                            帳票出力
                          </button>
                          <button
                            className="rounded border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            type="button"
                            onClick={() => openModal("purchase", invoice.id)}
                          >
                            書類一括印刷
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkflowCard>

          <WorkflowCard title="販売伝票一覧（作成済）" description="複数機種は「他」で集約表示">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">伝票番号</th>
                    <th className="px-3 py-2 text-left">機種</th>
                    <th className="px-3 py-2 text-left">販売先</th>
                    <th className="px-3 py-2 text-left">担当</th>
                    <th className="px-3 py-2 text-left">作成日</th>
                    <th className="px-3 py-2 text-right">合計金額</th>
                    <th className="px-3 py-2 text-left">帳票</th>
                    <th className="px-3 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {saleInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100 bg-white">
                      <td className="px-3 py-2 font-semibold text-slate-900">{invoice.id}</td>
                      <td className="px-3 py-2 text-slate-900">{summarizeMachines(invoice.machines)}</td>
                      <td className="px-3 py-2 text-slate-800">{invoice.partner}</td>
                      <td className="px-3 py-2 text-slate-800">{invoice.handler}</td>
                      <td className="px-3 py-2 text-slate-800">{invoice.createdAt}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="px-3 py-2 text-slate-800">
                        <div className="flex flex-col gap-1">
                          {invoice.documents.map((doc) => (
                            <span key={doc} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" type="button">
                            詳細
                          </button>
                          <button className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50" type="button">
                            削除
                          </button>
                          <button className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" type="button">
                            帳票出力
                          </button>
                          <button
                            className="rounded border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            type="button"
                            onClick={() => openModal("sale", invoice.id)}
                          >
                            書類一括印刷
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkflowCard>
        </div>
      </MainContainer>

      <DocumentModal modal={modal} onClose={() => setModal(null)} onConfirm={handleConfirmModal} />
    </div>
  );
}
