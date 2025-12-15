"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import MainContainer from "@/components/layout/MainContainer";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { type TradeStatusKey } from "@/components/transactions/status";
import { formatCurrency, useDummyNavi } from "@/lib/useDummyNavi";

type ShippingInfo = {
  companyName: string;
  department: string;
  postalCode: string;
  address1: string;
  address2: string;
  phoneNumber: string;
  contactPerson: string;
  contactEmail: string;
};

type ShippingErrors = Partial<Record<keyof ShippingInfo, string>>;

const paymentMethodText = "銀行振込（三井住友銀行 丸の内支店 普通 1234567 パチマート）";

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const naviId = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : params?.id), [params]);
  const transactionId = naviId ?? "dummy-1";
  const {
    buyerInfo,
    propertyInfo,
    currentConditions,
  } = useDummyNavi(transactionId);

  const [statusKey, setStatusKey] = useState<TradeStatusKey>("requesting");
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    companyName: buyerInfo.companyName,
    department: "営業部",
    postalCode: "100-0001",
    address1: buyerInfo.address ?? "東京都千代田区丸の内1-1-1",
    address2: "パチマートビル10F",
    phoneNumber: buyerInfo.phoneNumber,
    contactPerson: buyerInfo.contactPerson ?? "担当者 未設定",
    contactEmail: buyerInfo.email,
  });
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productSubtotal = currentConditions.price * currentConditions.quantity;
  const totalTax = Math.floor((productSubtotal + currentConditions.freightCost + currentConditions.handlingFee) * currentConditions.taxRate);
  const grandTotal = productSubtotal + currentConditions.freightCost + currentConditions.handlingFee + totalTax;

  const isBuyerView = true;
  const requiresApproval = isBuyerView && statusKey === "requesting";

  const validateShippingInfo = (info: ShippingInfo): ShippingErrors => {
    const errors: ShippingErrors = {};

    if (!info.companyName.trim()) errors.companyName = "会社名は必須です";
    if (!info.postalCode.trim()) errors.postalCode = "郵便番号を入力してください";
    if (!info.address1.trim()) errors.address1 = "住所1を入力してください";
    if (!info.phoneNumber.trim()) errors.phoneNumber = "電話番号を入力してください";
    if (!info.contactPerson.trim()) errors.contactPerson = "担当者名を入力してください";

    return errors;
  };

  const saveShippingInfo = async (info: ShippingInfo) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        console.info("Saved shipping info", info);
        resolve();
      }, 400);
    });

  const updateStatusToWaitingPayment = async () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 300);
    });

  const handleApprove = async () => {
    setActionMessage(null);
    const errors = validateShippingInfo(shippingInfo);
    setShippingErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      await saveShippingInfo(shippingInfo);
      await updateStatusToWaitingPayment();
      setStatusKey("waiting_payment");
      setActionMessage({ type: "success", text: "配送先情報を保存し、取引を承認しました。" });
      router.push("/trade-navi?tab=progress");
    } catch (error) {
      console.error(error);
      setActionMessage({ type: "error", text: "承認処理に失敗しました。時間をおいて再度お試しください。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-6 py-6 md:py-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">取引詳細</h1>
            <p className="text-sm text-neutral-800">
              この画面では取引の内容を確認し、買手として配送先を入力して承認できます。
            </p>
            <p className="text-xs text-neutral-600">取引ID：{transactionId}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
            <span>ステータス</span>
            <StatusBadge statusKey={statusKey} />
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">基本情報</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-neutral-800 md:grid-cols-3">
            <div>
              <dt className="text-xs text-neutral-600">案件名</dt>
              <dd className="font-medium">{propertyInfo.modelName}の取引</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-600">売手</dt>
              <dd className="font-medium">株式会社ダミー商事（想定）</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-600">買手</dt>
              <dd className="font-medium">{buyerInfo.companyName}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">商品情報（売手入力）</h3>
              <span className="text-xs text-neutral-600">読み取り専用</span>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-neutral-800 md:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-600">メーカー</dt>
                <dd className="font-medium">{propertyInfo.maker}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">機種名</dt>
                <dd className="font-medium">{propertyInfo.modelName}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">台数</dt>
                <dd className="font-medium">{propertyInfo.quantity} 台</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">単価</dt>
                <dd className="font-medium">{formatCurrency(currentConditions.price)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">小計</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(productSubtotal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">保管場所</dt>
                <dd className="font-medium">{propertyInfo.storageLocation}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">撤去予定日</dt>
                <dd className="font-medium">{currentConditions.removalDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">備考</dt>
                <dd className="font-medium text-neutral-700">{propertyInfo.note ?? "特記事項なし"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">取引条件（売手入力）</h3>
              <span className="text-xs text-neutral-600">読み取り専用</span>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-neutral-800 md:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-600">発送方法</dt>
                <dd className="font-medium">{currentConditions.machineShipmentType}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">発送予定日</dt>
                <dd className="font-medium">{currentConditions.machineShipmentDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">支払期日</dt>
                <dd className="font-medium">{currentConditions.paymentDue}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">支払方法（振込先）</dt>
                <dd className="font-medium text-neutral-700">{paymentMethodText}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">発送書類</dt>
                <dd className="font-medium">
                  {currentConditions.documentShipmentType} / {currentConditions.documentShipmentDate}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">担当者</dt>
                <dd className="font-medium">{currentConditions.handler}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-neutral-600">備考</dt>
                <dd className="font-medium text-neutral-700">{currentConditions.notes || "特になし"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">金額サマリー</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-neutral-800 md:grid-cols-2 lg:grid-cols-3">
            <SummaryRow label="商品代金" value={formatCurrency(productSubtotal)} />
            <SummaryRow label="送料" value={formatCurrency(currentConditions.freightCost)} />
            <SummaryRow label="出庫手数料" value={formatCurrency(currentConditions.handlingFee)} />
            <SummaryRow label="消費税" value={formatCurrency(totalTax)} />
            <SummaryRow label="税込合計" value={formatCurrency(grandTotal)} emphasized />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">配送先情報</h2>
            {requiresApproval ? (
              <span className="text-xs font-semibold text-sky-700">買手入力が必要</span>
            ) : (
              <span className="text-xs text-neutral-600">承認済み（閲覧のみ）</span>
            )}
          </div>

          {requiresApproval ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ShippingInput
                label="会社名"
                required
                value={shippingInfo.companyName}
                error={shippingErrors.companyName}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, companyName: value }))}
              />
              <ShippingInput
                label="部署名"
                value={shippingInfo.department}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, department: value }))}
              />
              <ShippingInput
                label="郵便番号"
                required
                value={shippingInfo.postalCode}
                error={shippingErrors.postalCode}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, postalCode: value }))}
              />
              <ShippingInput
                label="電話番号"
                required
                value={shippingInfo.phoneNumber}
                error={shippingErrors.phoneNumber}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, phoneNumber: value }))}
              />
              <ShippingInput
                label="住所1"
                required
                value={shippingInfo.address1}
                error={shippingErrors.address1}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, address1: value }))}
              />
              <ShippingInput
                label="住所2"
                value={shippingInfo.address2}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, address2: value }))}
              />
              <ShippingInput
                label="担当者名"
                required
                value={shippingInfo.contactPerson}
                error={shippingErrors.contactPerson}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, contactPerson: value }))}
              />
              <ShippingInput
                label="担当者メールアドレス"
                value={shippingInfo.contactEmail}
                onChange={(value) => setShippingInfo((prev) => ({ ...prev, contactEmail: value }))}
              />
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-3 text-sm text-neutral-800 md:grid-cols-2">
              <ShippingDisplay label="会社名" value={shippingInfo.companyName} />
              <ShippingDisplay label="部署名" value={shippingInfo.department || "-"} />
              <ShippingDisplay label="郵便番号" value={shippingInfo.postalCode} />
              <ShippingDisplay label="電話番号" value={shippingInfo.phoneNumber} />
              <ShippingDisplay label="住所1" value={shippingInfo.address1} />
              <ShippingDisplay label="住所2" value={shippingInfo.address2 || "-"} />
              <ShippingDisplay label="担当者名" value={shippingInfo.contactPerson} />
              <ShippingDisplay label="担当者メールアドレス" value={shippingInfo.contactEmail || "-"} />
            </dl>
          )}
        </section>

        {requiresApproval && (
          <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            {actionMessage && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  actionMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {actionMessage.text}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">届いた依頼を確認し、配送先を入力してください。</p>
                <p className="text-xs text-neutral-700">入力内容は承認時に保存され、ステータスが「要入金」に更新されます。</p>
              </div>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "処理中..." : "承認して進める"}
              </button>
            </div>
          </section>
        )}
      </div>
    </MainContainer>
  );
}

function SummaryRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded border px-3 py-2 ${emphasized ? "border-sky-200 bg-sky-50" : "border-slate-200"}`}>
      <span className="text-xs text-neutral-600">{label}</span>
      <span className={`text-sm font-semibold ${emphasized ? "text-slate-900" : "text-neutral-900"}`}>{value}</span>
    </div>
  );
}

function ShippingInput({
  label,
  value,
  required,
  error,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-900">
      <span className="flex items-center gap-1 text-xs text-neutral-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <input
        className={`w-full rounded border px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none ${
          error ? "border-red-300 bg-red-50" : "border-slate-300"
        }`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function ShippingDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-neutral-600">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
