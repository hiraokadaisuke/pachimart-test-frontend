"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import SellerAutocomplete from "@/components/transactions/SellerAutocomplete";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MainContainer from "@/components/layout/MainContainer";
import { calculateQuote } from "@/lib/quotes/calculateQuote";
import { createEmptyNaviDraft, loadNaviDraft, saveNavi } from "@/lib/navi/storage";
import { type TradeConditions, type TradeNaviDraft } from "@/lib/navi/types";
import {
  formatCurrency,
  useDummyNavi,
  type TransactionConditions,
  type ShippingType,
  type DocumentShippingType,
} from "@/lib/useDummyNavi";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";

const mapDraftConditions = (
  conditions: TradeConditions,
  fallback: TransactionConditions
): TransactionConditions => ({
  price: conditions.unitPrice ?? fallback.price,
  quantity: conditions.quantity ?? fallback.quantity,
  removalDate: conditions.removalDate ?? fallback.removalDate,
  machineShipmentDate: conditions.machineShipmentDate ?? fallback.machineShipmentDate,
  machineShipmentType: (conditions.machineShipmentType as ShippingType | undefined) ?? fallback.machineShipmentType,
  documentShipmentDate: conditions.documentShipmentDate ?? fallback.documentShipmentDate,
  documentShipmentType:
    (conditions.documentShipmentType as DocumentShippingType | undefined) ?? fallback.documentShipmentType,
  paymentDue: conditions.paymentDue ?? fallback.paymentDue,
  freightCost: conditions.shippingFee ?? fallback.freightCost,
  handlingFee: conditions.handlingFee ?? fallback.handlingFee,
  taxRate: conditions.taxRate ?? fallback.taxRate,
  cardboardFee: conditions.cardboardFee ?? fallback.cardboardFee,
  nailSheetFee: conditions.nailSheetFee ?? fallback.nailSheetFee,
  insuranceFee: conditions.insuranceFee ?? fallback.insuranceFee,
  notes: conditions.notes ?? fallback.notes,
  terms: conditions.terms ?? fallback.terms,
  memo: conditions.memo ?? fallback.memo,
  handler: conditions.handler ?? fallback.handler,
});

const mapTransactionToTradeConditions = (
  conditions: TransactionConditions,
  prev: TradeConditions
): TradeConditions => ({
  ...prev,
  unitPrice: conditions.price,
  quantity: conditions.quantity,
  shippingFee: conditions.freightCost,
  handlingFee: conditions.handlingFee,
  taxRate: conditions.taxRate,
  removalDate: conditions.removalDate,
  machineShipmentDate: conditions.machineShipmentDate,
  machineShipmentType: conditions.machineShipmentType,
  documentShipmentDate: conditions.documentShipmentDate,
  documentShipmentType: conditions.documentShipmentType,
  paymentDue: conditions.paymentDue,
  cardboardFee: conditions.cardboardFee,
  nailSheetFee: conditions.nailSheetFee,
  insuranceFee: conditions.insuranceFee,
  notes: conditions.notes,
  terms: conditions.terms,
  memo: conditions.memo,
  handler: conditions.handler,
});

const presetTerms = [
  "通常取引における標準条件です。納品後7日以内の初期不良のみ対応いたします。",
  "長期取引向けの条件です。支払いサイトは月末締め翌月末払い、遅延が生じた場合は別途協議します。",
  "機材に関する追加保証なし。運送事故に関しては保険適用範囲での実費精算となります。",
];

const presetHandlers = ["山田 太郎", "佐藤 花子", "鈴木 一郎", "中村 真紀"];

const additionalFeeLabels = {
  cardboardFee: "段ボール",
  nailSheetFee: "釘シート",
  insuranceFee: "保険",
} as const;

type ValidationErrors = {
  buyer?: string;
  quantity?: string;
  unitPrice?: string;
  shippingFee?: string;
  handlingFee?: string;
  taxRate?: string;
};

const buyerErrorMessage = "売却先が未設定です。このNaviを送信するには先に売却先を設定してください。";

const validateDraft = (draft: TradeNaviDraft | null): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!draft) {
    errors.buyer = "取引情報を読み込めませんでした。";
    return errors;
  }

  const { buyerPending, buyerCompanyName, buyerId, buyerTel, conditions } = draft;

  if (buyerPending || !buyerCompanyName || !buyerId || !buyerTel) {
    errors.buyer = buyerErrorMessage;
  }

  const quantity = conditions.quantity ?? 0;
  if (!quantity || quantity <= 0) {
    errors.quantity = "台数が正しく入力されていません。1以上の数を入力してください。";
  }

  const unitPrice = conditions.unitPrice ?? 0;
  if (!unitPrice || unitPrice <= 0) {
    errors.unitPrice = "単価が正しくありません。";
  }

  const shippingFee = conditions.shippingFee ?? 0;
  if (shippingFee < 0) {
    errors.shippingFee = "送料が正しくありません。";
  }

  const handlingFee = conditions.handlingFee ?? 0;
  if (handlingFee < 0) {
    errors.handlingFee = "出庫手数料が正しくありません。";
  }

  const taxRate = conditions.taxRate ?? 0;
  if (taxRate < 0) {
    errors.taxRate = "税率が正しくありません。";
  }

  return errors;
};

export default function TransactionNaviEditPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const safeSearchParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const transactionId = Array.isArray(params?.id) ? params?.id[0] : params?.id ?? "dummy-1";
  const currentUser = useCurrentDevUser();
  const [draft, setDraft] = useState<TradeNaviDraft | null>(null);
  const naviTargetId = draft?.productId ?? transactionId;
  const {
    editBreadcrumbItems,
    buyerInfo,
    propertyInfo,
    currentConditions,
    updatedConditions,
  } = useDummyNavi(naviTargetId);

  const draftConditions = useMemo(
    () => (draft ? mapDraftConditions(draft.conditions, currentConditions) : null),
    [currentConditions, draft]
  );

  const initialEditedConditions = useMemo(
    () => draftConditions ?? updatedConditions ?? currentConditions,
    [currentConditions, draftConditions, updatedConditions]
  );

  const [editedConditions, setEditedConditions] = useState<TransactionConditions>(initialEditedConditions);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showTermPresets, setShowTermPresets] = useState(false);
  const [showHandlerPresets, setShowHandlerPresets] = useState(false);
  const formattedNumber = formatCurrency;

  useEffect(() => {
    if (!transactionId) return;

    const storedDraft = loadNaviDraft(currentUser.id, transactionId);
    if (storedDraft) {
      setDraft(storedDraft);
      return;
    }

    const parseNumberParam = (value: string | null) => {
      if (!value) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const initialDraft = createEmptyNaviDraft({
      id: transactionId,
      ownerUserId: currentUser.id,
      productId: safeSearchParams.get("productId") ?? transactionId,
      buyerId: safeSearchParams.get("buyerId"),
      buyerCompanyName: safeSearchParams.get("buyerCompanyName"),
      buyerContactName: safeSearchParams.get("buyerContactName"),
      buyerTel: safeSearchParams.get("buyerTel"),
      buyerEmail: safeSearchParams.get("buyerEmail"),
      buyerNote: safeSearchParams.get("buyerNote"),
      buyerPending: safeSearchParams.has("buyerId") ? false : undefined,
      conditions: {
        quantity: parseNumberParam(safeSearchParams.get("quantity")) ?? 1,
        unitPrice: parseNumberParam(safeSearchParams.get("unitPrice")) ?? 0,
        shippingFee: 0,
        handlingFee: 0,
        taxRate: 0.1,
        productName: safeSearchParams.get("productName"),
        makerName: safeSearchParams.get("makerName"),
        location: safeSearchParams.get("location"),
      },
    });

    setDraft(initialDraft);
  }, [currentUser.id, safeSearchParams, transactionId]);

  useEffect(() => {
    setEditedConditions(initialEditedConditions);
  }, [initialEditedConditions]);

  useEffect(() => {
    if (!draft) return;
    setValidationErrors((prev) => {
      if (Object.values(prev).every((error) => !error)) return prev;

      const next = validateDraft(draft);
      const isSame =
        Object.keys(next).every((key) => next[key as keyof ValidationErrors] === prev[key as keyof ValidationErrors]) &&
        Object.keys(prev).every((key) => next[key as keyof ValidationErrors] === prev[key as keyof ValidationErrors]);

      return isSame ? prev : next;
    });
  }, [draft]);

  const persistDraft = (updater: (prev: TradeNaviDraft) => TradeNaviDraft) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextDraft = updater(prev);
      return nextDraft;
    });
  };

  const syncEditedConditions = (updater: (prev: TransactionConditions) => TransactionConditions) => {
    setEditedConditions((prev) => {
      const next = updater(prev);
      persistDraft((draft) => ({
        ...draft,
        conditions: mapTransactionToTradeConditions(next, draft.conditions),
      }));
      return next;
    });
  };

  const handleBuyerSelect = (buyer: {
    id: string;
    name: string;
    contactName?: string;
    tel?: string;
    address?: string;
  }) => {
    persistDraft((prev) => ({
      ...prev,
      buyerId: buyer.id,
      buyerCompanyName: buyer.name,
      buyerContactName: buyer.contactName,
      buyerAddress: buyer.address,
      buyerTel: buyer.tel ?? "000-0000-0000",
      buyerPending: false,
    }));
  };

  const handlePropertyChange = (key: keyof TradeConditions, value: string | number | null) => {
    persistDraft((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: value,
      },
    }));

    if (key === "quantity" && typeof value === "number") {
      syncEditedConditions((prev) => ({ ...prev, quantity: value }));
    }
  };

  const quoteResult = useMemo(() => {
    if (!draft) return null;
    const quoteInput = {
      unitPrice: draft.conditions.unitPrice,
      quantity: draft.conditions.quantity,
      shippingFee: draft.conditions.shippingFee ?? 0,
      handlingFee: draft.conditions.handlingFee ?? 0,
      taxRate: draft.conditions.taxRate ?? 0.1,
      cardboardFee: draft.conditions.cardboardFee ?? 0,
      nailSheetFee: draft.conditions.nailSheetFee ?? 0,
      insuranceFee: draft.conditions.insuranceFee ?? 0,
    } satisfies Parameters<typeof calculateQuote>[0];
    return calculateQuote(quoteInput);
  }, [draft]);

  const handleSendToBuyer = () => {
    const errors = validateDraft(draft);
    setValidationErrors(errors);
    const hasErrors = Object.values(errors).some((error) => Boolean(error));

    if (hasErrors || !draft) return;

    const now = new Date().toISOString();
    const updatedDraft: TradeNaviDraft = {
      ...draft,
      status: "sent_to_buyer",
      buyerPending: false,
      createdAt: draft.createdAt ?? now,
      updatedAt: now,
    };

    saveNavi(currentUser.id, updatedDraft);
    setDraft(updatedDraft);
    alert("取引Naviを売却先へ送信しました。");
    router.push("/trade-navi");
  };

  const renderRadioGroup = <T extends string>(
    name: string,
    options: T[],
    value: T,
    onChange: (next: T) => void
  ) => {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-900">
        {options.map((option) => (
          <label key={option} className="inline-flex items-center gap-1">
            <input
              type="radio"
              name={name}
              className="h-3 w-3 text-sky-600 focus:ring-sky-500"
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

  const isBuyerSet = Boolean(draft?.buyerId || draft?.buyerCompanyName);
  const isProductLinked = Boolean(draft?.productId);
  const referenceConditions = draftConditions ?? currentConditions;
  const displayBuyer = {
    companyName: draft?.buyerCompanyName ?? buyerInfo.companyName,
    contactPerson: draft?.buyerContactName ?? buyerInfo.contactPerson,
    address: draft?.buyerAddress ?? buyerInfo.address,
    phoneNumber: draft?.buyerTel ?? buyerInfo.phoneNumber,
    email: draft?.buyerEmail ?? buyerInfo.email,
    notes: draft?.buyerNote ?? buyerInfo.notes,
  };
  const editableProperty = {
    modelName: draft?.conditions.productName ?? "",
    maker: draft?.conditions.makerName ?? "",
    quantity: draft?.conditions.quantity ?? referenceConditions.quantity,
    location: draft?.conditions.location ?? "",
  };

  const propertyPrevLocation = useMemo(() => {
    const locationParts = [propertyInfo.prefecture, propertyInfo.hallName].filter(Boolean);
    if (locationParts.length) return locationParts.join(" ");
    return propertyInfo.storageLocation;
  }, [propertyInfo.hallName, propertyInfo.prefecture, propertyInfo.storageLocation]);

  const propertySalesPriceLabel = formattedNumber(propertyInfo.salesPrice);
  const propertyRemovalDateLabel = propertyInfo.removalDate.replace(/-/g, "/");
  const propertyNote = propertyInfo.note ?? "-";

  const handleNumberConditionChange = (field: keyof TransactionConditions, value: number) => {
    syncEditedConditions((prev) => ({ ...prev, [field]: value } as TransactionConditions));
  };

  const handleTextConditionChange = (field: keyof TransactionConditions, value: string) => {
    syncEditedConditions((prev) => ({ ...prev, [field]: value } as TransactionConditions));
  };

  const handleAdditionalFeeChange = (
    key: "cardboardFee" | "nailSheetFee" | "insuranceFee",
    amount: number
  ) => {
    syncEditedConditions((prev) => ({
      ...prev,
      [key]: {
        label: prev[key]?.label ?? additionalFeeLabels[key],
        amount,
      },
    }));
  };

  const handleApplyTermPreset = (value: string) => {
    handleTextConditionChange("terms", value);
    setShowTermPresets(false);
  };

  const handleApplyHandlerPreset = (value: string) => {
    handleTextConditionChange("handler", value);
    setShowHandlerPresets(false);
  };

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 pb-8">
        <section className="flex flex-col gap-4 border-b border-slate-300 pb-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              {/* 大見出しをカード見出しより一段階大きく */}
              <h1 className="text-xl font-bold text-slate-900">依頼作成</h1>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              {Object.values(validationErrors).some((error) => Boolean(error)) && (
                <ul className="list-disc space-y-1 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {Object.values(validationErrors)
                    .filter((error): error is string => Boolean(error))
                    .map((error, index) => (
                      <li key={`${error}-${index}`}>{error}</li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                {/* カード見出しを標準文字サイズより一段階大きく */}
                <h2 className="text-base font-semibold text-slate-900">売却先</h2>
                <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
                {isBuyerSet && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-neutral-800">設定済み</span>
                )}
              </div>

              <div className="w-full md:w-auto md:max-w-xl">
                {isBuyerSet ? (
                  <div className="flex justify-start md:justify-end">
                    <button
                      type="button"
                      className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                    >
                      売却先情報を変更
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full justify-start md:justify-end">
                    <SellerAutocomplete
                      onSelect={handleBuyerSelect}
                      hiddenInputName="seller_id"
                      name="seller_name"
                      searchApiPath="/api/sellers/search"
                    />
                  </div>
                )}
              </div>
            </div>

            {validationErrors.buyer && !isBuyerSet && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.buyer}</p>
            )}

            {isBuyerSet && (
              <div className="mt-3 space-y-3 text-sm text-neutral-900">
                <input type="hidden" name="seller_id" value={draft?.buyerId ?? ""} />
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 rounded border border-slate-300 bg-slate-50 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
                  <BuyerInfoItem label="会社名" value={displayBuyer.companyName} emphasis />
                  <BuyerInfoItem label="住所" value={displayBuyer.address ?? "-"} />
                  <BuyerInfoItem label="担当者" value={displayBuyer.contactPerson ?? "-"} />
                  <BuyerInfoItem label="電話番号" value={displayBuyer.phoneNumber ?? "-"} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-300 bg-white text-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2 text-base font-semibold text-neutral-900">
              <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
            </div>
            {isProductLinked ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-t border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-neutral-600">
                      <th className="px-4 py-2 text-left font-semibold">前設置</th>
                      <th className="px-4 py-2 text-left font-semibold">メーカー</th>
                      <th className="px-4 py-2 text-left font-semibold">機種名</th>
                      <th className="px-4 py-2 text-left font-semibold">台数</th>
                      <th className="px-4 py-2 text-left font-semibold">売却価格</th>
                      <th className="px-4 py-2 text-left font-semibold">撤去日</th>
                      <th className="px-4 py-2 text-left font-semibold">備考</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-t border-slate-300 text-slate-900">
                      <td className="whitespace-nowrap px-4 py-2">{propertyPrevLocation}</td>
                      <td className="whitespace-nowrap px-4 py-2">{propertyInfo.maker}</td>
                      <td className="whitespace-nowrap px-4 py-2">{propertyInfo.modelName}</td>
                      <td className="whitespace-nowrap px-4 py-2">{propertyInfo.quantity}台</td>
                      <td className="whitespace-nowrap px-4 py-2">{propertySalesPriceLabel}</td>
                      <td className="whitespace-nowrap px-4 py-2">{propertyRemovalDateLabel}</td>
                      <td className="px-4 py-2">{propertyNote}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3 p-4 text-sm text-neutral-900">
                <p className="text-sm text-neutral-700">商品が紐付いていないため、ここで情報を入力してください。</p>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-800">機種名</label>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.modelName}
                    onChange={(e) => handlePropertyChange("productName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-800">メーカー</label>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.maker}
                    onChange={(e) => handlePropertyChange("makerName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-800">台数</label>
                  <input
                    type="number"
                    className="w-32 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.quantity}
                    onChange={(e) => handlePropertyChange("quantity", Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-800">保管場所</label>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.location}
                    onChange={(e) => handlePropertyChange("location", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2 text-base font-semibold text-neutral-900">
            <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
          </div>
          <div className="grid gap-3 px-4 py-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-neutral-700">
                      <th className="w-36 px-3 py-1.5">項目</th>
                      <th className="w-48 px-3 py-1.5">参考値</th>
                      <th className="px-3 py-1.5">編集</th>
                  </tr>
                  </thead>
                  <tbody className="text-slate-900">
                    <EditRow label="単価" required>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-700">{formattedNumber(referenceConditions.price)}</span>
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.price}
                          onChange={(e) => handleNumberConditionChange("price", Number(e.target.value) || 0)}
                        />
                        {validationErrors.unitPrice && (
                          <p className="text-sm text-red-600">{validationErrors.unitPrice}</p>
                        )}
                      </div>
                    </EditRow>

                    <EditRow label="台数" required>
                      <span className="text-neutral-700">{referenceConditions.quantity} 台</span>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.quantity}
                          onChange={(e) => handleNumberConditionChange("quantity", Number(e.target.value) || 0)}
                        />
                        {validationErrors.quantity && (
                          <p className="text-sm text-red-600">{validationErrors.quantity}</p>
                        )}
                      </div>
                    </EditRow>

                    <EditRow label="撤去日" required>
                      <span className="text-neutral-700">{referenceConditions.removalDate}</span>
                      <input
                        type="date"
                        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={editedConditions.removalDate}
                        onChange={(e) => handleTextConditionChange("removalDate", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="機械発送予定日" required>
                      <span className="text-neutral-700">
                        {referenceConditions.machineShipmentDate}（{referenceConditions.machineShipmentType}）
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="date"
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.machineShipmentDate}
                          onChange={(e) => handleTextConditionChange("machineShipmentDate", e.target.value)}
                        />
                        {renderRadioGroup<ShippingType>(
                          "machine-shipping",
                          ["元払", "着払", "引取"],
                          editedConditions.machineShipmentType,
                          (next) => handleTextConditionChange("machineShipmentType", next)
                        )}
                      </div>
                    </EditRow>

                    <EditRow label="書類発送予定日" required>
                      <span className="text-neutral-700">
                        {referenceConditions.documentShipmentDate}（{referenceConditions.documentShipmentType}）
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="date"
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.documentShipmentDate}
                          onChange={(e) => handleTextConditionChange("documentShipmentDate", e.target.value)}
                        />
                        {renderRadioGroup<DocumentShippingType>(
                          "document-shipping",
                          ["元払", "着払", "同梱", "不要"],
                          editedConditions.documentShipmentType,
                          (next) => handleTextConditionChange("documentShipmentType", next)
                        )}
                      </div>
                    </EditRow>

                    <EditRow label="支払期日" required>
                      <span className="text-neutral-700">{referenceConditions.paymentDue}</span>
                      <input
                        type="date"
                        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={editedConditions.paymentDue}
                        onChange={(e) => handleTextConditionChange("paymentDue", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="機械運賃">
                      <span className="text-neutral-700">{formattedNumber(referenceConditions.freightCost)}</span>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.freightCost}
                          onChange={(e) => handleNumberConditionChange("freightCost", Number(e.target.value) || 0)}
                        />
                        {validationErrors.shippingFee && (
                          <p className="text-sm text-red-600">{validationErrors.shippingFee}</p>
                        )}
                      </div>
                    </EditRow>

                    <EditRow label="出庫手数料">
                      <span className="text-neutral-700">{formattedNumber(referenceConditions.handlingFee)}</span>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.handlingFee}
                          onChange={(e) => handleNumberConditionChange("handlingFee", Number(e.target.value) || 0)}
                        />
                        {validationErrors.handlingFee && (
                          <p className="text-sm text-red-600">{validationErrors.handlingFee}</p>
                        )}
                      </div>
                    </EditRow>
                    <EditRow label="段ボール">
                      <span className="text-neutral-700">
                        {referenceConditions.cardboardFee
                          ? formattedNumber(referenceConditions.cardboardFee.amount)
                          : "-"}
                      </span>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.cardboardFee?.amount ?? 0}
                          onChange={(e) => handleAdditionalFeeChange("cardboardFee", Number(e.target.value) || 0)}
                        />
                      </div>
                    </EditRow>

                    <EditRow label="釘シート">
                      <span className="text-neutral-700">
                        {referenceConditions.nailSheetFee
                          ? formattedNumber(referenceConditions.nailSheetFee.amount)
                          : "-"}
                      </span>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.nailSheetFee?.amount ?? 0}
                          onChange={(e) => handleAdditionalFeeChange("nailSheetFee", Number(e.target.value) || 0)}
                        />
                      </div>
                    </EditRow>

                    <EditRow label="保険">
                      <span className="text-neutral-700">
                        {referenceConditions.insuranceFee
                          ? formattedNumber(referenceConditions.insuranceFee.amount)
                          : "-"}
                      </span>
                      <div className="flex flex-col items-start gap-1">
                        <input
                          type="number"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editedConditions.insuranceFee?.amount ?? 0}
                          onChange={(e) => handleAdditionalFeeChange("insuranceFee", Number(e.target.value) || 0)}
                        />
                      </div>
                    </EditRow>

                    <EditRow label="特記事項">
                      <span className="whitespace-pre-wrap text-neutral-700">{referenceConditions.notes}</span>
                      <textarea
                        className="w-64 rounded border border-slate-300 px-2 py-1 text-sm"
                        rows={2}
                        value={editedConditions.notes}
                        onChange={(e) => handleTextConditionChange("notes", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="取引条件">
                      <span className="whitespace-pre-wrap text-neutral-700">{referenceConditions.terms}</span>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="mb-1 w-fit rounded border border-slate-300 px-2 py-0.5 text-[11px] text-neutral-800 hover:bg-slate-50"
                          onClick={() => setShowTermPresets((prev) => !prev)}
                        >
                          登録情報から選択
                        </button>
                        {showTermPresets && (
                          <select
                            className="w-full max-w-xs rounded border border-slate-300 px-2 py-1 text-sm"
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              handleApplyTermPreset(e.target.value);
                              e.target.value = "";
                            }}
                          >
                            <option value="">テンプレートを選択</option>
                            {presetTerms.map((term) => (
                              <option key={term} value={term}>
                                {term}
                              </option>
                            ))}
                          </select>
                        )}
                        <textarea
                          className="h-24 w-full resize-vertical rounded border border-slate-300 px-2 py-1 text-sm"
                          placeholder="400文字以内、7行以内"
                          value={editedConditions.terms}
                          onChange={(e) => handleTextConditionChange("terms", e.target.value)}
                        />
                      </div>
                    </EditRow>

                    <EditRow label="メモ">
                      <span className="whitespace-pre-wrap text-neutral-700">{referenceConditions.memo ?? "-"}</span>
                      <textarea
                        className="h-20 w-full resize-vertical rounded border border-slate-300 px-2 py-1 text-sm"
                        placeholder="備考など自由入力"
                        value={editedConditions.memo ?? ""}
                        onChange={(e) => handleTextConditionChange("memo", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="担当者">
                      <span className="text-neutral-700">{referenceConditions.handler ?? "-"}</span>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="self-start rounded border border-slate-300 px-2 py-0.5 text-xs text-neutral-800 hover:bg-slate-50"
                          onClick={() => setShowHandlerPresets((prev) => !prev)}
                        >
                          登録情報から選択
                        </button>
                        {showHandlerPresets && (
                          <select
                            className="w-full max-w-xs rounded border border-slate-300 px-2 py-1 text-sm"
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              handleApplyHandlerPreset(e.target.value);
                              e.target.value = "";
                            }}
                          >
                            <option value="">担当者を選択</option>
                            {presetHandlers.map((handler) => (
                              <option key={handler} value={handler}>
                                {handler}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          className="w-full max-w-xs rounded border border-slate-300 px-2 py-1 text-sm"
                          placeholder="50文字以内"
                          value={editedConditions.handler ?? ""}
                          onChange={(e) => handleTextConditionChange("handler", e.target.value)}
                        />
                      </div>
                    </EditRow>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 rounded border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">金額内訳</h3>
                <span className="text-xs font-semibold text-neutral-700">自動再計算</span>
              </div>
              {quoteResult ? (
                <div className="space-y-2 text-sm text-slate-800">
                  <SummaryRow label="商品代金" value={formattedNumber(quoteResult.productSubtotal)} />
                  <SummaryRow label="送料" value={formattedNumber(quoteResult.shippingFee)} />
                  <SummaryRow label="出庫手数料" value={formattedNumber(quoteResult.handlingFee)} />
                  <SummaryRow label="段ボール" value={formattedNumber(quoteResult.cardboardFee)} />
                  <SummaryRow label="釘シート" value={formattedNumber(quoteResult.nailSheetFee)} />
                  <SummaryRow label="保険" value={formattedNumber(quoteResult.insuranceFee)} />
                  <div className="h-px bg-slate-300" aria-hidden />
                  <SummaryRow label="小計" value={formattedNumber(quoteResult.subtotal)} />
                  <SummaryRow label="消費税" value={formattedNumber(quoteResult.tax)} />
                  <SummaryRow label="合計" value={formattedNumber(quoteResult.total)} emphasis />
                </div>
              ) : (
                <p className="text-sm text-neutral-700">金額を入力すると自動計算されます。</p>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleSendToBuyer}
            disabled={draft?.buyerPending || !isBuyerSet}
            className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            内容を確定して取引先に送信する
          </button>
        </div>

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
    <div className={`flex flex-col gap-1 rounded border border-slate-300 bg-white p-3 ${fullWidth ? "md:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-700">{label}</dt>
      <dd className="text-sm text-neutral-900 whitespace-pre-wrap">{value}</dd>
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
    <tr className="border-t border-slate-300">
      <th className="bg-slate-50 px-3 py-1.5 text-left text-xs font-semibold text-neutral-900 align-middle">
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {required && (
            <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
          )}
        </div>
      </th>
      <td className="bg-slate-50 px-3 py-1 align-middle text-neutral-800">{beforeContent}</td>
      <td className="px-3 py-1 align-middle">{afterContent}</td>
    </tr>
  );
}

function BuyerInfoItem({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-neutral-500">{label}</span>
      <span className={`text-sm ${emphasis ? "font-semibold text-slate-900" : "text-neutral-900"}`}>{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-800">{label}</span>
      <span className={`font-semibold ${emphasis ? "text-sky-700" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
