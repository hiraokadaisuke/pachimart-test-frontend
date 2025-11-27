"use client";

import { useState, type ReactNode } from "react";
import MainContainer from "@/components/layout/MainContainer";
import { formatCurrency, useDummyNavi, type MessageLog } from "@/lib/useDummyNavi";

export default function TransactionNaviConfirmPage() {
  const {
    confirmBreadcrumbItems,
    buyerInfo,
    propertyInfo,
    updatedConditions,
    documentFiles,
    photoThumbnails,
    messageLogs,
    statusLabel,
  } = useDummyNavi();
  const [newMessage, setNewMessage] = useState("");

  const handleDownload = (file: string) => {
    console.log("download", file);
  };

  const handlePreviewPhoto = (name: string) => {
    console.log("open photo", name);
  };

  const handleSendMessage = () => {
    console.log("send message", newMessage);
    setNewMessage("");
  };

  const handleApprove = () => {
    console.log("approve transaction");
  };

  const handleRequestRevision = () => {
    console.log("request revision");
  };

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 pb-10">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <nav className="text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              {confirmBreadcrumbItems.map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span>{item}</span>
                  {index < confirmBreadcrumbItems.length - 1 && (
                    <span className="text-slate-400">›</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">取引Naviの確認</h1>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                {statusLabel}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              買手が最終条件を確認し、承認または差戻しを選択するページです。
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard title="買手情報" badge="取引先">
            <InfoRow label="会社名" value={buyerInfo.companyName} emphasis />
            <InfoRow label="担当者" value={buyerInfo.contactPerson} />
            <InfoRow label="電話" value={buyerInfo.phoneNumber} />
            <InfoRow label="メール" value={buyerInfo.email} />
            {buyerInfo.notes && <InfoRow label="備考" value={buyerInfo.notes} muted />}
          </InfoCard>

          <InfoCard title="物件情報" badge="対象機器">
            <InfoRow label="機種名" value={propertyInfo.modelName} emphasis />
            <InfoRow label="メーカー" value={propertyInfo.maker} />
            <InfoRow label="台数" value={`${propertyInfo.quantity} 台`} />
            <InfoRow label="台番号" value={propertyInfo.machineNumber ?? "-"} />
            <InfoRow label="保管場所" value={propertyInfo.storageLocation} />
          </InfoCard>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">最終取引条件</h2>
            <span className="text-xs font-semibold text-slate-500">変更後</span>
          </div>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ConditionRow label="金額" value={`${formatCurrency(updatedConditions.price)} / 税込`} />
            <ConditionRow label="台数" value={`${updatedConditions.quantity} 台`} />
            <ConditionRow label="撤去日" value={updatedConditions.removalDate} />
            <ConditionRow
              label="機械発送予定日"
              value={`${updatedConditions.machineShipmentDate}（${updatedConditions.machineShipmentType}）`}
            />
            <ConditionRow
              label="書類発送予定日"
              value={`${updatedConditions.documentShipmentDate}（${updatedConditions.documentShipmentType}）`}
            />
            <ConditionRow label="支払期日" value={updatedConditions.paymentDue} />
            <ConditionRow label="機械運賃" value={formatCurrency(updatedConditions.freightCost)} />
            <ConditionRow
              label="その他料金1"
              value={
                updatedConditions.otherFee1
                  ? `${updatedConditions.otherFee1.label}: ${formatCurrency(updatedConditions.otherFee1.amount)}`
                  : "-"
              }
            />
            <ConditionRow
              label="その他料金2"
              value={
                updatedConditions.otherFee2
                  ? `${updatedConditions.otherFee2.label}: ${formatCurrency(updatedConditions.otherFee2.amount)}`
                  : "-"
              }
            />
            <ConditionRow label="特記事項" value={updatedConditions.notes} />
            <ConditionRow label="取引条件" value={updatedConditions.terms} fullWidth />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">書類一覧</h2>
            <span className="text-xs font-semibold text-slate-500">ダウンロードのみ</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-700">
            {documentFiles.map((file) => (
              <button
                key={file}
                type="button"
                onClick={() => handleDownload(file)}
                className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
              >
                <span className="text-sky-700">⬇</span>
                <span>{file}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">写真一覧</h2>
            <span className="text-xs font-semibold text-slate-500">参考画像</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photoThumbnails.map((thumb) => (
              <button
                key={thumb}
                type="button"
                onClick={() => handlePreviewPhoto(thumb)}
                className="flex h-28 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
              >
                {thumb}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">取引メッセージ</h2>
            <span className="text-xs font-semibold text-slate-500">やり取りログ</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              {messageLogs.map((log) => (
                <MessageBubble key={log.id} log={log} />
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">新しくメッセージを送る</label>
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="確認事項や依頼事項を入力"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-900"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-700">
            内容を確認のうえ、承認または差戻しを選択してください。選択後に担当者へ通知されます。
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={handleRequestRevision}
              className="rounded border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              差戻しを依頼する
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
            >
              承認する
            </button>
          </div>
        </section>
      </div>
    </MainContainer>
  );
}

function InfoCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-xs font-semibold text-slate-500">{badge}</span>
      </div>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-24 text-slate-500">{label}</span>
      <span className={`${emphasis ? "font-medium text-slate-900" : "text-slate-800"} ${muted ? "text-slate-600" : ""}`}>
        {value}
      </span>
    </div>
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
    <div
      className={`flex flex-col gap-1 rounded border border-slate-100 bg-slate-50 p-3 ${fullWidth ? "md:col-span-2" : ""}`}
    >
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function MessageBubble({ log }: { log: MessageLog }) {
  const isSeller = log.sender === "seller";

  return (
    <div
      className={`rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm ${
        isSeller ? "border-sky-100 bg-sky-50" : ""
      }`}
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{isSeller ? "売手 (あなた)" : "買手"}</span>
        <span>{log.timestamp}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-slate-800">{log.message}</p>
    </div>
  );
}
