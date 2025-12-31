"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ListingType } from "@prisma/client";
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
import { loadMasterData, type Warehouse } from "@/lib/demo-data/demoMasterData";
import type { Listing } from "@/lib/listings/types";

const mapDraftConditions = (
  conditions: TradeConditions,
  fallback: TransactionConditions
): TransactionConditions => ({
  makerId: conditions.makerId ?? fallback.makerId,
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
  machineModelId: conditions.machineModelId ?? fallback.machineModelId,
});

const mapTransactionToTradeConditions = (
  conditions: TransactionConditions,
  prev: TradeConditions
): TradeConditions => ({
  ...prev,
  makerId: conditions.makerId,
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
  machineModelId: conditions.machineModelId,
});

const presetTerms = [
  "通常取引における標準条件です。納品後7日以内の初期不良のみ対応いたします。",
  "長期取引向けの条件です。支払いサイトは月末締め翌月末払い、遅延が生じた場合は別途協議します。",
  "機材に関する追加保証なし。運送事故に関しては保険適用範囲での実費精算となります。",
];


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
  makerId: null,
  cardboardFee: { label: "段ボール", amount: 0 },
  nailSheetFee: { label: "釘シート", amount: 0 },
  insuranceFee: { label: "保険", amount: 0 },
  notes: "",
  terms: "",
  memo: "",
  handler: "",
  machineModelId: null,
};

type ManualItemFormState = {
  gameType: "pachinko" | "slot";
  bodyType: "本体" | "枠のみ" | "セルのみ";
  makerId: string;
  makerName: string;
  modelId: string;
  modelName: string;
  frameColor: string;
};

const emptyManualItemForm: ManualItemFormState = {
  gameType: "pachinko",
  bodyType: "本体",
  makerId: "",
  makerName: "",
  modelId: "",
  modelName: "",
  frameColor: "",
};

const mapGameTypeToListingType = (gameType: ManualItemFormState["gameType"]): ListingType =>
  gameType === "slot" ? ListingType.SLOT : ListingType.PACHINKO;

const mapListingTypeToGameType = (
  type?: string | null
): ManualItemFormState["gameType"] | undefined => {
  const normalized = type?.toString().toLowerCase();
  if (normalized === "slot" || normalized === "s") return "slot";
  if (normalized === "pachinko" || normalized === "p") return "pachinko";
  return undefined;
};

const mapListingKindToBodyType = (
  kind?: string | null
): ManualItemFormState["bodyType"] | undefined => {
  if (kind === "本体" || kind === "枠のみ" || kind === "セルのみ") return kind;
  return undefined;
};

const additionalFeeLabels = {
  cardboardFee: "段ボール",
  nailSheetFee: "釘シート",
  insuranceFee: "保険",
} as const;

type MakerOption = {
  id: string;
  name: string;
};

type MachineModelOption = {
  id: string;
  makerId: string;
  type: ListingType;
  name: string;
};

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

  const manualItem = draft.items?.[0];

  if (buyerPending || !buyerCompanyName || !buyerId || !buyerTel) {
    errors.buyer = buyerErrorMessage;
  }

  const validateItem = (item: ManualNaviItem) => {
    if (!item.modelName?.trim() || !item.maker?.trim() || !item.bodyType || !item.gameType) {
      return false;
    }
    return true;
  };

  if (!manualItem || !validateItem(manualItem)) {
    errors.items = "物件情報に未入力または不正な項目があります。";
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
  const pickListingId = safeSearchParams.get("pickListingId");
  const listingSourceId = listingId ?? pickListingId ?? undefined;
  const hasBuyerPrefill =
    Boolean(safeSearchParams.get("buyerId")) || Boolean(safeSearchParams.get("buyerCompanyName"));
  const hasProductPrefill = Boolean(listingSourceId || safeSearchParams.get("productId"));
  const entryMode = listingSourceId ? "fromListing" : hasBuyerPrefill || hasProductPrefill ? "prefilled" : "new";

  const transactionId = Array.isArray(params?.id) ? params?.id[0] : params?.id ?? "dummy-1";
  const [draft, setDraft] = useState<NaviDraft | null>(null);
  const [manualItemForm, setManualItemForm] = useState<ManualItemFormState>(emptyManualItemForm);
  const naviTargetId = draft?.productId ?? transactionId;
  const [makers, setMakers] = useState<MakerOption[]>([]);
  const [machineModels, setMachineModels] = useState<MachineModelOption[]>([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
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
  const [isSending, setIsSending] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const formattedNumber = formatCurrency;
  const isProductLinked = Boolean(draft?.productId);
  const manualItem = draft?.items?.[0];
  const [appliedPickListingId, setAppliedPickListingId] = useState<string | null>(null);

  useEffect(() => {
    if (!listingSourceId) {
      setLinkedListing(null);
      setIsLoadingListing(false);
      return;
    }

    let isMounted = true;
    setIsLoadingListing(true);

    fetchWithDevHeader(buildApiUrl(`/api/listings/${listingSourceId}`), {}, currentUser.id)
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
  }, [currentUser.id, listingSourceId]);

  useEffect(() => {
    if (!pickListingId) {
      setAppliedPickListingId(null);
    }
  }, [pickListingId]);

  useEffect(() => {
    let isActive = true;
    const listingType = mapGameTypeToListingType(manualItemForm.gameType);

    const fetchMasters = async () => {
      setIsLoadingMasters(true);
      try {
        const response = await fetch(`/api/machine-masters?type=${listingType}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch master data: ${response.status}`);
        }
        const data = (await response.json()) as { makers: MakerOption[]; machineModels: MachineModelOption[] };
        if (!isActive) return;
        setMakers(data.makers);
        setMachineModels(data.machineModels);
        setMasterError(null);
      } catch (error) {
        console.error("Failed to fetch machine masters", error);
        if (!isActive) return;
        setMasterError("メーカー・機種マスタの取得に失敗しました。");
      } finally {
        if (isActive) {
          setIsLoadingMasters(false);
        }
      }
    };

    fetchMasters();

    return () => {
      isActive = false;
    };
  }, [manualItemForm.gameType]);

  useEffect(() => {
    if (!transactionId || draft) return;
    if (listingSourceId && isLoadingListing) return;

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
    listingSourceId,
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

  const persistDraft = useCallback((updater: (prev: NaviDraft) => NaviDraft) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextDraft = updater(prev);
      return nextDraft;
    });
  }, []);

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

  const showMachineShipmentError = submitAttempted && !editedConditions.machineShipmentDate;
  const showDocumentShipmentError = submitAttempted && !editedConditions.documentShipmentDate;
  const showPaymentDueError = submitAttempted && !editedConditions.paymentDue;

  const handleSendToBuyer = async () => {
    setSubmitAttempted(true);
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
    onChange: (next: T) => void,
    getLabel?: (option: T) => string
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
            <span>{getLabel ? getLabel(option) : option}</span>
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
  const buyerDetailsPlaceholder = "未入力（買手が承認時に入力）";
  const shouldMaskBuyerDetails = !draft?.status;
  const buyerContactDisplay =
    !shouldMaskBuyerDetails && displayBuyer.contactPerson ? displayBuyer.contactPerson : buyerDetailsPlaceholder;
  const buyerAddressDisplay =
    !shouldMaskBuyerDetails && displayBuyer.address ? displayBuyer.address : buyerDetailsPlaceholder;
  const buyerCompanyDisplay = displayBuyer.companyName ?? "未設定";
  const sellerContactDisplay = currentUser.contactName || "-";
  const shouldShowBuyerSelector = !isBuyerSet || isEditingBuyer;
  const gameTypeLabelMap: Record<ManualItemFormState["gameType"], string> = {
    pachinko: "パチンコ",
    slot: "スロット",
  };
  const formatGameTypeLabel = (value?: string | null) => {
    if (!value) return "-";
    return (gameTypeLabelMap as Record<string, string | undefined>)[value] ?? value;
  };

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

  const filteredModels = useMemo(
    () => machineModels.filter((model) => model.makerId === manualItemForm.makerId),
    [machineModels, manualItemForm.makerId]
  );

  const generateManualItemId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `manual-${Date.now()}`;

  const persistManualItem = useCallback(
    (nextForm: ManualItemFormState) => {
      persistDraft((prev) => {
        if (!prev) return prev;
        const resolvedQuantity = prev.conditions.quantity ?? editedConditions.quantity ?? 1;
        const nextItem: ManualNaviItem = {
          id: prev.items?.[0]?.id ?? generateManualItemId(),
          gameType: nextForm.gameType,
          bodyType: nextForm.bodyType,
          makerId: nextForm.makerId || null,
          maker: nextForm.makerName,
          modelId: nextForm.modelId || null,
          modelName: nextForm.modelName,
          frameColor: nextForm.frameColor?.trim() ? nextForm.frameColor : null,
          quantity: resolvedQuantity,
        };

        return {
          ...prev,
          items: [nextItem],
          conditions: {
            ...prev.conditions,
            productName: nextItem.modelName,
            makerName: nextItem.maker,
            makerId: nextItem.makerId ?? null,
            machineModelId: nextItem.modelId ?? null,
            quantity: resolvedQuantity,
          },
        };
      });
      setValidationErrors((prev) => ({ ...prev, items: undefined, quantity: undefined, unitPrice: undefined }));
    },
    [editedConditions.quantity, persistDraft]
  );

  useEffect(() => {
    if (makers.length === 0) return;

    setManualItemForm((prev) => {
      const resolvedMaker =
        (prev.makerId && makers.find((maker) => maker.id === prev.makerId)) ||
        (prev.makerName && makers.find((maker) => maker.name === prev.makerName)) ||
        makers[0];
      const makerId = resolvedMaker?.id ?? "";
      const makerName = resolvedMaker?.name ?? prev.makerName ?? "";

      const availableModels = machineModels.filter((model) => model.makerId === makerId);
      const resolvedModel =
        (prev.modelId && availableModels.find((model) => model.id === prev.modelId)) ||
        (prev.modelName && availableModels.find((model) => model.name === prev.modelName)) ||
        availableModels[0];

      const modelId = resolvedModel?.id ?? (makerId ? "" : prev.modelId);
      const modelName = resolvedModel?.name ?? (makerId ? prev.modelName : "");

      if (
        makerId === prev.makerId &&
        makerName === prev.makerName &&
        modelId === prev.modelId &&
        modelName === prev.modelName
      ) {
        return prev;
      }

      const nextForm = { ...prev, makerId, makerName, modelId, modelName };
      persistManualItem(nextForm);
      return nextForm;
    });
  }, [machineModels, makers, persistManualItem]);

  useEffect(() => {
    if (!draft?.items?.[0]) return;

    const itemQuantity = draft.items[0].quantity;
    const conditionQuantity = draft.conditions.quantity;
    const resolvedQuantity = conditionQuantity ?? itemQuantity ?? 1;

    if (itemQuantity === resolvedQuantity && conditionQuantity === resolvedQuantity) return;

    persistDraft((prev) => {
      if (!prev?.items?.[0]) return prev;
      const nextQuantity = prev.conditions.quantity ?? prev.items[0].quantity ?? 1;
      const updatedItem = { ...prev.items[0], quantity: nextQuantity };
      return {
        ...prev,
        items: [updatedItem, ...prev.items.slice(1)],
        conditions: { ...prev.conditions, quantity: nextQuantity },
      };
    });
    setEditedConditions((prev) => ({ ...prev, quantity: resolvedQuantity }));
  }, [draft?.conditions.quantity, draft?.items, persistDraft]);

  useEffect(() => {
    if (!draft) return;

    const draftItem = draft.items?.[0];
    if (draftItem) {
      setManualItemForm({
        gameType: draftItem.gameType ?? emptyManualItemForm.gameType,
        bodyType: draftItem.bodyType ?? emptyManualItemForm.bodyType,
        makerId: draftItem.makerId ?? "",
        makerName: draftItem.maker ?? "",
        modelId: draftItem.modelId ?? "",
        modelName: draftItem.modelName ?? "",
        frameColor: draftItem.frameColor ?? "",
      });
      return;
    }

    const initialForm: ManualItemFormState = {
      gameType: emptyManualItemForm.gameType,
      bodyType: emptyManualItemForm.bodyType,
      makerId: draft.conditions.makerId ?? "",
      makerName: draft.conditions.makerName ?? displayPropertyInfo.maker ?? "",
      modelId: draft.conditions.machineModelId ?? "",
      modelName: draft.conditions.productName ?? displayPropertyInfo.modelName ?? "",
      frameColor: "",
    };

    persistManualItem(initialForm);
    setManualItemForm(initialForm);
  }, [displayPropertyInfo, draft, persistManualItem]);

  useEffect(() => {
    if (!pickListingId || !linkedListing || !draft) return;
    if (appliedPickListingId === pickListingId) return;

    const nextGameType = mapListingTypeToGameType(linkedListing.type) ?? manualItemForm.gameType;
    const nextBodyType = mapListingKindToBodyType(linkedListing.kind) ?? manualItemForm.bodyType;
    const nextQuantity = linkedListing.quantity ?? draft.conditions.quantity ?? 1;
    const nextUnitPrice =
      linkedListing.unitPriceExclTax === null || linkedListing.unitPriceExclTax === undefined
        ? editedConditions.price
        : linkedListing.unitPriceExclTax;
    const nextRemovalDate = linkedListing.removalDate ? linkedListing.removalDate.slice(0, 10) : editedConditions.removalDate;

    const matchedMaker = makers.find((maker) => maker.name === (linkedListing.maker ?? manualItemForm.makerName));
    const makerId = matchedMaker?.id ?? manualItemForm.makerId;
    const makerName = matchedMaker?.name ?? linkedListing.maker ?? manualItemForm.makerName;
    const availableModels = machineModels.filter((model) => model.makerId === makerId);
    const matchedModel = availableModels.find(
      (model) => model.name === (linkedListing.machineName ?? manualItemForm.modelName)
    );
    const modelId = matchedModel?.id ?? availableModels[0]?.id ?? manualItemForm.modelId;
    const modelName = matchedModel?.name ?? linkedListing.machineName ?? manualItemForm.modelName;

    const nextForm: ManualItemFormState = {
      gameType: nextGameType,
      bodyType: nextBodyType,
      makerId,
      makerName,
      modelId,
      modelName,
      frameColor: manualItemForm.frameColor,
    };

    setManualItemForm(nextForm);
    setEditedConditions((prev) => ({
      ...prev,
      quantity: nextQuantity,
      price: typeof nextUnitPrice === "number" ? nextUnitPrice : prev.price,
      removalDate: nextRemovalDate,
    }));

    persistDraft((prev) => {
      if (!prev) return prev;

      const updatedItem: ManualNaviItem = {
        id: prev.items?.[0]?.id ?? generateManualItemId(),
        gameType: nextForm.gameType,
        bodyType: nextForm.bodyType,
        makerId: makerId || null,
        maker: makerName,
        modelId: modelId || null,
        modelName: modelName,
        frameColor: prev.items?.[0]?.frameColor ?? null,
        quantity: nextQuantity,
      };

      const remainingItems = prev.items?.slice(1) ?? [];

      return {
        ...prev,
        productId: linkedListing.id,
        items: [updatedItem, ...remainingItems],
        conditions: {
          ...prev.conditions,
          productName: modelName ?? prev.conditions.productName,
          makerName: makerName ?? prev.conditions.makerName,
          makerId: makerId ?? prev.conditions.makerId,
          machineModelId: modelId ?? prev.conditions.machineModelId,
          quantity: nextQuantity,
          unitPrice: typeof nextUnitPrice === "number" ? nextUnitPrice : prev.conditions.unitPrice,
          location: linkedListing.storageLocation ?? prev.conditions.location,
          removalDate: nextRemovalDate ?? prev.conditions.removalDate,
        },
      };
    });

    setValidationErrors((prev) => ({ ...prev, items: undefined, quantity: undefined, unitPrice: undefined }));
    setAppliedPickListingId(pickListingId);

    const nextParams = new URLSearchParams(safeSearchParams);
    nextParams.delete("pickListingId");
    const queryString = nextParams.toString();
    router.replace(`/navi${queryString ? `?${queryString}` : ""}`);
  }, [
    appliedPickListingId,
    draft,
    editedConditions.price,
    editedConditions.removalDate,
    linkedListing,
    manualItemForm.bodyType,
    manualItemForm.frameColor,
    manualItemForm.gameType,
    manualItemForm.makerId,
    manualItemForm.makerName,
    manualItemForm.modelId,
    manualItemForm.modelName,
    machineModels,
    makers,
    pickListingId,
    persistDraft,
    router,
    safeSearchParams,
  ]);

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

  const handleMakerSelect = (makerId: string) => {
    const selectedMaker = makers.find((maker) => maker.id === makerId);
    const availableModels = machineModels.filter((model) => model.makerId === makerId);
    const defaultModel = availableModels[0];

    setManualItemForm((prev) => {
      const next = {
        ...prev,
        makerId,
        makerName: selectedMaker?.name ?? "",
        modelId: defaultModel?.id ?? "",
        modelName: defaultModel?.name ?? "",
      };
      persistManualItem(next);
      return next;
    });
  };

  const handleModelSelect = (modelId: string) => {
    const selectedModel = filteredModels.find((model) => model.id === modelId);
    setManualItemForm((prev) => {
      const next = {
        ...prev,
        modelId,
        modelName: selectedModel?.name ?? prev.modelName,
      };
      persistManualItem(next);
      return next;
    });
  };

  const handleManualItemChange = <K extends keyof ManualItemFormState>(key: K, value: ManualItemFormState[K]) => {
    setManualItemForm((prev) => {
      const next =
        key === "gameType"
          ? { ...prev, [key]: value, makerId: "", makerName: "", modelId: "", modelName: "" }
          : { ...prev, [key]: value };
      persistManualItem(next);
      return next;
    });
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

      <div className="space-y-4">
        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">取引先情報</h2>
            {isBuyerSet && !shouldShowBuyerSelector && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-neutral-800">設定済み</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-400 text-sm">
              <tbody className="text-slate-900">
                <EditRow label="会社名">
                  {shouldShowBuyerSelector ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">買手</span>
                        <span className="text-sm text-neutral-900">{buyerCompanyDisplay}</span>
                      </div>
                      <label className="block text-xs font-semibold text-neutral-800">
                        取引先（買手）を選択してください
                      </label>
                      <select
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
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
                      <div className="flex flex-wrap gap-2">
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">買手</span>
                        <span className="text-sm text-neutral-900">{buyerCompanyDisplay}</span>
                      </div>
                      <button
                        type="button"
                        className="whitespace-nowrap text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                        onClick={handleResetBuyerSelection}
                      >
                        取引先情報を変更
                      </button>
                    </div>
                  )}
                </EditRow>

                <EditRow label="担当者">
                  <p className="text-sm text-neutral-900">{buyerContactDisplay}</p>
                </EditRow>
                <EditRow label="発送先住所">
                  <p className="text-sm text-neutral-900">{buyerAddressDisplay}</p>
                </EditRow>
                <EditRow label="会社名">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">売手</span>
                    <span className="text-sm text-neutral-900">自社（{currentUser.companyName}）</span>
                  </div>
                </EditRow>
                <EditRow label="担当者">
                  <p className="text-sm text-neutral-900">{sellerContactDisplay}</p>
                </EditRow>
              </tbody>
            </table>
          </div>
          {validationErrors.buyer && !isBuyerSet && (
            <p className="px-4 py-2 text-sm text-red-600">{validationErrors.buyer}</p>
          )}
        </section>

        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
            {isProductLinked ? (
              <span className="text-xs font-semibold text-neutral-600">出品情報から入力</span>
            ) : (
              <button
                type="button"
                className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                onClick={() => router.push("/mypage/exhibits?tab=active&mode=pickForNavi")}
              >
                出品から選ぶ
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-400 text-sm">
              <tbody className="text-slate-900">
                <EditRow label="分類" required>
                  {renderRadioGroup<ManualItemFormState["gameType"]>(
                    "game-type",
                    ["pachinko", "slot"],
                    manualItemForm.gameType,
                    (next) => handleManualItemChange("gameType", next),
                    (option) => gameTypeLabelMap[option]
                  )}
                </EditRow>

                <EditRow label="種別" required>
                  {renderRadioGroup<ManualItemFormState["bodyType"]>(
                    "body-type",
                    ["本体", "枠のみ", "セルのみ"],
                    manualItemForm.bodyType,
                    (next) => handleManualItemChange("bodyType", next)
                  )}
                </EditRow>

                <EditRow label="メーカー" required>
                  <div className="flex flex-col gap-2">
                    {masterError ? <p className="text-xs text-red-600">{masterError}</p> : null}
                    <select
                      className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                      value={manualItemForm.makerId}
                      onChange={(e) => handleMakerSelect(e.target.value)}
                      disabled={isLoadingMasters || makers.length === 0}
                    >
                      <option value="">{isLoadingMasters ? "読み込み中…" : "メーカーを選択"}</option>
                      {makers.map((maker) => (
                        <option key={maker.id} value={maker.id}>
                          {maker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </EditRow>

                <EditRow label="機種名" required>
                  <select
                    className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                    value={manualItemForm.modelId}
                    onChange={(e) => handleModelSelect(e.target.value)}
                    disabled={!manualItemForm.makerId || filteredModels.length === 0}
                  >
                    {!manualItemForm.makerId && <option value="">メーカーを選択してください</option>}
                    {manualItemForm.makerId && filteredModels.length === 0 && (
                      <option value="">選択できる機種がありません</option>
                    )}
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </EditRow>

                <EditRow label="枠色">
                  <input
                    type="text"
                    className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
                    value={manualItemForm.frameColor}
                    onChange={(e) => handleManualItemChange("frameColor", e.target.value)}
                    placeholder="例：赤枠"
                  />
                </EditRow>
              </tbody>
            </table>
          </div>
          {validationErrors.items && (
            <p className="px-4 py-2 text-sm text-red-600">{validationErrors.items}</p>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2 text-base font-semibold text-neutral-900">
              <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
            </div>
            <div className="overflow-x-auto px-2 py-3">
              <table className="min-w-full border border-slate-400 text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs text-neutral-700">
                    <th className="w-40 px-3 py-1.5">項目</th>
                    <th className="px-3 py-1.5">内容</th>
                  </tr>
                </thead>
                <tbody className="text-slate-900">
                  <EditRow label="単価">
                    <div className="flex flex-col items-start gap-1">
                      <input
                        type="number"
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.price}
                        onChange={(e) => handleNumberConditionChange("price", Number(e.target.value) || 0)}
                      />
                      {validationErrors.unitPrice && (
                        <p className="text-sm text-red-600">{validationErrors.unitPrice}</p>
                      )}
                    </div>
                  </EditRow>

                  <EditRow label="台数">
                    <div className="flex flex-col items-start gap-1">
                      <input
                        type="number"
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.quantity}
                        onChange={(e) => handleNumberConditionChange("quantity", Number(e.target.value) || 0)}
                      />
                      {validationErrors.quantity && (
                        <p className="text-sm text-red-600">{validationErrors.quantity}</p>
                      )}
                    </div>
                  </EditRow>

                  <EditRow label="撤去日">
                    <input
                      type="date"
                      className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="yyyy/mm/dd"
                      value={editedConditions.removalDate}
                      onChange={(e) => handleTextConditionChange("removalDate", e.target.value)}
                    />
                  </EditRow>

                  <EditRow label="機械発送日" required>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="date"
                          className={`w-full max-w-xs rounded border px-3 py-2 text-sm ${
                            showMachineShipmentError ? "border-red-200 bg-red-50" : "border-slate-300"
                          }`}
                          placeholder="yyyy/mm/dd"
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
                      {showMachineShipmentError && <p className="text-xs text-red-600">必須項目です</p>}
                    </div>
                  </EditRow>

                  <EditRow label="書類発送日" required>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="date"
                          className={`w-full max-w-xs rounded border px-3 py-2 text-sm ${
                            showDocumentShipmentError ? "border-red-200 bg-red-50" : "border-slate-300"
                          }`}
                          placeholder="yyyy/mm/dd"
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
                      {showDocumentShipmentError && <p className="text-xs text-red-600">必須項目です</p>}
                    </div>
                  </EditRow>

                  <EditRow label="支払日" required>
                    <div className="space-y-1">
                      <input
                        type="date"
                        className={`w-full max-w-xs rounded border px-3 py-2 text-sm ${
                          showPaymentDueError ? "border-red-200 bg-red-50" : "border-slate-300"
                        }`}
                        placeholder="yyyy/mm/dd"
                        value={editedConditions.paymentDue}
                        onChange={(e) => handleTextConditionChange("paymentDue", e.target.value)}
                      />
                      {showPaymentDueError && <p className="text-xs text-red-600">必須項目です</p>}
                    </div>
                  </EditRow>

                  <EditRow label="機械運賃">
                    <div className="flex flex-col items-start gap-1">
                      <input
                        type="number"
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
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
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
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
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.cardboardFee?.amount ?? 0}
                        onChange={(e) => handleAdditionalFeeChange("cardboardFee", Number(e.target.value) || 0)}
                      />
                    </div>
                  </EditRow>

                  <EditRow label="釘シート">
                    <div className="flex flex-col items-start gap-1">
                      <input
                        type="number"
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.nailSheetFee?.amount ?? 0}
                        onChange={(e) => handleAdditionalFeeChange("nailSheetFee", Number(e.target.value) || 0)}
                      />
                    </div>
                  </EditRow>

                  <EditRow label="保険">
                    <div className="flex flex-col items-start gap-1">
                      <input
                        type="number"
                        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editedConditions.insuranceFee?.amount ?? 0}
                        onChange={(e) => handleAdditionalFeeChange("insuranceFee", Number(e.target.value) || 0)}
                      />
                    </div>
                  </EditRow>

                  <EditRow label="特記事項">
                    <textarea
                      className="w-full max-w-2xl rounded border border-slate-300 px-3 py-2 text-sm"
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
                          className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
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
                        className="h-24 w-full resize-vertical rounded border border-slate-300 px-3 py-2 text-sm"
                        placeholder="400文字以内、7行以内"
                        value={editedConditions.terms}
                        onChange={(e) => handleTextConditionChange("terms", e.target.value)}
                      />
                    </div>
                  </EditRow>

                  <EditRow label="備考">
                    <textarea
                      className="h-20 w-full resize-vertical rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="備考など自由入力"
                      value={editedConditions.memo ?? ""}
                      onChange={(e) => handleTextConditionChange("memo", e.target.value)}
                    />
                  </EditRow>

                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-dashed border-slate-400 bg-slate-100 p-4 text-sm text-neutral-800">
            <p className="font-semibold text-slate-900">金額内訳</p>
            {quoteResult ? (
              <div className="mt-3 space-y-1 text-sm text-neutral-900">
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
              <p className="mt-3 text-sm text-neutral-700">金額を入力すると自動計算されます。</p>
            )}
          </section>
        </div>
      </div>

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
    searchParams.get("qty") ?? searchParams.get("quantity"),
    linkedListing?.quantity ?? product?.quantity ?? 1
  );
  const unitPrice = parseNumberParam(
    searchParams.get("unitPrice"),
    linkedListing?.unitPriceExclTax ?? product?.price ?? 0
  );
  const hasEstimateParams = Boolean(
    searchParams.get("subtotal") ||
      searchParams.get("machineShippingTotal") ||
      searchParams.get("shippingHandlingTotal") ||
      searchParams.get("total")
  );
  const subtotal = parseNumberParam(searchParams.get("subtotal"), unitPrice * quantity);
  const machineShippingTotal = parseNumberParam(searchParams.get("machineShippingTotal"), 0);
  const shippingHandlingTotal = parseNumberParam(searchParams.get("shippingHandlingTotal"), 0);
  const totalAmount = parseNumberParam(searchParams.get("total"), subtotal + machineShippingTotal + shippingHandlingTotal);

  const devUsers = useMemo(() => getDevUsers(), []);
  const sellerUserId =
    linkedListing?.sellerUserId ??
    product?.ownerUserId ??
    devUsers.find((user) => user.id !== currentUser.id)?.id ??
    currentUser.id;
  const seller = findDevUserById(sellerUserId) ?? devUsers.find((user) => user.id !== currentUser.id) ?? currentUser;

  const masterData = useMemo(() => loadMasterData(), []);
  const warehouseDetails = useMemo(() => masterData.warehouseDetails ?? [], [masterData]);
  const hasWarehouses = warehouseDetails.length > 0;

  const [shippingAddressMode, setShippingAddressMode] = useState<"warehouse" | "manual">(
    hasWarehouses ? "warehouse" : "manual"
  );
  const initialWarehouseId = searchParams.get("buyerWarehouseId") ?? warehouseDetails[0]?.id ?? "";
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(initialWarehouseId);
  const [manualShippingAddress, setManualShippingAddress] = useState(currentUser.address);
  const [contactPerson, setContactPerson] = useState(currentUser.contactName);
  const [desiredShipDate, setDesiredShipDate] = useState("");
  const [desiredDocumentShipDate, setDesiredDocumentShipDate] = useState("");
  const [desiredPaymentDate, setDesiredPaymentDate] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    contactPerson: false,
    shippingAddress: false,
    desiredShipDate: false,
    desiredDocumentShipDate: false,
    desiredPaymentDate: false,
  });
  const formattedNumber = formatCurrency;

  const markTouched = useCallback((field: keyof typeof touchedFields) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  const formatInquiryDate = useCallback((value?: string | null) => {
    if (!value) return "-";
    const trimmed = String(value).trim();
    if (!trimmed || trimmed === "-") return "-";
    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0].replace(/-/g, "/");
    const slashMatch = trimmed.match(/^\d{4}\/\d{2}\/\d{2}/);
    if (slashMatch) return slashMatch[0];
    const jpMatch = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (jpMatch) {
      return `${jpMatch[1]}/${jpMatch[2].padStart(2, "0")}/${jpMatch[3].padStart(2, "0")}`;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10).replace(/-/g, "/");
    }
    return trimmed.replace(/-/g, "/");
  }, []);

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setTouchedFields({
      contactPerson: true,
      shippingAddress: true,
      desiredShipDate: true,
      desiredDocumentShipDate: true,
      desiredPaymentDate: true,
    });
    const missing: string[] = [];
    if (!contactPerson.trim()) missing.push("買手担当者を入力してください。");
    if (shippingAddressMode === "warehouse") {
      if (!selectedWarehouseId) missing.push("発送先の倉庫を選択してください。");
      if (!resolvedShippingAddress) missing.push("発送先住所を選択してください。");
    } else if (!manualShippingAddress.trim()) {
      missing.push("発送先住所を入力してください。");
    }
    if (!desiredShipDate) missing.push("機械発送日を入力してください。");
    if (!desiredDocumentShipDate) missing.push("書類発送日を入力してください。");
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
            shippingAddress: resolvedShippingAddress,
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

  const selectedWarehouse: Warehouse | undefined = useMemo(
    () => warehouseDetails.find((warehouse) => warehouse.id === selectedWarehouseId),
    [selectedWarehouseId, warehouseDetails]
  );

  const resolvedShippingAddress = useMemo(() => {
    if (shippingAddressMode === "warehouse") {
      if (!selectedWarehouse) return "";
      const detail = selectedWarehouse.address?.trim();
      return detail ? `${selectedWarehouse.name} ${detail}`.trim() : selectedWarehouse.name;
    }
    return manualShippingAddress.trim();
  }, [manualShippingAddress, selectedWarehouse, shippingAddressMode]);

  const isFormValid =
    Boolean(contactPerson.trim()) &&
    Boolean(resolvedShippingAddress) &&
    Boolean(desiredShipDate) &&
    Boolean(desiredDocumentShipDate) &&
    Boolean(desiredPaymentDate);

  const isContactPersonMissing = !contactPerson.trim();
  const isShippingAddressMissing =
    shippingAddressMode === "warehouse"
      ? !selectedWarehouseId || !resolvedShippingAddress
      : !manualShippingAddress.trim();
  const isDesiredShipDateMissing = !desiredShipDate;
  const isDesiredDocumentShipDateMissing = !desiredDocumentShipDate;
  const isDesiredPaymentDateMissing = !desiredPaymentDate;

  const showContactPersonError = isContactPersonMissing && (submitAttempted || touchedFields.contactPerson);
  const showShippingAddressError = isShippingAddressMissing && (submitAttempted || touchedFields.shippingAddress);
  const showDesiredShipDateError = isDesiredShipDateMissing && (submitAttempted || touchedFields.desiredShipDate);
  const showDesiredDocumentShipDateError =
    isDesiredDocumentShipDateMissing && (submitAttempted || touchedFields.desiredDocumentShipDate);
  const showDesiredPaymentDateError = isDesiredPaymentDateMissing && (submitAttempted || touchedFields.desiredPaymentDate);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-2 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold text-slate-900">オンライン問い合わせ作成</h1>
        {errors.length > 0 && (
          <ul className="list-disc space-y-1 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-4">
        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">取引先情報</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-400 text-sm">
              <tbody className="text-slate-900">
                <EditRow label="会社名">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">買手</span>
                    <span className="text-sm text-neutral-900">自社（{currentUser.companyName}）</span>
                  </div>
                </EditRow>
                <EditRow label="担当者" required>
                  <div className="space-y-1">
                    <input
                      type="text"
                      className={`w-full max-w-md rounded border px-3 py-2 ${
                        showContactPersonError ? "border-red-200 bg-red-50" : "border-slate-300"
                      }`}
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      onBlur={() => markTouched("contactPerson")}
                      placeholder="氏名を入力"
                    />
                    {showContactPersonError && <p className="text-xs text-red-600">必須項目です</p>}
                  </div>
                </EditRow>
                <EditRow label="発送先住所" required>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-3 text-sm text-neutral-900">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping-address-mode"
                          value="warehouse"
                          checked={shippingAddressMode === "warehouse"}
                          onChange={() => setShippingAddressMode("warehouse")}
                          className="h-4 w-4"
                          disabled={!hasWarehouses}
                        />
                        <span>登録倉庫から選択</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping-address-mode"
                          value="manual"
                          checked={shippingAddressMode === "manual"}
                          onChange={() => setShippingAddressMode("manual")}
                          className="h-4 w-4"
                        />
                        <span>手入力</span>
                      </label>
                    </div>
                    {shippingAddressMode === "warehouse" ? (
                      <div className="space-y-2">
                        <select
                          className={`w-full max-w-md rounded border px-3 py-2 ${
                            showShippingAddressError ? "border-red-200 bg-red-50" : "border-slate-300"
                          }`}
                          value={selectedWarehouseId}
                          onChange={(e) => setSelectedWarehouseId(e.target.value)}
                          onBlur={() => markTouched("shippingAddress")}
                          disabled={!hasWarehouses}
                        >
                          <option value="">倉庫を選択</option>
                          {warehouseDetails.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                        {!hasWarehouses && (
                          <p className="text-xs text-neutral-600">登録済み倉庫がありません。手入力で発送先住所を記入してください。</p>
                        )}
                        {showShippingAddressError && <p className="text-xs text-red-600">必須項目です</p>}
                      </div>
                    ) : (
                      <textarea
                        className={`min-h-[88px] w-full rounded border px-3 py-2 ${
                          showShippingAddressError ? "border-red-200 bg-red-50" : "border-slate-300"
                        }`}
                        value={manualShippingAddress}
                        onChange={(e) => setManualShippingAddress(e.target.value)}
                        onBlur={() => markTouched("shippingAddress")}
                        placeholder="例：東京都〇〇市1-2-3 ビル名"
                      />
                    )}
                    {shippingAddressMode === "manual" && showShippingAddressError && (
                      <p className="text-xs text-red-600">必須項目です</p>
                    )}
                  </div>
                </EditRow>

                <EditRow label="会社名">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">売手</span>
                    <span className="text-sm text-neutral-900">{seller.companyName}</span>
                  </div>
                </EditRow>
                <EditRow label="担当者">
                  <p className="text-sm text-neutral-900">{seller.contactName || "-"}</p>
                </EditRow>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-400 text-sm">
              <tbody className="text-slate-900">
                <EditRow label="分類">
                  <span>{formatGameTypeLabel(linkedListing?.kind ?? product?.type ?? null)}</span>
                </EditRow>
                <EditRow label="種別">
                  <span>{linkedListing?.type ?? product?.type ?? "-"}</span>
                </EditRow>
                <EditRow label="メーカー">
                  <span>{makerName || "-"}</span>
                </EditRow>
                <EditRow label="機種名">
                  <span>{productName || "-"}</span>
                </EditRow>
                <EditRow label="枠色">
                  <span>-</span>
                </EditRow>
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2 text-base font-semibold text-neutral-900">
              <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
            </div>
            <div className="overflow-x-auto px-2 py-3">
              <table className="min-w-full border border-slate-400 text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs text-neutral-700">
                    <th className="w-40 px-3 py-1.5">項目</th>
                    <th className="px-3 py-1.5">内容</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-900">
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">単価</th>
                    <td className="px-3 py-2">{formattedNumber(unitPrice)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">台数</th>
                    <td className="px-3 py-2">{quantity}台</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">撤去日</th>
                    <td className="px-3 py-2">
                      {formatInquiryDate(linkedListing?.removalDate ?? product?.removalDate ?? "-")}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <span>機械発送日</span>
                        <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
                      </div>
                    </th>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="date"
                          className={`w-full max-w-xs rounded border px-3 py-2 ${
                            showDesiredShipDateError ? "border-red-200 bg-red-50" : "border-slate-300"
                          }`}
                          value={desiredShipDate}
                          onChange={(e) => setDesiredShipDate(e.target.value)}
                          onBlur={() => markTouched("desiredShipDate")}
                        />
                        {showDesiredShipDateError && <p className="text-xs text-red-600">必須項目です</p>}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <span>書類発送日</span>
                        <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
                      </div>
                    </th>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="date"
                          className={`w-full max-w-xs rounded border px-3 py-2 ${
                            showDesiredDocumentShipDateError ? "border-red-200 bg-red-50" : "border-slate-300"
                          }`}
                          value={desiredDocumentShipDate}
                          onChange={(e) => setDesiredDocumentShipDate(e.target.value)}
                          onBlur={() => markTouched("desiredDocumentShipDate")}
                        />
                        {showDesiredDocumentShipDateError && <p className="text-xs text-red-600">必須項目です</p>}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <span>支払日</span>
                        <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
                      </div>
                    </th>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="date"
                          className={`w-full max-w-xs rounded border px-3 py-2 ${
                            showDesiredPaymentDateError ? "border-red-200 bg-red-50" : "border-slate-300"
                          }`}
                          value={desiredPaymentDate}
                          onChange={(e) => setDesiredPaymentDate(e.target.value)}
                          onBlur={() => markTouched("desiredPaymentDate")}
                        />
                        {showDesiredPaymentDateError && <p className="text-xs text-red-600">必須項目です</p>}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械送料</th>
                    <td className="px-3 py-2">
                      {hasEstimateParams ? formattedNumber(machineShippingTotal) : "-"}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">出庫手数料</th>
                    <td className="px-3 py-2">
                      {hasEstimateParams ? formattedNumber(shippingHandlingTotal) : "-"}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">段ボール</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">釘シート</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">保険</th>
                    <td className="px-3 py-2">-</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">
                      特記事項/取引条件
                    </th>
                    <td className="px-3 py-2">{linkedListing?.note ?? product?.note ?? "-"}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <th className="bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-neutral-900">備考</th>
                    <td className="px-3 py-2">
                      <textarea
                        className="min-h-[88px] w-full rounded border border-slate-300 px-3 py-2"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="問い合わせ内容を入力"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-dashed border-slate-400 bg-slate-100 p-4 text-sm text-neutral-800">
            <p className="font-semibold text-slate-900">金額内訳</p>
            <div className="mt-3 space-y-1 text-sm text-neutral-900">
              <SummaryRow label="単価" value={formattedNumber(unitPrice)} />
              <SummaryRow label="台数" value={`${quantity}台`} />
              <SummaryRow label="商品代金" value={formattedNumber(subtotal)} />
              {hasEstimateParams && (
                <>
                  <SummaryRow label="機械送料" value={formattedNumber(machineShippingTotal)} />
                  <SummaryRow label="出庫手数料" value={formattedNumber(shippingHandlingTotal)} />
                </>
              )}
              <SummaryRow
                label={hasEstimateParams ? "合計" : "合計（目安）"}
                value={formattedNumber(totalAmount)}
                emphasis
              />
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid}
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
      <th className="w-40 bg-slate-100 px-3 py-1.5 text-left text-xs font-semibold text-neutral-900 align-top">
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

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-800">{label}</span>
      <span className={`font-semibold ${emphasis ? "text-sky-700" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
