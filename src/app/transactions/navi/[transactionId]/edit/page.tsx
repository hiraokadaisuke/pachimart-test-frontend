"use client";

import { useMemo, useState, type ReactNode } from "react";
import MainContainer from "@/components/layout/MainContainer";

interface BuyerInfo {
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}

interface PropertyInfo {
  modelName: string;
  maker: string;
  quantity: number;
  storageLocation: string;
  machineNumber?: string;
}

type ShippingType = "元払" | "着払" | "引取";
type DocumentShippingType = "元払" | "着払" | "同梱" | "不要";

interface AdditionalFee {
  label: string;
  amount: number;
}

interface TransactionConditions {
  price: number;
  quantity: number;
  removalDate: string;
  machineShipmentDate: string;
  machineShipmentType: ShippingType;
  documentShipmentDate: string;
  documentShipmentType: DocumentShippingType;
  paymentDue: string;
  freightCost: number;
  otherFee1?: AdditionalFee;
  otherFee2?: AdditionalFee;
  notes: string;
  terms: string;
}

interface MessageLog {
  id: string;
  sender: "buyer" | "seller";
  message: string;
  timestamp: string;
}

const buyerInfo: BuyerInfo = {
  companyName: "株式会社パチテック",
  contactPerson: "営業部 田中 太郎",
  phoneNumber: "03-1234-5678",
  email: "tanaka@example.com",
  notes: "平日10-18時に連絡可。",
};

const propertyInfo: PropertyInfo = {
  modelName: "P スーパー海物語 JAPAN2 L1",
  maker: "三共",
  quantity: 4,
  storageLocation: "東京都江東区倉庫A-12",
  machineNumber: "#A102-#A105",
};

const currentConditions: TransactionConditions = {
  price: 1280000,
  quantity: 4,
  removalDate: "2025-11-22",
  machineShipmentDate: "2025-11-25",
  machineShipmentType: "元払",
  documentShipmentDate: "2025-11-20",
  documentShipmentType: "同梱",
  paymentDue: "2025-11-21",
  freightCost: 22000,
  otherFee1: { label: "設置補助", amount: 15000 },
  otherFee2: { label: "下見費用", amount: 8000 },
  notes: "撤去作業は午後14時以降でお願いします。",
  terms:
    "買手都合によるキャンセルの場合、実費精算となります。\n納品後7日以内の初期不良のみ対応。",
};

const messageLogs: MessageLog[] = [
  {
    id: "1",
    sender: "buyer",
    message: "搬出日と発送日の目安を教えてください。",
    timestamp: "2025/11/18 10:12",
  },
  {
    id: "2",
    sender: "seller",
    message: "搬出は11/22午後、発送は11/25を予定しています。",
    timestamp: "2025/11/18 10:35",
  },
];

const formattedNumber = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export default function TransactionNaviEditPage() {
  const [editedConditions, setEditedConditions] = useState<TransactionConditions>({
    ...currentConditions,
  });
  const [uploadFiles, setUploadFiles] = useState<string[]>(["注文書.pdf", "覚書.docx"]);
  const [photoThumbnails, setPhotoThumbnails] = useState<string[]>([
    "搬出口周辺写真",
    "梱包イメージ",
  ]);
  const [newMessage, setNewMessage] = useState<string>("");

  const breadcrumbItems = useMemo(
    () => ["ホーム", "マイページ", "取引Navi", "編集"],
    []
  );

  const handleSendToBuyer = () => {
    console.log("Send to buyer", editedConditions);
  };

  const handleFileAdd = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files).map((file) => file.name);
    setUploadFiles((prev) => [...prev, ...names]);
  };

  const handlePhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files).map((file) => file.name || "新規写真");
    setPhotoThumbnails((prev) => [...prev, ...names]);
  };

  const renderRadioGroup = <T extends string>(
    name: string,
    options: T[],
    value: T,
    onChange: (next: T) => void
  ) => {
    return (
      <div className="flex flex-wrap gap-3 text-sm text-slate-700">
        {options.map((option) => (
          <label key={option} className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={name}
              className="text-sky-600 focus:ring-sky-500"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 pb-8">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <nav className="text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumbItems.map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span>{item}</span>
                  {index < breadcrumbItems.length - 1 && <span className="text-slate-400">›</span>}
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">取引Naviの編集</h1>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                下書き
              </span>
            </div>
            <div>
              <button
                type="button"
                onClick={handleSendToBuyer}
                className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
              >
                買手へ送信
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-700">
            電話で合意した条件を入力し、買手に送信するための編集画面です。内容を確認してから送信してください。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">買手情報</h2>
              <span className="text-xs font-semibold text-slate-500">取引先</span>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex gap-2">
                <span className="w-24 text-slate-500">会社名</span>
                <span className="font-medium">{buyerInfo.companyName}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-slate-500">担当者</span>
                <span>{buyerInfo.contactPerson}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-slate-500">電話</span>
                <span>{buyerInfo.phoneNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-slate-500">メール</span>
                <span>{buyerInfo.email}</span>
              </div>
              {buyerInfo.notes && (
                <div className="flex gap-2">
                  <span className="w-24 text-slate-500">備考</span>
                  <span className="text-slate-600">{buyerInfo.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">物件情報</h2>
              <span className="text-xs font-semibold text-slate-500">対象機器</span>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex gap-2">
                <span className="w-28 text-slate-500">機種名</span>
                <span className="font-medium">{propertyInfo.modelName}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 text-slate-500">メーカー</span>
                <span>{propertyInfo.maker}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 text-slate-500">台数</span>
                <span>{propertyInfo.quantity} 台</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 text-slate-500">台番号</span>
                <span>{propertyInfo.machineNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 text-slate-500">保管場所</span>
                <span>{propertyInfo.storageLocation}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">現在の取引条件</h2>
            <span className="text-xs font-semibold text-slate-500">プレビュー</span>
          </div>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ConditionRow label="金額" value={`${formattedNumber(currentConditions.price)} / 税込`} />
            <ConditionRow label="台数" value={`${currentConditions.quantity} 台`} />
            <ConditionRow label="撤去日" value={currentConditions.removalDate} />
            <ConditionRow
              label="機械発送予定日"
              value={`${currentConditions.machineShipmentDate}（${currentConditions.machineShipmentType}）`}
            />
            <ConditionRow
              label="書類発送予定日"
              value={`${currentConditions.documentShipmentDate}（${currentConditions.documentShipmentType}）`}
            />
            <ConditionRow label="支払期日" value={currentConditions.paymentDue} />
            <ConditionRow label="機械運賃" value={formattedNumber(currentConditions.freightCost)} />
            <ConditionRow
              label="その他料金1"
              value={
                currentConditions.otherFee1
                  ? `${currentConditions.otherFee1.label}: ${formattedNumber(currentConditions.otherFee1.amount)}`
                  : "-"
              }
            />
            <ConditionRow
              label="その他料金2"
              value={
                currentConditions.otherFee2
                  ? `${currentConditions.otherFee2.label}: ${formattedNumber(currentConditions.otherFee2.amount)}`
                  : "-"
              }
            />
            <ConditionRow label="特記事項" value={currentConditions.notes} />
            <ConditionRow label="取引条件" value={currentConditions.terms} fullWidth />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">取引条件の編集</h2>
            <span className="text-xs font-semibold text-slate-500">変更前｜変更後</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-600">
                  <th className="w-40 px-3 py-2">項目</th>
                  <th className="w-56 px-3 py-2">変更前</th>
                  <th className="px-3 py-2">変更後</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <EditRow label="金額" required>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{formattedNumber(currentConditions.price)}</span>
                  </div>
                  <input
                    type="number"
                    className="w-44 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editedConditions.price}
                    onChange={(e) =>
                      setEditedConditions((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))
                    }
                  />
                </EditRow>

                <EditRow label="台数" required>
                  <span className="text-slate-500">{currentConditions.quantity} 台</span>
                  <input
                    type="number"
                    className="w-32 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editedConditions.quantity}
                    onChange={(e) =>
                      setEditedConditions((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))
                    }
                  />
                </EditRow>

                <EditRow label="撤去日" required>
                  <span className="text-slate-500">{currentConditions.removalDate}</span>
                  <input
                    type="date"
                    className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editedConditions.removalDate}
                    onChange={(e) =>
                      setEditedConditions((prev) => ({ ...prev, removalDate: e.target.value }))
                    }
                  />
                </EditRow>

                <EditRow label="機械発送予定日" required>
                  <span className="text-slate-500">
                    {currentConditions.machineShipmentDate}（{currentConditions.machineShipmentType}）
                  </span>
                  <div className="space-y-2">
                    <input
                      type="date"
                      className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                      value={editedConditions.machineShipmentDate}
                      onChange={(e) =>
                        setEditedConditions((prev) => ({ ...prev, machineShipmentDate: e.target.value }))
                      }
                    />
                    {renderRadioGroup<ShippingType>(
                      "machine-shipping",
                      ["元払", "着払", "引取"],
                      editedConditions.machineShipmentType,
                      (next) => setEditedConditions((prev) => ({ ...prev, machineShipmentType: next }))
                    )}
                  </div>
                </EditRow>

                <EditRow label="書類発送予定日" required>
                  <span className="text-slate-500">
                    {currentConditions.documentShipmentDate}（{currentConditions.documentShipmentType}）
                  </span>
                  <div className="space-y-2">
                    <input
                      type="date"
                      className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                      value={editedConditions.documentShipmentDate}
                      onChange={(e) =>
                        setEditedConditions((prev) => ({ ...prev, documentShipmentDate: e.target.value }))
                      }
                    />
                    {renderRadioGroup<DocumentShippingType>(
                      "document-shipping",
                      ["元払", "着払", "同梱", "不要"],
                      editedConditions.documentShipmentType,
                      (next) => setEditedConditions((prev) => ({ ...prev, documentShipmentType: next }))
                    )}
                  </div>
                </EditRow>

                <EditRow label="支払期日" required>
                  <span className="text-slate-500">{currentConditions.paymentDue}</span>
                  <input
                    type="date"
                    className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editedConditions.paymentDue}
                    onChange={(e) =>
                      setEditedConditions((prev) => ({ ...prev, paymentDue: e.target.value }))
                    }
                  />
                </EditRow>

                <EditRow label="機械運賃">
                  <span className="text-slate-500">{formattedNumber(currentConditions.freightCost)}</span>
                  <input
                    type="number"
                    className="w-44 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editedConditions.freightCost}
                    onChange={(e) =>
                      setEditedConditions((prev) => ({ ...prev, freightCost: Number(e.target.value) || 0 }))
                    }
                  />
                </EditRow>

                <EditRow label="その他料金1">
                  <span className="text-slate-500">
                    {currentConditions.otherFee1
                      ? `${currentConditions.otherFee1.label}: ${formattedNumber(currentConditions.otherFee1.amount)}`
                      : "-"}
                  </span>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <input
                      type="text"
                      className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="種別"
                      value={editedConditions.otherFee1?.label ?? ""}
                      onChange={(e) =>
                        setEditedConditions((prev) => ({
                          ...prev,
                          otherFee1: { label: e.target.value, amount: prev.otherFee1?.amount ?? 0 },
                        }))
                      }
                    />
                    <input
                      type="number"
                      className="w-40 rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="金額"
                      value={editedConditions.otherFee1?.amount ?? 0}
                      onChange={(e) =>
                        setEditedConditions((prev) => ({
                          ...prev,
                          otherFee1: { label: prev.otherFee1?.label ?? "", amount: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                </EditRow>

                <EditRow label="その他料金2">
                  <span className="text-slate-500">
                    {currentConditions.otherFee2
                      ? `${currentConditions.otherFee2.label}: ${formattedNumber(currentConditions.otherFee2.amount)}`
                      : "-"}
                  </span>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <input
                      type="text"
                      className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="種別"
                      value={editedConditions.otherFee2?.label ?? ""}
                      onChange={(e) =>
                        setEditedConditions((prev) => ({
                          ...prev,
                          otherFee2: { label: e.target.value, amount: prev.otherFee2?.amount ?? 0 },
                        }))
                      }
                    />
                    <input
                      type="number"
                      className="w-40 rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="金額"
                      value={editedConditions.otherFee2?.amount ?? 0}
                      onChange={(e) =>
                        setEditedConditions((prev) => ({
                          ...prev,
                          otherFee2: { label: prev.otherFee2?.label ?? "", amount: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                </EditRow>

                <EditRow label="特記事項">
                  <span className="whitespace-pre-wrap text-slate-500">{currentConditions.notes}</span>
                  <textarea
                    className="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                    value={editedConditions.notes}
                    onChange={(e) => setEditedConditions((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </EditRow>

                <EditRow label="取引条件">
                  <span className="whitespace-pre-wrap text-slate-500">{currentConditions.terms}</span>
                  <textarea
                    className="w-72 rounded border border-slate-300 px-3 py-2 text-sm"
                    rows={5}
                    value={editedConditions.terms}
                    onChange={(e) => setEditedConditions((prev) => ({ ...prev, terms: e.target.value }))}
                  />
                </EditRow>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">書類アップロード</h2>
            <span className="text-xs font-semibold text-slate-500">PDF/Excelなど</span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 text-sm text-slate-700">
              <p className="text-slate-600">見積書や注文書などの書類を追加してください。</p>
              <div className="flex flex-wrap gap-2">
                {uploadFiles.map((file) => (
                  <span
                    key={file}
                    className="inline-flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  >
                    📄 {file}
                  </span>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:border-sky-400 hover:bg-slate-50">
              <input type="file" className="hidden" multiple onChange={(e) => handleFileAdd(e.target.files)} />
              <span className="text-sky-700">ファイルを選択</span>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">写真アップロード</h2>
            <span className="text-xs font-semibold text-slate-500">参考画像</span>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-wrap gap-3">
              {photoThumbnails.map((thumb) => (
                <div
                  key={thumb}
                  className="flex h-24 w-32 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-600"
                >
                  {thumb}
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:border-sky-400 hover:bg-slate-50">
              <input type="file" className="hidden" multiple onChange={(e) => handlePhotoAdd(e.target.files)} />
              <span className="text-sky-700">写真を追加</span>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">取引メッセージ</h2>
            <span className="text-xs font-semibold text-slate-500">買手への連絡</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              {messageLogs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm ${
                    log.sender === "seller" ? "border-sky-100 bg-sky-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{log.sender === "seller" ? "あなた" : "買手"}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800">{log.message}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">新規メッセージ</label>
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="買手へのメモや連絡事項を入力"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    console.log("send message", newMessage);
                    setNewMessage("");
                  }}
                  className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-900"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainContainer>
  );
}

function ConditionRow({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded border border-slate-100 bg-slate-50 p-3 ${fullWidth ? "md:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function EditRow({
  label,
  children,
  required,
}: {
  label: string;
  children: [ReactNode, ReactNode] | ReactNode;
  required?: boolean;
}) {
  const content = Array.isArray(children) ? children : [];
  const beforeContent = Array.isArray(children) ? content[0] : null;
  const afterContent = Array.isArray(children) ? content[1] : children;

  return (
    <tr>
      <th className="bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {required && <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">必須</span>}
        </div>
      </th>
      <td className="bg-slate-50 px-3 py-3 text-slate-600">{beforeContent}</td>
      <td className="px-3 py-3">{afterContent}</td>
    </tr>
  );
}
