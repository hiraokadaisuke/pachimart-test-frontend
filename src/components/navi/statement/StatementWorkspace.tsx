"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TradeStatusKey } from "@/components/transactions/status";
import { calculateStatementTotals, formatYen } from "@/lib/dealings/calcTotals";
import { getActorRole } from "@/lib/dealings/navigation";
import { canApprove, canCancel } from "@/lib/dealings/permissions";
import { addBuyerContact, ensureContactsLoaded, saveContactsToTrade, updateTradeShipping } from "@/lib/dealings/storage";
import {
  fetchNaviById,
  fetchTradeRecordById,
  mapNaviToTradeRecord,
  saveTradeShippingInfo,
  updateTradeStatus,
} from "@/lib/dealings/api";
import { BuyerContact, Dealing, ShippingInfo } from "@/lib/dealings/types";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { getTodoPresentation } from "@/lib/dealings/todo";
import { deriveTradeStatusFromTodos } from "@/lib/dealings/deriveStatus";
import { buildTradeDiffNotes } from "@/lib/dealings/diff";
import {
  createShippingAddress,
  fetchShippingAddresses,
  shippingAddressToShippingInfo,
  type ShippingAddressDto,
} from "@/lib/shipping-address/api";

import { StatementDocument } from "./StatementDocument";
import { ContactSelector } from "./ContactSelector";

type StatementWorkspaceProps = {
  tradeId: string;
  pageTitle?: string;
  description?: string;
  backHref?: string;
};

const requiredFields: (keyof ShippingInfo)[] = ["companyName", "address", "tel", "personName"];
const requiredFieldLabels: Record<keyof ShippingInfo, string> = {
  companyName: "会社名",
  address: "住所",
  tel: "TEL",
  personName: "担当者",
  zip: "郵便番号",
};

export function StatementWorkspace({ tradeId, pageTitle, description, backHref }: StatementWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentDevUser();
  const [dealing, setDealing] = useState<Dealing | null>(null);
  const [shipping, setShipping] = useState<ShippingInfo>({});
  const [contacts, setContacts] = useState<BuyerContact[]>([]);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryNaviId = searchParams?.get("naviId");
  const resolvedNaviId = queryNaviId ?? (typeof dealing?.naviId === "number" ? String(dealing.naviId) : null);
  const statementId = resolvedNaviId ?? tradeId;

  useEffect(() => {
    let canceled = false;

    const loadDealing = async () => {
      try {
        const remote = await fetchTradeRecordById(tradeId);

        if (canceled) return;

        if (remote) {
          if (remote.sellerUserId !== currentUser.id && remote.buyerUserId !== currentUser.id) {
            console.error("Trade not found or access denied", tradeId);
            setDealing(null);
            setShipping({});
            setContacts([]);
            return;
          }

          setDealing(remote);
          setShipping(remote?.buyerShippingAddress ?? remote?.shipping ?? {});
          setContacts(ensureContactsLoaded(remote));
          return;
        }

        if (!resolvedNaviId) {
          setDealing(null);
          setShipping({});
          setContacts([]);
          return;
        }

        const navi = await fetchNaviById(resolvedNaviId);

        if (canceled) return;

        const mapped = navi ? mapNaviToTradeRecord(navi) : null;

        if (!mapped || (mapped.sellerUserId !== currentUser.id && mapped.buyerUserId !== currentUser.id)) {
          console.error("Trade navi not found or access denied", resolvedNaviId);
          setDealing(null);
          setShipping({});
          setContacts([]);
          return;
        }

        setDealing(mapped);
        setShipping(mapped?.buyerShippingAddress ?? mapped?.shipping ?? {});
        setContacts(ensureContactsLoaded(mapped));
      } catch (loadError) {
        if (canceled) return;
        console.error("Failed to load trade", loadError);
        setDealing(null);
        setShipping({});
        setContacts([]);
      }
    };

    loadDealing();

    return () => {
      canceled = true;
    };
  }, [currentUser.id, resolvedNaviId, tradeId]);

  const actorRole = dealing ? getActorRole(dealing, currentUser.id) : "none";
  const isBuyer = actorRole === "buyer";
  const isEditable = dealing ? canApprove(dealing, currentUser.id) : false;
  const todoView = dealing
    ? getTodoPresentation(dealing, actorRole === "seller" ? "seller" : "buyer")
    : null;
  const statusKey: TradeStatusKey | null = todoView?.todoKind ?? null;

  useEffect(() => {
    let canceled = false;

    if (!dealing || !isBuyer) {
      setShippingAddresses([]);
      setSelectedAddressId("");
      return;
    }

    fetchShippingAddresses(currentUser.id)
      .then((list) => {
        if (canceled) return;
        setShippingAddresses(list);
      })
      .catch((loadError) => {
        if (canceled) return;
        console.warn("Failed to load shipping addresses", loadError);
      });

    return () => {
      canceled = true;
    };
  }, [currentUser.id, isBuyer, dealing]);

  const totals = useMemo(
    () => (dealing ? calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1) : null),
    [dealing]
  );

  const missingFields = useMemo(
    () => requiredFields.filter((field) => !shipping[field] || (shipping[field] ?? "").toString().trim() === ""),
    [shipping]
  );

  const approveDisabled = !isEditable || missingFields.length > 0 || todoView?.section !== "approval";
  const cancelDisabled = !dealing || !canCancel(dealing, currentUser.id);

  const handlePrint = () => {
    window.print();
  };

  const handleShippingFieldChange = <K extends keyof ShippingInfo>(key: K, value: string) => {
    setShipping((prev) => ({ ...prev, [key]: value }));
  };

  const handleShippingChange = (next: ShippingInfo) => {
    setShipping(next);
  };

  const handleAddContact = (name: string) => {
    const result = addBuyerContact(statementId, name);
    if (result.trade && result.contact) {
      setContacts((prev) => [...prev, result.contact!]);
      setShipping((prev) => ({ ...prev, personName: result.contact!.name }));
      setDealing(result.trade);
      setMessage("担当者を追加しました。");
      setError(null);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const matched = shippingAddresses.find((address) => address.id === addressId);
    if (!matched) return;

    const mapped = shippingAddressToShippingInfo(matched);
    setShipping((prev) => ({
      ...prev,
      ...mapped,
      companyName: mapped.companyName ?? prev.companyName ?? dealing?.buyer.companyName,
    }));
    setMessage("登録済み住所を読み込みました。");
    setError(null);
  };

  const handleSaveAddress = async () => {
    if (!shipping.address || shipping.address.trim() === "") {
      setError("住所を入力してから保存してください。");
      setMessage(null);
      return;
    }

    setSavingAddress(true);
    try {
      const payload: ShippingInfo & { label?: string | null } = {
        ...shipping,
        companyName: shipping.companyName ?? dealing?.buyer.companyName ?? undefined,
        label: shipping.address ?? shipping.companyName ?? dealing?.buyer.companyName ?? undefined,
      };
      const created = await createShippingAddress(currentUser.id, payload);
      setShippingAddresses((prev) => [created, ...prev.filter((address) => address.id !== created.id)]);
      setSelectedAddressId(created.id);
      setMessage("住所帳に保存しました。");
      setError(null);
    } catch (saveError) {
      console.error("Failed to save shipping address", saveError);
      setError("住所帳への保存に失敗しました。再度お試しください。");
      setMessage(null);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleContactChange = (value: string) => {
    setShipping((prev) => ({ ...prev, personName: value }));
    const scopedContacts = ensureContactsLoaded(dealing);
    if (scopedContacts.length) {
      const normalized = value
        ? scopedContacts.some((contact) => contact.name === value)
          ? scopedContacts
          : [...scopedContacts, { contactId: value, name: value }]
        : scopedContacts;
      setContacts(normalized);
      if (value) saveContactsToTrade(statementId, normalized);
    }
  };

  const refreshDealing = async () => {
    try {
      const latest = await fetchTradeRecordById(statementId);
      if (!latest) {
        setDealing(null);
        setShipping({});
        setContacts([]);
        return null;
      }

      setDealing(latest);
      setShipping(latest.buyerShippingAddress ?? latest.shipping ?? {});
      setContacts(ensureContactsLoaded(latest));
      return latest;
    } catch (refreshError) {
      console.error("Failed to refresh trade", refreshError);
      return null;
    }
  };

  const handleApprove = async () => {
    if (!dealing) return;
    if (!isBuyer) {
      console.error("Only buyers can approve trades");
      return;
    }

    const missing = requiredFields.filter((field) => !shipping[field] || (shipping[field] ?? "").toString().trim() === "");
    if (missing.length > 0) {
      setError("発送先と担当者をすべて入力してください。");
      setMessage(null);
      return;
    }

    try {
      await saveTradeShippingInfo(statementId, shipping, contacts, currentUser.id);
    } catch (persistError) {
      console.error("Failed to persist shipping", persistError);
      setError("発送先の保存に失敗しました。時間をおいて再度お試しください。");
      setMessage(null);
      return;
    }

    const updatedShipping = updateTradeShipping(statementId, shipping, contacts);
    if (updatedShipping) setShipping(updatedShipping.shipping);

    try {
      await updateTradeStatus(statementId, "APPROVED");
      const latest = await refreshDealing();
      if (latest) {
        setMessage("承認しました。ステータスを更新しました。");
        setError(null);
        router.push("/navi?tab=purchaseHistory");
      }
    } catch (approveError) {
      console.error("Failed to approve trade", approveError);
    }
  };

  const handleCancel = async () => {
    if (!dealing) return;
    if (!isBuyer) {
      console.error("Only buyers can reject trades");
      return;
    }

    try {
      await updateTradeStatus(statementId, "REJECTED");
      const latest = await refreshDealing();
      if (latest) {
        setMessage("依頼をキャンセルしました。");
        setError(null);

        router.push("/navi?tab=purchaseHistory");
      }
    } catch (cancelError) {
      console.error("Failed to cancel trade", cancelError);
    }
  };

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (!dealing) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        明細書データが見つかりませんでした。
      </div>
    );
  }

  const headerDescription = (description ?? todoView?.description) || undefined;
  const derivedStatus = deriveTradeStatusFromTodos(dealing);

  const cancelBanner =
    derivedStatus === "CANCELED"
      ? `キャンセル済（${dealing.canceledBy === "seller" ? "売手" : dealing.canceledBy === "buyer" ? "買手" : "不明"}）`
      : null;

  const isApprovalReadOnlyForSeller = todoView?.section === "approval" && actorRole === "seller";
  const allowShippingEdit = isEditable && todoView?.section === "approval" && actorRole === "buyer";

  const primaryItem = dealing.items[0];
  const quantity =
    (dealing.quantity ?? dealing.items.reduce((sum, item) => sum + (item.qty ?? 0), 0)) || primaryItem?.qty || 1;
  const unitPrice =
    primaryItem?.unitPrice ?? (primaryItem?.amount && quantity ? Math.round(primaryItem.amount / quantity) : undefined);

  const findAmountByCategory = (category: string, fallbackLabel?: string) => {
    const item = dealing.items.find((candidate) => candidate.category === category || candidate.itemName === fallbackLabel);
    if (!item) return null;
    const qty = item.qty ?? 1;
    const amount = item.amount ?? (item.unitPrice ?? 0) * qty;
    return { label: item.itemName ?? fallbackLabel ?? category, amount };
  };

  const findAmountByLabel = (label: string) => {
    const item = dealing.items.find((candidate) => candidate.itemName === label);
    if (!item) return null;
    const qty = item.qty ?? 1;
    const amount = item.amount ?? (item.unitPrice ?? 0) * qty;
    return { label: item.itemName ?? label, amount };
  };

  const amountOf = (item?: { amount?: number; unitPrice?: number; qty?: number | null }) => {
    if (!item) return 0;
    const qty = item.qty ?? 1;
    return item.amount ?? (item.unitPrice ?? 0) * qty;
  };

  const shippingFee = findAmountByCategory("送料", "送料");
  const handlingFee = findAmountByCategory("手数料", "出庫手数料");
  const cardboardFee = findAmountByLabel("段ボール") ?? findAmountByCategory("資材", "段ボール");
  const nailSheetFee = findAmountByLabel("釘シート");
  const insuranceFee = findAmountByCategory("保険", "保険");

  const productSubtotal = dealing.items
    .filter((item) => !item.category || item.category === "本体")
    .reduce((sum, item) => sum + amountOf(item), 0);

  const formatDateLabel = (value?: string) => value || "-";

  const memoText = primaryItem?.note ?? "-";
  const notesText = dealing.remarks ?? "-";
  const termsText = dealing.termsText ?? "-";
  const diffNotes = buildTradeDiffNotes(dealing, dealing?.listingSnapshot ?? null);

  const machineShipmentLabel =
    dealing.shipmentDate || dealing.shippingMethod
      ? [formatDateLabel(dealing.shipmentDate), dealing.shippingMethod ?? dealing.receiveMethod]
          .filter(Boolean)
          .join(" / ")
      : "-";

  const documentShipmentLabel =
    dealing.documentSentDate || dealing.documentReceivedDate
      ? [
          formatDateLabel(dealing.documentSentDate),
          dealing.documentReceivedDate && `到着予定 ${dealing.documentReceivedDate}`,
        ]
          .filter(Boolean)
          .join(" / ")
      : "-";

  return (
    <div className="space-y-6">
      <div className="print-hidden space-y-4">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{pageTitle ?? "ナビ確認"}</h1>
              {statusKey && (
                <span className="text-xs">
                  <StatusBadge statusKey={statusKey} context="inProgress" />
                </span>
              )}
            </div>

            {headerDescription && <p className="text-sm text-neutral-800">{headerDescription}</p>}
            {isApprovalReadOnlyForSeller && <p className="text-[11px] text-neutral-600">買主のみ入力・承認できます</p>}
            {cancelBanner && <p className="text-xs font-semibold text-red-700">{cancelBanner}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
              >
                明細書としてPDF保存/印刷
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
              >
                戻る
              </button>
            </div>

            <div className="flex items-center gap-2">
              {actorRole !== "none" && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelDisabled}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  見送り / キャンセル
                </button>
              )}

              {todoView?.todoKind === "application_sent" &&
                todoView?.primaryAction &&
                todoView?.activeTodo &&
                todoView.primaryAction.role === actorRole && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approveDisabled}
                    className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {todoView.primaryAction.label}
                  </button>
                )}
            </div>

            {isEditable && approveDisabled && (
              <p className="w-full text-[11px] text-red-700">
                承認には {missingFields.map((field) => requiredFieldLabels[field]).join(" / ")} の入力が必要です。
              </p>
            )}
          </div>
        </div>

        {message && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        {totals && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">売主</p>
                <p className="text-sm font-semibold text-slate-900">{dealing.seller.companyName}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">買主</p>
                <p className="text-sm font-semibold text-slate-900">{dealing.buyer.companyName}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">更新日</p>
                <p className="text-sm font-semibold text-slate-900">{formatDateLabel(dealing.updatedAt)}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">合計（税込）</p>
                <p className="text-base font-bold text-indigo-700">{formatYen(totals.total)}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-2">
                    <h2 className="text-base font-semibold text-slate-900">取引先情報</h2>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-700">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">買手</span>
                      <span className="text-sm text-neutral-900">{dealing.buyer.companyName}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">売手</span>
                      <span className="text-sm text-neutral-900">{dealing.seller.companyName}</span>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-3 text-sm text-neutral-900">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold text-neutral-600">会社名</p>
                        <p className="font-semibold text-slate-900">{dealing.buyer.companyName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-neutral-600">電話番号</p>
                        <p className="text-neutral-900">{shipping.tel || dealing.buyer.tel || "-"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-neutral-600">発送先住所</p>
                      {allowShippingEdit && (
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                          <select
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            value={selectedAddressId}
                            onChange={(e) => handleAddressSelect(e.target.value)}
                          >
                            <option value="">登録済み住所を選択</option>
                            {shippingAddresses.map((address) => (
                              <option key={address.id} value={address.id}>
                                {address.label || address.addressLine || address.companyName || "登録済み住所"}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleSaveAddress}
                            disabled={savingAddress}
                            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                          >
                            住所帳に保存
                          </button>
                        </div>
                      )}
                      {allowShippingEdit ? (
                        <textarea
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                          value={shipping.address ?? ""}
                          onChange={(e) => handleShippingFieldChange("address", e.target.value)}
                          placeholder="住所を入力"
                        />
                      ) : (
                        <p className="whitespace-pre-line text-neutral-900">
                          {shipping.address || dealing.buyer.address || "-"}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-neutral-600">担当者</p>
                        {allowShippingEdit ? (
                          <ContactSelector
                            contacts={contacts}
                            value={shipping.personName}
                            onChange={handleContactChange}
                            onAdd={(name) => handleAddContact(name)}
                          />
                        ) : (
                          <p className="text-neutral-900">{shipping.personName || dealing.buyer.contactName || "-"}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-neutral-600">郵便番号</p>
                        {allowShippingEdit ? (
                          <input
                            type="text"
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            value={shipping.zip ?? ""}
                            onChange={(e) => handleShippingFieldChange("zip", e.target.value)}
                            placeholder="000-0000"
                          />
                        ) : (
                          <p className="text-neutral-900">{shipping.zip || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
                    <span className="text-xs font-semibold text-neutral-600">商品</span>
                  </div>
                  <div className="grid gap-3 px-4 py-3 text-sm text-neutral-900 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">メーカー</p>
                      <p className="font-semibold text-slate-900">{dealing.makerName ?? primaryItem?.maker ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">機種名</p>
                      <p className="text-neutral-900">{dealing.itemName ?? primaryItem?.itemName ?? "取引商品"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">台数</p>
                      <p className="text-neutral-900">{quantity}台</p>
                      {diffNotes.quantityNote && (
                        <p className="text-[11px] text-neutral-600">{diffNotes.quantityNote}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">単価</p>
                      <p className="text-neutral-900">{unitPrice ? formatYen(unitPrice) : "-"}</p>
                      {diffNotes.unitPriceNote && (
                        <p className="text-[11px] text-neutral-600">{diffNotes.unitPriceNote}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">保管場所</p>
                      <p className="text-neutral-900">{dealing.storageLocationName || "-"}</p>
                      {diffNotes.storageNote && (
                        <p className="text-[11px] text-neutral-600">{diffNotes.storageNote}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
                    <span className="text-xs font-semibold text-neutral-600">ナビ作成と同じ順序</span>
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
                          <td className="px-3 py-2">
                            {unitPrice ? formatYen(unitPrice) : "-"}
                            {diffNotes.unitPriceNote && (
                              <p className="text-[11px] text-neutral-600">{diffNotes.unitPriceNote}</p>
                            )}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">台数</th>
                          <td className="px-3 py-2">
                            {quantity}台
                            {diffNotes.quantityNote && (
                              <p className="text-[11px] text-neutral-600">{diffNotes.quantityNote}</p>
                            )}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">撤去日</th>
                          <td className="px-3 py-2">-</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械発送日</th>
                          <td className="px-3 py-2">{machineShipmentLabel}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">書類発送予定日</th>
                          <td className="px-3 py-2">{documentShipmentLabel}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">支払日</th>
                          <td className="px-3 py-2">{formatDateLabel(dealing.paymentDate)}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械運賃</th>
                          <td className="px-3 py-2">
                            {shippingFee ? formatYen(shippingFee.amount) : "-"}
                            {diffNotes.shippingCountNote && (
                              <p className="text-[11px] text-neutral-600">{diffNotes.shippingCountNote}</p>
                            )}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">出庫手数料</th>
                          <td className="px-3 py-2">
                            {handlingFee ? formatYen(handlingFee.amount) : "-"}
                            {diffNotes.handlingCountNote && (
                              <p className="text-[11px] text-neutral-600">{diffNotes.handlingCountNote}</p>
                            )}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">段ボール</th>
                          <td className="px-3 py-2">{cardboardFee ? formatYen(cardboardFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">釘シート</th>
                          <td className="px-3 py-2">{nailSheetFee ? formatYen(nailSheetFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">保険</th>
                          <td className="px-3 py-2">{insuranceFee ? formatYen(insuranceFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">特記事項</th>
                          <td className="px-3 py-2">{notesText}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">取引条件（テキスト）</th>
                          <td className="px-3 py-2 whitespace-pre-line">{termsText}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">備考</th>
                          <td className="px-3 py-2 whitespace-pre-line">{memoText}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">担当者</th>
                          <td className="px-3 py-2">{shipping.personName || dealing.handlerName || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">ステータス</h3>
                    {statusKey && <StatusBadge statusKey={statusKey} context="inProgress" />}
                  </div>
                  <p className="mt-2 text-sm text-neutral-800">
                    {headerDescription ?? "取引内容を確認し、必要に応じて承認や見送りを行ってください。"}
                  </p>
                </section>

                <section className="space-y-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">金額内訳</h3>
                    <span className="text-xs font-semibold text-neutral-700">自動計算</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">商品代金</span>
                      <span className="font-semibold text-slate-900">{formatYen(productSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">送料</span>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {shippingFee ? formatYen(shippingFee.amount) : "-"}
                        </p>
                        {diffNotes.shippingCountNote && (
                          <p className="text-[11px] text-neutral-600">{diffNotes.shippingCountNote}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">出庫手数料</span>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {handlingFee ? formatYen(handlingFee.amount) : "-"}
                        </p>
                        {diffNotes.handlingCountNote && (
                          <p className="text-[11px] text-neutral-600">{diffNotes.handlingCountNote}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">段ボール</span>
                      <span className="font-semibold text-slate-900">{cardboardFee ? formatYen(cardboardFee.amount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">釘シート</span>
                      <span className="font-semibold text-slate-900">{nailSheetFee ? formatYen(nailSheetFee.amount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">保険</span>
                      <span className="font-semibold text-slate-900">{insuranceFee ? formatYen(insuranceFee.amount) : "-"}</span>
                    </div>
                    <div className="h-px bg-slate-300" aria-hidden />
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">小計</span>
                      <span className="font-semibold text-slate-900">{formatYen(totals.totalWithoutTax)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">消費税</span>
                      <span className="font-semibold text-slate-900">{formatYen(totals.tax)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">合計</span>
                      <span className="text-base font-bold text-sky-700">{formatYen(totals.total)}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print-only">
        <StatementDocument
          dealing={dealing}
          editable={allowShippingEdit}
          shipping={shipping}
          onShippingChange={handleShippingChange}
          contacts={contacts}
          onContactChange={handleContactChange}
          onAddContact={handleAddContact}
        />
      </div>
    </div>
  );
}
