"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { calculateQuote } from "@/lib/quotes/calculateQuote";
import { deleteNaviDraft, createEmptyNaviDraft, loadNaviDraft } from "@/lib/navi/storage";
import { type TradeConditions, type NaviDraft, type ManualNaviItem } from "@/lib/navi/types";
import {
  formatCurrency,
  useDummyNavi,
  type TransactionConditions,
  type ShippingType,
  type DocumentShippingType,
} from "@/lib/useDummyNavi";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { DEV_USERS, getDevUsers, findDevUserById, type DevUser } from "@/lib/dev-user/users";
import { buildApiUrl } from "@/lib/http/apiBaseUrl";
import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { products } from "@/lib/dummyData";
import type { Listing } from "@/lib/listings/types";

const mapDraftConditions = (
  conditions: TradeConditions,
  fallback: TransactionConditions
): TransactionConditions => ({
  price: conditions.unitPrice === null ? 0 : conditions.unitPrice ?? fallback.price,
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

const emptyPropertyInfo = {
  modelName: "",
  maker: "",
  quantity: 0,
  storageLocation: "",
  machineNumber: "",
  prefecture: "",
  hallName: "",
  salesPrice: 0,
  removalDate: "",
  note: "",
};

const emptyTransactionConditions: TransactionConditions = {
  price: 0,
  quantity: 1,
  removalDate: "",
  machineShipmentDate: "",
  machineShipmentType: "元払",
  documentShipmentDate: "",
  documentShipmentType: "同梱",
  paymentDue: "",
  freightCost: 0,
  handlingFee: 0,
  taxRate: 0.1,
  cardboardFee: { label: "段ボール", amount: 0 },
  nailSheetFee: { label: "釘シート", amount: 0 },
  insuranceFee: { label: "保険", amount: 0 },
  notes: "",
  terms: "",
  memo: "",
  handler: "",
};

type ManualItemFormState = {
  gameType: "pachinko" | "slot";
  bodyType: "本体" | "枠のみ" | "セルのみ";
  maker: string;
  modelName: string;
  frameColor: string;
  quantity: number;
  unitPrice: number;
  receiveMethod: "発送" | "引取" | "その他";
  removalDate: string;
  removalCompleted: boolean;
  note: string;
};

const emptyManualItemForm: ManualItemFormState = {
  gameType: "pachinko",
  bodyType: "本体",
  maker: "",
  modelName: "",
  frameColor: "",
  quantity: 1,
  unitPrice: 0,
  receiveMethod: "発送",
  removalDate: "",
  removalCompleted: false,
  note: "",
};

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
  items?: string;
};

const buyerErrorMessage = "取引先が未設定です。このNaviを送信するには先に取引先を設定してください。";

const validateDraft = (draft: NaviDraft | null): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!draft) {
    errors.buyer = "取引情報を読み込めませんでした。";
    return errors;
  }

  const { buyerPending, buyerCompanyName, buyerId, buyerTel, conditions } = draft;

  const manualItems = draft.items ?? [];

  if (buyerPending || !buyerCompanyName || !buyerId || !buyerTel) {
    errors.buyer = buyerErrorMessage;
  }

  const validateItem = (item: ManualNaviItem) => {
    if (!item.modelName || !item.maker || !item.bodyType || !item.gameType) {
      return false;
    }
    if (!item.quantity || item.quantity <= 0) return false;
    if (!item.unitPrice || item.unitPrice <= 0) return false;
    if (!item.removalCompleted && !item.removalDate) return false;
    return true;
  };

  if (manualItems.length > 0) {
    const invalidItem = manualItems.find((item) => !validateItem(item));
    if (invalidItem) {
      errors.items = "手入力した物件に未入力または不正な項目があります。";
    }
    const invalidQuantity = manualItems.find((item) => !item.quantity || item.quantity <= 0);
    if (invalidQuantity) {
      errors.quantity = "台数が正しく入力されていません。1以上の数を入力してください。";
    }
    const invalidUnitPrice = manualItems.find((item) => !item.unitPrice || item.unitPrice <= 0);
    if (invalidUnitPrice) {
      errors.unitPrice = "単価が正しくありません。";
    }
  } else {
    const quantity = conditions.quantity ?? 0;
    if (!quantity || quantity <= 0) {
      errors.quantity = "台数が正しく入力されていません。1以上の数を入力してください。";
    }

    const unitPrice = conditions.unitPrice ?? 0;
    if (!unitPrice || unitPrice <= 0) {
      errors.unitPrice = "単価が正しくありません。";
    }
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

export function NaviRequestEditor() {
  const searchParams = useSearchParams();
  const safeSearchParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const currentUser = useCurrentDevUser();
  const isInquiryMode = safeSearchParams.get("mode") === "inquiry";

  if (isInquiryMode) {
    return <OnlineInquiryCreator searchParams={safeSearchParams} currentUser={currentUser} />;
  }

  return <StandardNaviRequestEditor searchParams={safeSearchParams} currentUser={currentUser} />;
}

function StandardNaviRequestEditor({
  searchParams,
  currentUser,
}: {
  searchParams: URLSearchParams;
  currentUser: DevUser;
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const safeSearchParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const listingId = safeSearchParams.get("listingId");
  const hasBuyerPrefill =
    Boolean(safeSearchParams.get("buyerId")) || Boolean(safeSearchParams.get("buyerCompanyName"));
  const hasProductPrefill = Boolean(listingId || safeSearchParams.get("productId"));
  const entryMode = listingId ? "fromListing" : hasBuyerPrefill || hasProductPrefill ? "prefilled" : "new";

  const transactionId = Array.isArray(params?.id) ? params?.id[0] : params?.id ?? "dummy-1";
  const [draft, setDraft] = useState<NaviDraft | null>(null);
  const [showManualPropertyForm, setShowManualPropertyForm] = useState(false);
  const [manualItemForm, setManualItemForm] = useState<ManualItemFormState>(emptyManualItemForm);
  const naviTargetId = draft?.productId ?? transactionId;
  const {
    propertyInfo: defaultPropertyInfo,
    currentConditions: defaultCurrentConditions,
    updatedConditions: defaultUpdatedConditions,
  } = useDummyNavi(hasProductPrefill ? naviTargetId : undefined);
  const propertyInfo = entryMode === "new" ? emptyPropertyInfo : defaultPropertyInfo;
  const currentConditions = entryMode === "new" ? emptyTransactionConditions : defaultCurrentConditions;
  const updatedConditions = entryMode === "new" ? emptyTransactionConditions : defaultUpdatedConditions;
  const [linkedListing, setLinkedListing] = useState<Listing | null>(null);
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [isEditingBuyer, setIsEditingBuyer] = useState(false);
  const buyerCandidates = useMemo(
    () => getDevUsers().filter((user) => user.id !== currentUser.id),
    [currentUser.id]
  );
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");

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
  const [isSending, setIsSending] = useState(false);
  const formattedNumber = formatCurrency;
  const isProductLinked = Boolean(draft?.productId);
  const manualItems = draft?.items ?? [];

  useEffect(() => {
    if (!listingId) {
      setLinkedListing(null);
      return;
    }

    let isMounted = true;
    setIsLoadingListing(true);

    fetchWithDevHeader(buildApiUrl(`/api/listings/${listingId}`), {}, currentUser.id)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Listing | null) => {
        if (!isMounted) return;
        setLinkedListing(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setLinkedListing(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingListing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser.id, listingId]);

  useEffect(() => {
    if (!transactionId || draft) return;
    if (listingId && isLoadingListing) return;

    const storedDraft = loadNaviDraft(currentUser.id, transactionId);
    if (storedDraft) {
      setDraft(storedDraft);
      return;
    }

    const parseNumberParam = (value: string | null, fallback?: number) => {
      if (!value) return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const listingUnitPrice = linkedListing ? linkedListing.unitPriceExclTax : undefined;
    const initialUnitPrice =
      listingUnitPrice === null
        ? undefined
        : parseNumberParam(safeSearchParams.get("unitPrice"), listingUnitPrice ?? undefined);

    const shouldAttachProduct = hasProductPrefill;
    const resolvedProductId = safeSearchParams.get("productId") ?? linkedListing?.id ?? null;
    const initialDraft = createEmptyNaviDraft({
      id: transactionId,
      ownerUserId: currentUser.id,
      productId: shouldAttachProduct ? resolvedProductId : null,
      buyerId: safeSearchParams.get("buyerId"),
      buyerCompanyName: safeSearchParams.get("buyerCompanyName"),
      buyerContactName: safeSearchParams.get("buyerContactName"),
      buyerTel: safeSearchParams.get("buyerTel"),
      buyerEmail: safeSearchParams.get("buyerEmail"),
      buyerNote: safeSearchParams.get("buyerNote"),
      buyerPending: safeSearchParams.has("buyerId") ? false : undefined,
      conditions: {
        quantity:
          shouldAttachProduct
            ? parseNumberParam(safeSearchParams.get("quantity"), linkedListing?.quantity ?? 1) ?? 1
            : 1,
        unitPrice: shouldAttachProduct && initialUnitPrice !== undefined ? initialUnitPrice : 0,
        shippingFee: 0,
        handlingFee: 0,
        taxRate: 0.1,
        productName:
          shouldAttachProduct && (safeSearchParams.get("productName") ?? linkedListing?.machineName)
            ? safeSearchParams.get("productName") ?? linkedListing?.machineName ?? undefined
            : undefined,
        makerName:
          shouldAttachProduct && (safeSearchParams.get("makerName") ?? linkedListing?.maker)
            ? safeSearchParams.get("makerName") ?? linkedListing?.maker ?? undefined
            : undefined,
        location:
          shouldAttachProduct && (safeSearchParams.get("location") ?? linkedListing?.storageLocation)
            ? safeSearchParams.get("location") ?? linkedListing?.storageLocation ?? undefined
            : undefined,
      },
    });

    setDraft(initialDraft);
  }, [
    currentUser.id,
    draft,
    entryMode,
    hasProductPrefill,
    isLoadingListing,
    linkedListing,
    listingId,
    safeSearchParams,
    transactionId,
  ]);

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

  useEffect(() => {
    const buyerId = draft?.buyerId;
    if (buyerId) {
      setSelectedBuyerId(buyerId);
      setIsEditingBuyer(false);
      return;
    }

    if (!buyerId && buyerCandidates.length > 0) {
      setSelectedBuyerId(buyerCandidates[0].id);
    }
  }, [buyerCandidates, draft?.buyerId]);

  useEffect(() => {
    if (isProductLinked) {
      setShowManualPropertyForm(false);
      return;
    }

    if (manualItems.length > 0) {
      setShowManualPropertyForm(false);
      return;
    }

    const hasManualInputs = Boolean(
      draft?.conditions.productName || draft?.conditions.makerName || draft?.conditions.location
    );
    setShowManualPropertyForm(hasManualInputs);
  }, [
    draft?.conditions.location,
    draft?.conditions.makerName,
    draft?.conditions.productName,
    isProductLinked,
    manualItems.length,
  ]);

  const persistDraft = (updater: (prev: NaviDraft) => NaviDraft) => {
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
    setSelectedBuyerId(buyer.id);
    setIsEditingBuyer(false);
    setValidationErrors((prev) => ({ ...prev, buyer: undefined }));
  };

  const handleBuyerSelectionConfirm = () => {
    if (!selectedBuyerId) {
      setValidationErrors((prev) => ({ ...prev, buyer: buyerErrorMessage }));
      return;
    }

    const buyer = buyerCandidates.find((candidate) => candidate.id === selectedBuyerId);
    if (!buyer) {
      setValidationErrors((prev) => ({ ...prev, buyer: buyerErrorMessage }));
      return;
    }

    handleBuyerSelect({
      id: buyer.id,
      name: buyer.companyName,
      contactName: buyer.contactName,
      tel: buyer.tel,
      address: buyer.address,
    });
  };

  const handleResetBuyerSelection = () => {
    setIsEditingBuyer(true);
    const defaultCandidate = buyerCandidates[0];
    if (defaultCandidate) {
      setSelectedBuyerId(defaultCandidate.id);
    }
    persistDraft((prev) => ({
      ...prev,
      buyerId: null,
      buyerCompanyName: null,
      buyerContactName: null,
      buyerAddress: null,
      buyerTel: null,
      buyerEmail: null,
      buyerPending: true,
    }));
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

  const handleSendToBuyer = async () => {
    const errors = validateDraft(draft);
    setValidationErrors(errors);
    const hasErrors = Object.values(errors).some((error) => Boolean(error));

    if (hasErrors || !draft) return;

    const now = new Date().toISOString();
    const updatedDraft: NaviDraft = {
      ...draft,
      status: "sent_to_buyer",
      buyerPending: false,
      ownerUserId: currentUser.id,
      createdAt: draft.createdAt ?? now,
      updatedAt: now,
    };

    setIsSending(true);

    try {
      const response = await fetchWithDevHeader(
        "/api/trades",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerUserId: currentUser.id,
            buyerUserId: updatedDraft.buyerId ?? undefined,
            listingId: listingId ?? linkedListing?.id ?? undefined,
            status: "SENT",
            payload: updatedDraft,
          }),
        },
        currentUser.id
      );

      if (!response.ok) {
        const detail = await response.text();
        console.error("Failed to send trade navi", detail);
        alert("送信に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      deleteNaviDraft(currentUser.id, updatedDraft.id);
      setDraft(updatedDraft);
      alert("取引Naviを取引先へ送信しました。");
      router.push("/navi");
    } catch (error) {
      console.error("Failed to send trade navi", error);
      alert("送信中にエラーが発生しました。再度お試しください。");
    } finally {
      setIsSending(false);
    }
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
  const referenceConditions = draftConditions ?? currentConditions;
  const displayBuyer = {
    companyName: draft?.buyerCompanyName ?? null,
    contactPerson: draft?.buyerContactName ?? null,
    address: draft?.buyerAddress ?? null,
    phoneNumber: draft?.buyerTel ?? null,
    email: draft?.buyerEmail ?? null,
    notes: draft?.buyerNote ?? null,
  };
  const shouldShowBuyerSelector = !isBuyerSet || isEditingBuyer;

  const displayPropertyInfo = useMemo(() => {
    if (!linkedListing) return propertyInfo;

    return {
      ...propertyInfo,
      modelName: linkedListing.machineName ?? propertyInfo.modelName,
      maker: linkedListing.maker ?? propertyInfo.maker,
      quantity: linkedListing.quantity,
      storageLocation: linkedListing.storageLocation,
      salesPrice: linkedListing.unitPriceExclTax ?? propertyInfo.salesPrice,
      note: linkedListing.note ?? propertyInfo.note,
    };
  }, [linkedListing, propertyInfo]);

  const propertyPrevLocation = useMemo(() => {
    const locationParts = [displayPropertyInfo.prefecture, displayPropertyInfo.hallName].filter(Boolean);
    if (locationParts.length) return locationParts.join(" ");
    return displayPropertyInfo.storageLocation;
  }, [displayPropertyInfo.hallName, displayPropertyInfo.prefecture, displayPropertyInfo.storageLocation]);

  const propertySalesPriceLabel = linkedListing
    ? linkedListing.unitPriceExclTax !== null
      ? formattedNumber(linkedListing.unitPriceExclTax)
      : "応相談"
    : formattedNumber(displayPropertyInfo.salesPrice);
  const propertyRemovalDateLabel = displayPropertyInfo.removalDate
    ? displayPropertyInfo.removalDate.replace(/-/g, "/")
    : "-";
  const propertyNote = displayPropertyInfo.note ?? "-";

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

  const handleManualItemChange = <K extends keyof ManualItemFormState>(key: K, value: ManualItemFormState[K]) => {
    setManualItemForm((prev) => ({ ...prev, [key]: value }));
  };

  const isManualFormValid = useMemo(() => {
    if (!manualItemForm.modelName.trim()) return false;
    if (!manualItemForm.maker.trim()) return false;
    if (!manualItemForm.bodyType) return false;
    if (!manualItemForm.gameType) return false;
    if (!manualItemForm.quantity || manualItemForm.quantity <= 0) return false;
    if (!manualItemForm.unitPrice || manualItemForm.unitPrice <= 0) return false;
    if (!manualItemForm.removalCompleted && !manualItemForm.removalDate) return false;
    return true;
  }, [manualItemForm]);

  const resetManualForm = () => {
    setManualItemForm(emptyManualItemForm);
  };

  const handleManualItemAdd = () => {
    if (!draft || !isManualFormValid) return;

    const newItem: ManualNaviItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `manual-${Date.now()}`,
      gameType: manualItemForm.gameType,
      bodyType: manualItemForm.bodyType,
      maker: manualItemForm.maker.trim(),
      modelName: manualItemForm.modelName.trim(),
      frameColor: manualItemForm.frameColor.trim() ? manualItemForm.frameColor.trim() : null,
      quantity: manualItemForm.quantity,
      unitPrice: manualItemForm.unitPrice,
      receiveMethod: manualItemForm.receiveMethod,
      removalDate: manualItemForm.removalCompleted ? null : manualItemForm.removalDate,
      removalCompleted: manualItemForm.removalCompleted,
      note: manualItemForm.note.trim() ? manualItemForm.note.trim() : null,
    };

    persistDraft((prev) => ({
      ...prev,
      items: [...(prev.items ?? []), newItem],
      conditions: {
        ...prev.conditions,
        productName: newItem.modelName,
        makerName: newItem.maker,
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        removalDate: newItem.removalCompleted ? null : newItem.removalDate,
        memo: newItem.note ?? prev.conditions.memo ?? null,
      },
    }));

    setEditedConditions((prev) => ({
      ...prev,
      quantity: newItem.quantity,
      price: newItem.unitPrice,
      removalDate: newItem.removalCompleted ? "" : newItem.removalDate ?? "",
    }));

    setShowManualPropertyForm(false);
    resetManualForm();
    setValidationErrors((prev) => ({ ...prev, items: undefined, quantity: undefined, unitPrice: undefined }));
  };

  return (
    <div className="flex flex-col gap-8 pb-8">
      <section className="flex flex-col gap-4 border-b border-slate-300 pb-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            {/* 大見出しをカード見出しより一段階大きく */}
            <h1 className="text-xl font-bold text-slate-900">ナビ作成</h1>
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
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {/* カード見出しを標準文字サイズより一段階大きく */}
                <h2 className="text-base font-semibold text-slate-900">
                  {isBuyerSet ? "取引先情報" : "取引先（買手）を選択してください"}
                </h2>
                <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
                {isBuyerSet && !shouldShowBuyerSelector && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-neutral-800">設定済み</span>
                )}
              </div>
              {isBuyerSet && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-700">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">買手</span>
                  <span className="text-sm text-neutral-900">{displayBuyer.companyName ?? "未設定"}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">売手</span>
                  <span className="text-sm text-neutral-900">自社（{currentUser.companyName}）</span>
                </div>
              )}
            </div>

            <div className="w-full md:max-w-[420px]">
              {shouldShowBuyerSelector ? (
                <div className="space-y-2 text-sm">
                  <label className="block text-xs font-semibold text-neutral-800">取引先（買手）を選択してください</label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={selectedBuyerId}
                    onChange={(e) => setSelectedBuyerId(e.target.value)}
                  >
                    {buyerCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.companyName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-600">
                    取引先として選んだ会社に依頼が送信され、買手側の「届いた依頼」に表示されます。
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-[#142B5E] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f2248]"
                      onClick={handleBuyerSelectionConfirm}
                    >
                      この買手に送信する
                    </button>
                    {isBuyerSet && (
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-slate-50"
                        onClick={() => setIsEditingBuyer(false)}
                      >
                        キャンセル
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                    onClick={handleResetBuyerSelection}
                  >
                    取引先情報を変更
                  </button>
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
                <BuyerInfoItem label="会社名" value={displayBuyer.companyName ?? "-"} emphasis />
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
            {!isProductLinked && manualItems.length > 0 && (
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-slate-50"
                onClick={() => setShowManualPropertyForm((prev) => !prev)}
              >
                {showManualPropertyForm ? "入力を閉じる" : "手入力で追加"}
              </button>
            )}
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
                    <td className="whitespace-nowrap px-4 py-2">{displayPropertyInfo.maker}</td>
                    <td className="whitespace-nowrap px-4 py-2">{displayPropertyInfo.modelName}</td>
                    <td className="whitespace-nowrap px-4 py-2">{displayPropertyInfo.quantity}台</td>
                    <td className="whitespace-nowrap px-4 py-2">{propertySalesPriceLabel}</td>
                    <td className="whitespace-nowrap px-4 py-2">{propertyRemovalDateLabel}</td>
                    <td className="px-4 py-2">{propertyNote}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : manualItems.length > 0 ? (
            <div className="space-y-4 p-4 text-sm text-neutral-900">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-neutral-600">
                      <th className="px-4 py-2 text-left font-semibold">遊技種別</th>
                      <th className="px-4 py-2 text-left font-semibold">種別</th>
                      <th className="px-4 py-2 text-left font-semibold">メーカー</th>
                      <th className="px-4 py-2 text-left font-semibold">機種名</th>
                      <th className="px-4 py-2 text-left font-semibold">台数</th>
                      <th className="px-4 py-2 text-left font-semibold">売却価格</th>
                      <th className="px-4 py-2 text-left font-semibold">撤去日</th>
                      <th className="px-4 py-2 text-left font-semibold">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualItems.map((item) => (
                      <tr key={item.id} className="border-t border-slate-300 text-slate-900">
                        <td className="whitespace-nowrap px-4 py-2">{item.gameType === "pachinko" ? "パチンコ" : "スロット"}</td>
                        <td className="whitespace-nowrap px-4 py-2">{item.bodyType}</td>
                        <td className="whitespace-nowrap px-4 py-2">{item.maker}</td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {item.modelName}
                          {item.frameColor ? `（${item.frameColor}）` : ""}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">{item.quantity}台</td>
                        <td className="whitespace-nowrap px-4 py-2">{formattedNumber(item.unitPrice)}</td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {item.removalCompleted ? "撤去済" : item.removalDate ? item.removalDate.replace(/-/g, "/") : "-"}
                        </td>
                        <td className="px-4 py-2">{item.note ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!showManualPropertyForm && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    onClick={() => setShowManualPropertyForm(true)}
                  >
                    手入力で追加
                  </button>
                </div>
              )}

              {showManualPropertyForm && (
                <ManualItemForm
                  manualItemForm={manualItemForm}
                  onChange={handleManualItemChange}
                  onCancel={() => {
                    setShowManualPropertyForm(false);
                    resetManualForm();
                  }}
                  onSubmit={handleManualItemAdd}
                  isValid={isManualFormValid}
                />
              )}
            </div>
          ) : showManualPropertyForm ? (
            <div className="space-y-4 p-4 text-sm text-neutral-900">
              <ManualItemForm
                manualItemForm={manualItemForm}
                onChange={handleManualItemChange}
                onCancel={() => {
                  setShowManualPropertyForm(false);
                  resetManualForm();
                }}
                onSubmit={handleManualItemAdd}
                isValid={isManualFormValid}
              />
            </div>
          ) : (
            <div className="space-y-3 p-6 text-sm text-neutral-900">
              <p className="text-base font-semibold text-neutral-900">物件が未選択です。</p>
              <p className="text-sm text-neutral-700">
                出品から選ぶか、手入力で追加してください。
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-slate-50"
                  onClick={() => router.push("/inventory")}
                >
                  出品から選ぶ
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={() => setShowManualPropertyForm(true)}
                >
                  手入力で追加
                </button>
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
                    <th className="w-40 px-3 py-1.5">項目</th>
                    <th className="px-3 py-1.5">編集</th>
                  </tr>
                </thead>
                <tbody className="text-slate-900">
                  <EditRow label="単価" required>
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
                    <input
                      type="date"
                      className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                      value={editedConditions.removalDate}
                      onChange={(e) => handleTextConditionChange("removalDate", e.target.value)}
                    />
                  </EditRow>

                  <EditRow label="機械発送日" required>
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
                    <input
                      type="date"
                      className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                      value={editedConditions.paymentDue}
                      onChange={(e) => handleTextConditionChange("paymentDue", e.target.value)}
                    />
                  </EditRow>

                  <EditRow label="機械運賃">
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
                    <textarea
                      className="w-full max-w-2xl rounded border border-slate-300 px-2 py-1 text-sm"
                      rows={2}
                      value={editedConditions.notes}
                      onChange={(e) => handleTextConditionChange("notes", e.target.value)}
                    />
                  </EditRow>

                  <EditRow label="取引条件">
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

                  <EditRow label="備考">
                    <textarea
                      className="h-20 w-full resize-vertical rounded border border-slate-300 px-2 py-1 text-sm"
                        placeholder="備考など自由入力"
                      value={editedConditions.memo ?? ""}
                      onChange={(e) => handleTextConditionChange("memo", e.target.value)}
                    />
                  </EditRow>

                  <EditRow label="担当者">
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
          disabled={draft?.buyerPending || !isBuyerSet || isSending}
          className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSending ? "送信しています..." : "内容を確定して取引先に送信する"}
        </button>
      </div>
    </div>
  );
}

function OnlineInquiryCreator({
  searchParams,
  currentUser,
}: {
  searchParams: URLSearchParams;
  currentUser: DevUser;
}) {
  const router = useRouter();
  const productId = searchParams.get("productId");
  const listingId = searchParams.get("listingId");
  const [linkedListing, setLinkedListing] = useState<Listing | null>(null);

  const product = useMemo(
    () => products.find((item) => String(item.id) === String(productId)),
    [productId]
  );

  useEffect(() => {
    if (!listingId) {
      setLinkedListing(null);
      return;
    }

    let isMounted = true;

    fetchWithDevHeader(buildApiUrl(`/api/listings/${listingId}`), {}, currentUser.id)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Listing | null) => {
        if (!isMounted) return;
        setLinkedListing(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setLinkedListing(null);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser.id, listingId]);

  const parseNumberParam = (value: string | null, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const makerName = searchParams.get("makerName") ?? linkedListing?.maker ?? product?.maker ?? "";
  const productName = searchParams.get("productName") ?? linkedListing?.machineName ?? product?.name ?? "";
  const quantity = parseNumberParam(
    searchParams.get("quantity"),
    linkedListing?.quantity ?? product?.quantity ?? 1
  );
  const unitPrice = parseNumberParam(
    searchParams.get("unitPrice"),
    linkedListing?.unitPriceExclTax ?? product?.price ?? 0
  );

  const devUsers = useMemo(() => getDevUsers(), []);
  const sellerUserId =
    linkedListing?.sellerUserId ??
    product?.ownerUserId ??
    devUsers.find((user) => user.id !== currentUser.id)?.id ??
    currentUser.id;
  const seller = findDevUserById(sellerUserId) ?? devUsers.find((user) => user.id !== currentUser.id) ?? currentUser;

  const [shippingAddress, setShippingAddress] = useState(currentUser.address);
  const [contactPerson, setContactPerson] = useState(currentUser.contactName);
  const [desiredShipDate, setDesiredShipDate] = useState("");
  const [desiredPaymentDate, setDesiredPaymentDate] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formattedNumber = formatCurrency;

  const totalAmount = unitPrice * quantity;

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!shippingAddress.trim()) missing.push("発送先住所を入力してください。");
    if (!contactPerson.trim()) missing.push("担当者を入力してください。");
    if (!desiredShipDate) missing.push("発送指定日を入力してください。");
    if (!desiredPaymentDate) missing.push("支払日を入力してください。");

    setErrors(missing);
    if (missing.length > 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetchWithDevHeader(
        "/api/online-inquiries",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listingId ?? productId ?? "",
            quantity,
            buyerUserId: currentUser.id,
            buyerMemo: memo,
            shippingAddress,
            contactPerson,
            desiredShipDate,
            desiredPaymentDate,
          }),
        },
        currentUser.id
      );

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        const reason = detail?.error ?? "送信に失敗しました。時間をおいて再度お試しください。";
        alert(reason);
        return;
      }

      alert("オンライン問い合わせを送信しました。");
      router.push("/navi?tab=inProgress");
    } catch (error) {
      console.error("Failed to send online inquiry", error);
      alert("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-2 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold text-slate-900">オンライン問い合わせ作成</h1>
        <p className="text-sm text-neutral-700">ナビ作成と同じ構成で、売手へ問い合わせを送信します。</p>
        {errors.length > 0 && (
          <ul className="list-disc space-y-1 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-2">
              <h2 className="text-base font-semibold text-slate-900">取引先情報</h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-700">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">買手</span>
                <span className="text-sm text-neutral-900">自社（{currentUser.companyName}）</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">売手</span>
                <span className="text-sm text-neutral-900">{seller.companyName}</span>
              </div>
            </div>
            <div className="space-y-3 px-4 py-3 text-sm text-neutral-900">
              <div className="grid gap-3 md:grid-cols-2">
                <BuyerInfoItem label="メーカー" value={makerName || "-"} emphasis />
                <BuyerInfoItem label="機種名" value={productName || "-"} />
                <BuyerInfoItem label="台数" value={`${quantity}台`} />
                <BuyerInfoItem label="単価" value={formattedNumber(unitPrice)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">発送先住所</label>
                <textarea
                  className="min-h-[72px] w-full rounded border border-slate-300 px-3 py-2"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="例：東京都〇〇市1-2-3"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-800">担当者</label>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="氏名を入力"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-800">支払予定日</label>
                  <input
                    type="date"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={desiredPaymentDate}
                    onChange={(e) => setDesiredPaymentDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
              <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
              <span className="text-xs font-semibold text-neutral-700">問い合わせ対象</span>
            </div>
            <div className="grid gap-3 px-4 py-3 text-sm text-neutral-900 md:grid-cols-2">
              <BuyerInfoItem label="合計金額" value={formattedNumber(totalAmount)} />
              {product?.warehouseName && <BuyerInfoItem label="倉庫" value={product.warehouseName} />}
              <BuyerInfoItem label="発送指定日" value={desiredShipDate ? desiredShipDate : "未入力"} />
              <BuyerInfoItem label="問い合わせ先" value={seller.companyName} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
              <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
              <span className="text-xs font-semibold text-neutral-600">ナビ作成の順序に準拠</span>
            </div>
            <div className="overflow-x-auto px-2 py-3">
              <table className="min-w-full border border-slate-300 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-neutral-700">
                    <th className="w-40 px-3 py-1.5">項目</th>
                    <th className="px-3 py-1.5">内容</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-900">
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">単価</th>
                    <td className="px-3 py-2">{formattedNumber(unitPrice)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">台数</th>
                    <td className="px-3 py-2">{quantity}台</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">撤去日</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械発送日</th>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        value={desiredShipDate}
                        onChange={(e) => setDesiredShipDate(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">書類発送予定日</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">支払日</th>
                    <td className="px-3 py-2">{desiredPaymentDate || "未入力"}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械運賃</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">出庫手数料</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">段ボール</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">釘シート</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">保険</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">特記事項</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">取引条件（テキスト）</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">備考</th>
                    <td className="px-3 py-2">
                      <textarea
                        className="min-h-[72px] w-full rounded border border-slate-300 px-3 py-2"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="問い合わせ内容を入力"
                      />
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">担当者</th>
                    <td className="px-3 py-2">{contactPerson || "未入力"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-neutral-800">
            <p className="font-semibold text-slate-900">金額内訳</p>
            <p className="mt-1 text-neutral-700">問い合わせでは金額内訳は表示のみです。ナビ確定後に自動計算されます。</p>
            <p className="mt-2 font-semibold text-slate-900">合計（目安）：{formattedNumber(totalAmount)}</p>
          </section>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "送信中..." : "売手に問い合わせを送信する"}
        </button>
      </div>
    </div>
  );
}

function EditRow({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <tr className="border-t border-slate-300">
      <th className="w-40 bg-slate-50 px-3 py-1.5 text-left text-xs font-semibold text-neutral-900 align-top">
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {required && (
            <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
          )}
        </div>
      </th>
      <td className="px-3 py-2 align-top">{children}</td>
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

function ManualItemForm({
  manualItemForm,
  onChange,
  onCancel,
  onSubmit,
  isValid,
}: {
  manualItemForm: ManualItemFormState;
  onChange: <K extends keyof ManualItemFormState>(key: K, value: ManualItemFormState[K]) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isValid: boolean;
}) {
  return (
    <div className="space-y-4 rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">基本情報</h3>
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
        </div>
        <p className="text-xs text-neutral-600">新規出品フォームの項目に合わせて入力してください。</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-800">遊技種別</label>
          <div className="flex flex-wrap gap-3 text-sm text-neutral-900">
            {["pachinko", "slot"].map((type) => (
              <label key={type} className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="gameType"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  checked={manualItemForm.gameType === type}
                  onChange={() => onChange("gameType", type as ManualItemFormState["gameType"])}
                />
                <span>{type === "pachinko" ? "パチンコ" : "スロット"}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-800">種別</label>
          <div className="flex flex-wrap gap-3 text-sm text-neutral-900">
            {["本体", "枠のみ", "セルのみ"].map((type) => (
              <label key={type} className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="bodyType"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  checked={manualItemForm.bodyType === type}
                  onChange={() => onChange("bodyType", type as ManualItemFormState["bodyType"])}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-800">メーカー</label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={manualItemForm.maker}
            onChange={(e) => onChange("maker", e.target.value)}
            placeholder="メーカー名"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-800">機種名</label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={manualItemForm.modelName}
            onChange={(e) => onChange("modelName", e.target.value)}
            placeholder="機種名を入力"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-800">枠色（任意）</label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={manualItemForm.frameColor}
            onChange={(e) => onChange("frameColor", e.target.value)}
            placeholder="例：赤枠"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-800">台数</label>
          <input
            type="number"
            min={1}
            className="w-32 rounded border border-slate-300 px-3 py-2 text-sm"
            value={manualItemForm.quantity}
            onChange={(e) => onChange("quantity", Number(e.target.value) || 0)}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-200 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">取引条件（ナビ用）</h3>
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-800">販売単価（税抜）</label>
            <input
              type="number"
              min={1}
              className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
              value={manualItemForm.unitPrice}
              onChange={(e) => onChange("unitPrice", Number(e.target.value) || 0)}
              placeholder="例：120000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-800">受渡方法</label>
            <div className="flex flex-wrap gap-3 text-sm text-neutral-900">
              {["発送", "引取"].map((method) => (
                <label key={method} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="receiveMethod"
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                    checked={manualItemForm.receiveMethod === method}
                    onChange={() => onChange("receiveMethod", method as ManualItemFormState["receiveMethod"])}
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-800">撤去日</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="w-40 rounded border border-slate-300 px-3 py-2 text-sm"
                value={manualItemForm.removalDate}
                onChange={(e) => onChange("removalDate", e.target.value)}
                disabled={manualItemForm.removalCompleted}
              />
              <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  checked={manualItemForm.removalCompleted}
                  onChange={(e) => {
                    onChange("removalCompleted", e.target.checked);
                    if (e.target.checked) {
                      onChange("removalDate", "");
                    }
                  }}
                />
                <span>撤去済</span>
              </label>
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-neutral-800">備考（任意）</label>
            <textarea
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={manualItemForm.note}
              onChange={(e) => onChange("note", e.target.value)}
              placeholder="搬入条件や注意事項など"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={onSubmit}
          disabled={!isValid}
        >
          追加
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-slate-50"
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
