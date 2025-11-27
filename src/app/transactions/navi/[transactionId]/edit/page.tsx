"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MainContainer from "@/components/layout/MainContainer";
import { calculateQuote } from "@/lib/quotes/calculateQuote";
import { loadNaviDraft, saveNaviDraft } from "@/lib/navi/storage";
import { type TradeConditions, type TradeNaviDraft } from "@/lib/navi/types";
import {
  formatCurrency,
  useDummyNavi,
  type TransactionConditions,
  type ShippingType,
  type DocumentShippingType,
} from "@/lib/useDummyNavi";

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
  otherFee1: conditions.otherFee1 ?? fallback.otherFee1,
  otherFee2: conditions.otherFee2 ?? fallback.otherFee2,
  notes: conditions.notes ?? fallback.notes,
  terms: conditions.terms ?? fallback.terms,
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
  otherFee1: conditions.otherFee1,
  otherFee2: conditions.otherFee2,
  notes: conditions.notes,
  terms: conditions.terms,
});

const dummyBuyers = [
  { id: "store-1", companyName: "株式会社パテテック", contactName: "営業部 田中太郎", tel: "03-1234-5678" },
  { id: "store-2", companyName: "有限会社テスト商会", contactName: "営業部 佐藤花子", tel: "06-9876-5432" },
  { id: "store-3", companyName: "合同会社デモリンク", contactName: "営業部 山本正樹", tel: "052-123-9876" },
];

const defaultManualBuyer = { companyName: "", contactName: "", tel: "" };

export default function TransactionNaviEditPage() {
  const router = useRouter();
  const params = useParams<{ transactionId?: string }>();
  const transactionId = Array.isArray(params?.transactionId)
    ? params?.transactionId[0]
    : params?.transactionId ?? "dummy-1";
  const [draft, setDraft] = useState<TradeNaviDraft | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [manualBuyer, setManualBuyer] = useState(defaultManualBuyer);
  const naviTargetId = draft?.productId ?? transactionId;
  const {
    editBreadcrumbItems,
    buyerInfo,
    propertyInfo,
    currentConditions,
    updatedConditions,
    documentFiles,
    photoThumbnails: defaultPhotoThumbnails,
    messageLogs,
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
  const [uploadFiles, setUploadFiles] = useState<string[]>(documentFiles);
  const [photoThumbnails, setPhotoThumbnails] = useState<string[]>(defaultPhotoThumbnails);
  const [newMessage, setNewMessage] = useState<string>("");
  const formattedNumber = formatCurrency;

  useEffect(() => {
    if (!transactionId) return;
    const storedDraft = loadNaviDraft(transactionId);
    if (storedDraft) {
      setDraft(storedDraft);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  }, [transactionId]);

  useEffect(() => {
    setEditedConditions(initialEditedConditions);
  }, [initialEditedConditions]);

  const persistDraft = (updater: (prev: TradeNaviDraft) => TradeNaviDraft) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextDraft = updater(prev);
      saveNaviDraft(nextDraft);
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

  const handleBuyerSelect = (buyer: (typeof dummyBuyers)[number]) => {
    persistDraft((prev) => ({
      ...prev,
      buyerId: buyer.id,
      buyerCompanyName: buyer.companyName,
      buyerContactName: buyer.contactName,
      buyerTel: buyer.tel,
      buyerPending: false,
    }));
  };

  const handleManualBuyerSave = () => {
    if (!manualBuyer.companyName.trim()) return;
    persistDraft((prev) => ({
      ...prev,
      buyerId: null,
      buyerCompanyName: manualBuyer.companyName,
      buyerContactName: manualBuyer.contactName || null,
      buyerTel: manualBuyer.tel || null,
      buyerPending: false,
    }));
    setManualBuyer(defaultManualBuyer);
  };

  const buyerSearchResults = useMemo(() => {
    if (!searchKeyword.trim()) return dummyBuyers;
    return dummyBuyers.filter((buyer) => {
      const keyword = searchKeyword.trim();
      return (
        buyer.companyName.includes(keyword) ||
        buyer.contactName.includes(keyword) ||
        buyer.tel.includes(keyword) ||
        buyer.id.includes(keyword)
      );
    });
  }, [searchKeyword]);

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
    } satisfies Parameters<typeof calculateQuote>[0];
    return calculateQuote(quoteInput);
  }, [draft]);

  if (notFound) {
    return (
      <MainContainer>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">取引Naviが見つかりません</h1>
          <p className="text-sm text-slate-600">
            セッションの有効期限切れか、存在しないIDです。再度一覧からやり直してください。
          </p>
          <Link
            href="/trade-navi"
            className="inline-flex items-center justify-center rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            取引Navi一覧へ戻る
          </Link>
        </div>
      </MainContainer>
    );
  }

  const handleSendToBuyer = () => {
    console.log("Send to buyer", editedConditions);
    router.push(`/transactions/navi/${transactionId}`);
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

  const isBuyerSet = Boolean(draft?.buyerId || draft?.buyerCompanyName);
  const isProductLinked = Boolean(draft?.productId);
  const referenceConditions = draftConditions ?? currentConditions;
  const displayBuyer = {
    companyName: draft?.buyerCompanyName ?? buyerInfo.companyName,
    contactPerson: draft?.buyerContactName ?? buyerInfo.contactPerson,
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

  const handleNumberConditionChange = (field: keyof TransactionConditions, value: number) => {
    syncEditedConditions((prev) => ({ ...prev, [field]: value } as TransactionConditions));
  };

  const handleTextConditionChange = (field: keyof TransactionConditions, value: string) => {
    syncEditedConditions((prev) => ({ ...prev, [field]: value } as TransactionConditions));
  };

  const handleOtherFeeChange = (
    key: "otherFee1" | "otherFee2",
    part: "label" | "amount",
    value: string | number
  ) => {
    syncEditedConditions((prev) => ({
      ...prev,
      [key]: {
        label: part === "label" ? String(value) : prev[key]?.label ?? "",
        amount: part === "amount" ? Number(value) || 0 : prev[key]?.amount ?? 0,
      },
    }));
  };

  const handleManualBuyerInput = (
    field: keyof typeof manualBuyer,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setManualBuyer((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 pb-8">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <nav className="text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              {editBreadcrumbItems.map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span>{item}</span>
                  {index < editBreadcrumbItems.length - 1 && <span className="text-slate-400">›</span>}
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
              <div>
                <h2 className="text-lg font-semibold text-slate-900">買手情報</h2>
                {!isBuyerSet && (
                  <p className="text-xs text-amber-600">買手が未設定です。設定してから送信してください。</p>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-500">取引先</span>
            </div>

            {isBuyerSet ? (
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">設定済み</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-sky-700 underline-offset-2 hover:underline"
                  >
                    買手情報を変更
                  </button>
                </div>
                <InfoRow label="会社名" value={displayBuyer.companyName} emphasis />
                <InfoRow label="担当者" value={displayBuyer.contactPerson ?? "-"} />
                <InfoRow label="電話" value={displayBuyer.phoneNumber ?? "-"} />
                <InfoRow label="メール" value={displayBuyer.email ?? "-"} />
                {displayBuyer.notes && <InfoRow label="備考" value={displayBuyer.notes} muted />}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-700">
                  買手が未設定です。パチマート会員を検索するか、会員外として登録してください。
                </p>
                <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
                  <label className="text-xs font-semibold text-slate-600">会員検索</label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      type="text"
                      className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="会社名 / 店舗名 / 会員ID / 電話番号 / 担当者名 で検索"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow"
                    >
                      検索
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {buyerSearchResults.map((buyer) => (
                      <div
                        key={buyer.id}
                        className="flex flex-col gap-1 rounded border border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{buyer.companyName}</p>
                          <p className="text-xs text-slate-600">
                            {buyer.contactName}｜{buyer.tel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBuyerSelect(buyer)}
                          className="mt-2 inline-flex items-center justify-center rounded bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-sky-700 md:mt-0"
                        >
                          この買手を選択
                        </button>
                      </div>
                    ))}
                    {buyerSearchResults.length === 0 && (
                      <p className="text-xs text-slate-500">該当する買手が見つかりませんでした。</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded border border-dashed border-slate-300 p-3">
                  <p className="text-xs font-semibold text-slate-700">パチマート会員ではない取引先の場合はこちら</p>
                  <div className="space-y-2 text-sm">
                    <input
                      type="text"
                      required
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="会社名（必須）"
                      value={manualBuyer.companyName}
                      onChange={(e) => handleManualBuyerInput("companyName", e)}
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="担当者名（任意）"
                      value={manualBuyer.contactName}
                      onChange={(e) => handleManualBuyerInput("contactName", e)}
                    />
                    <input
                      type="tel"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="電話番号（任意）"
                      value={manualBuyer.tel}
                      onChange={(e) => handleManualBuyerInput("tel", e)}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleManualBuyerSave}
                        className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                      >
                        この内容で買手として設定
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">物件情報</h2>
              <span className="text-xs font-semibold text-slate-500">対象機器</span>
            </div>
            {isProductLinked ? (
              <div className="space-y-2 text-sm text-slate-700">
                <InfoRow label="機種名" value={propertyInfo.modelName} emphasis />
                <InfoRow label="メーカー" value={propertyInfo.maker} />
                <InfoRow label="台数" value={`${propertyInfo.quantity} 台`} />
                <InfoRow label="台番号" value={propertyInfo.machineNumber ?? "-"} />
                <InfoRow label="保管場所" value={propertyInfo.storageLocation} />
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-700">
                <p className="text-xs text-slate-500">商品が紐付いていないため、ここで情報を入力してください。</p>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">機種名</label>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.modelName}
                    onChange={(e) => handlePropertyChange("productName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">メーカー</label>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.maker}
                    onChange={(e) => handlePropertyChange("makerName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">台数</label>
                  <input
                    type="number"
                    className="w-32 rounded border border-slate-300 px-3 py-2 text-sm"
                    value={editableProperty.quantity}
                    onChange={(e) => handlePropertyChange("quantity", Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">保管場所</label>
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

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">取引条件</h2>
            <span className="text-xs font-semibold text-slate-500">参考値｜編集</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-200 text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-600">
                      <th className="w-40 px-3 py-2">項目</th>
                      <th className="w-56 px-3 py-2">参考値</th>
                      <th className="px-3 py-2">編集</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <EditRow label="単価 (税抜)" required>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{formattedNumber(referenceConditions.price)}</span>
                      </div>
                      <input
                        type="number"
                        className="w-44 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.price}
                        onChange={(e) => handleNumberConditionChange("price", Number(e.target.value) || 0)}
                      />
                    </EditRow>

                    <EditRow label="台数" required>
                      <span className="text-slate-500">{referenceConditions.quantity} 台</span>
                      <input
                        type="number"
                        className="w-32 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.quantity}
                        onChange={(e) => handleNumberConditionChange("quantity", Number(e.target.value) || 0)}
                      />
                    </EditRow>

                    <EditRow label="撤去日" required>
                      <span className="text-slate-500">{referenceConditions.removalDate}</span>
                      <input
                        type="date"
                        className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.removalDate}
                        onChange={(e) => handleTextConditionChange("removalDate", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="機械発送予定日" required>
                      <span className="text-slate-500">
                        {referenceConditions.machineShipmentDate}（{referenceConditions.machineShipmentType}）
                      </span>
                      <div className="space-y-2">
                        <input
                          type="date"
                          className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
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
                      <span className="text-slate-500">
                        {referenceConditions.documentShipmentDate}（{referenceConditions.documentShipmentType}）
                      </span>
                      <div className="space-y-2">
                        <input
                          type="date"
                          className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
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
                      <span className="text-slate-500">{referenceConditions.paymentDue}</span>
                      <input
                        type="date"
                        className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.paymentDue}
                        onChange={(e) => handleTextConditionChange("paymentDue", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="送料 / 機械運賃">
                      <span className="text-slate-500">{formattedNumber(referenceConditions.freightCost)}</span>
                      <input
                        type="number"
                        className="w-44 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.freightCost}
                        onChange={(e) => handleNumberConditionChange("freightCost", Number(e.target.value) || 0)}
                      />
                    </EditRow>

                    <EditRow label="出庫手数料">
                      <span className="text-slate-500">{formattedNumber(referenceConditions.handlingFee)}</span>
                      <input
                        type="number"
                        className="w-44 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.handlingFee}
                        onChange={(e) => handleNumberConditionChange("handlingFee", Number(e.target.value) || 0)}
                      />
                    </EditRow>

                    <EditRow label="税率">
                      <span className="text-slate-500">{referenceConditions.taxRate}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-32 rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.taxRate}
                        onChange={(e) => handleNumberConditionChange("taxRate", Number(e.target.value) || 0)}
                      />
                    </EditRow>

                    <EditRow label="その他料金1">
                      <span className="text-slate-500">
                        {referenceConditions.otherFee1
                          ? `${referenceConditions.otherFee1.label}: ${formattedNumber(referenceConditions.otherFee1.amount)}`
                          : "-"}
                      </span>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                        <input
                          type="text"
                          className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                          placeholder="種別"
                          value={editedConditions.otherFee1?.label ?? ""}
                          onChange={(e) => handleOtherFeeChange("otherFee1", "label", e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-40 rounded border border-slate-300 px-3 py-2 text-sm"
                          placeholder="金額"
                          value={editedConditions.otherFee1?.amount ?? 0}
                          onChange={(e) => handleOtherFeeChange("otherFee1", "amount", Number(e.target.value) || 0)}
                        />
                      </div>
                    </EditRow>

                    <EditRow label="その他料金2">
                      <span className="text-slate-500">
                        {referenceConditions.otherFee2
                          ? `${referenceConditions.otherFee2.label}: ${formattedNumber(referenceConditions.otherFee2.amount)}`
                          : "-"}
                      </span>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                        <input
                          type="text"
                          className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                          placeholder="種別"
                          value={editedConditions.otherFee2?.label ?? ""}
                          onChange={(e) => handleOtherFeeChange("otherFee2", "label", e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-40 rounded border border-slate-300 px-3 py-2 text-sm"
                          placeholder="金額"
                          value={editedConditions.otherFee2?.amount ?? 0}
                          onChange={(e) => handleOtherFeeChange("otherFee2", "amount", Number(e.target.value) || 0)}
                        />
                      </div>
                    </EditRow>

                    <EditRow label="特記事項">
                      <span className="whitespace-pre-wrap text-slate-500">{referenceConditions.notes}</span>
                      <textarea
                        className="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
                        rows={3}
                        value={editedConditions.notes}
                        onChange={(e) => handleTextConditionChange("notes", e.target.value)}
                      />
                    </EditRow>

                    <EditRow label="取引条件">
                      <span className="whitespace-pre-wrap text-slate-500">{referenceConditions.terms}</span>
                      <textarea
                        className="w-72 rounded border border-slate-300 px-3 py-2 text-sm"
                        rows={5}
                        value={editedConditions.terms}
                        onChange={(e) => handleTextConditionChange("terms", e.target.value)}
                      />
                    </EditRow>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">お支払いサマリー</h3>
                <span className="text-[11px] font-semibold text-slate-500">自動再計算</span>
              </div>
              {quoteResult ? (
                <div className="space-y-2 text-sm text-slate-800">
                  <SummaryRow label="商品代金" value={formattedNumber(quoteResult.productSubtotal)} />
                  <SummaryRow label="送料" value={formattedNumber(quoteResult.shippingFee)} />
                  <SummaryRow label="出庫手数料" value={formattedNumber(quoteResult.handlingFee)} />
                  <div className="h-px bg-slate-200" aria-hidden />
                  <SummaryRow label="小計" value={formattedNumber(quoteResult.subtotal)} />
                  <SummaryRow label="消費税" value={formattedNumber(quoteResult.tax)} />
                  <SummaryRow label="合計" value={formattedNumber(quoteResult.total)} emphasis />
                </div>
              ) : (
                <p className="text-xs text-slate-500">金額を入力すると自動計算されます。</p>
              )}
            </div>
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
    <div className="flex gap-2 text-sm text-slate-700">
      <span className="w-24 text-slate-500">{label}</span>
      <span className={`${emphasis ? "font-semibold" : ""} ${muted ? "text-slate-500" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${emphasis ? "text-sky-700" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
