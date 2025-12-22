"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import { addSalesInvoice, generateSalesInvoiceId } from "@/lib/demo-data/salesInvoices";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

const cellBase = "border border-black px-2 py-1";
const labelCell = `${cellBase} bg-slate-100 text-center font-semibold`;
const inputBase = "w-full rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400";
const subtleInput = "w-full rounded-none border border-gray-300 bg-[#fff8dc] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400";

const today = new Date().toISOString().slice(0, 10);

type ItemInput = {
  inventoryId: string;
  quantity: number;
  unitPrice: number;
  remainingDebt?: number;
  applicationPrefecture?: string;
  applicationDate?: string;
  note?: string;
};

type FormState = {
  issuedDate: string;
  partnerName: string;
  partnerTitle: string;
  tel: string;
  fax: string;
  buyerName: string;
  buyerPostalCode: string;
  buyerAddress: string;
  buyerRepresentative: string;
  buyerTel: string;
  buyerFax: string;
  staff: string;
  manager: string;
  paymentDate: string;
  invoiceOriginal: string;
  transferBank: string;
  transferAccount: string;
  transferName: string;
  shippingMethod: string;
  shippingDate: string;
  shippingTime: string;
  tradeMethod: string;
  tradeDate: string;
  tradeTime: string;
  shippingAddress: string;
  tradeAddress: string;
  shippingInsurance: number;
};

const defaultForm: FormState = {
  issuedDate: today,
  partnerName: "株式会社ピーコム",
  partnerTitle: "御中",
  tel: "03-1234-5678",
  fax: "03-8765-4321",
  buyerName: "株式会社パチマート",
  buyerPostalCode: "001-0000",
  buyerAddress: "北海道札幌市中央区デモ1-2-3",
  buyerRepresentative: "代表取締役　山田太郎",
  buyerTel: "011-123-4567",
  buyerFax: "011-234-5678",
  staff: "デモユーザー",
  manager: "管理担当",
  paymentDate: "",
  invoiceOriginal: "不要",
  transferBank: "北海道信用金庫",
  transferAccount: "本店営業部　普通　1234567",
  transferName: "カ）パチマート",
  shippingMethod: "陸送",
  shippingDate: "",
  shippingTime: "AM",
  tradeMethod: "店頭",
  tradeDate: "",
  tradeTime: "PM",
  shippingAddress: "〒060-0000 札幌市中央区サンプル1-2-3",
  tradeAddress: "〒060-0000 札幌市中央区サンプル1-2-3",
  shippingInsurance: 0,
};

const formatNumber = (value: number) =>
  value.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export default function VendorSalesInvoiceCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [itemsInput, setItemsInput] = useState<ItemInput[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [message, setMessage] = useState<string>("");

  const selectedIds = useMemo(() => {
    const raw = searchParams?.get("ids") ?? "";
    return raw.split(",").filter(Boolean);
  }, [searchParams]);

  useEffect(() => {
    const sold = loadInventoryRecords().filter((record) => (record.status ?? record.stockStatus) === "売却済");
    const targets = selectedIds.length > 0 ? sold.filter((item) => selectedIds.includes(item.id)) : sold.slice(0, 3);
    setRecords(targets);
    setItemsInput(
      targets.map((item) => ({
        inventoryId: item.id,
        quantity: item.quantity ?? 1,
        unitPrice: item.saleUnitPrice ?? item.unitPrice ?? 0,
        remainingDebt: item.remainingDebt ?? 0,
        applicationPrefecture: "",
        applicationDate: "",
        note: item.note ?? item.notes ?? "",
      })),
    );
  }, [selectedIds]);

  const items = useMemo<SalesInvoiceItem[]>(() => {
    return records.map((record) => {
      const detail = itemsInput.find((input) => input.inventoryId === record.id);
      const quantity = detail?.quantity ?? record.quantity ?? 1;
      const unitPrice = detail?.unitPrice ?? record.saleUnitPrice ?? 0;
      const amount = quantity * unitPrice;
      return {
        inventoryId: record.id,
        maker: record.maker,
        productName: record.model ?? record.machineName,
        type: record.type ?? record.deviceType,
        quantity,
        unitPrice,
        amount,
        remainingDebt: detail?.remainingDebt,
        applicationPrefecture: detail?.applicationPrefecture,
        applicationDate: detail?.applicationDate,
        note: detail?.note,
      } satisfies SalesInvoiceItem;
    });
  }, [itemsInput, records]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const tax = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => subtotal + tax + (form.shippingInsurance || 0), [form.shippingInsurance, subtotal, tax]);

  const handleItemChange = (inventoryId: string, field: keyof ItemInput, value: string | number) => {
    setItemsInput((prev) => prev.map((item) => (item.inventoryId === inventoryId ? { ...item, [field]: value } : item)));
  };

  const validate = () => {
    if (!form.partnerName.trim()) {
      alert("販売先を入力してください");
      return false;
    }
    if (items.length === 0) {
      alert("明細がありません");
      return false;
    }
    const invalid = items.find((item) => item.quantity <= 0 || item.unitPrice <= 0);
    if (invalid) {
      alert("数量と単価を入力してください");
      return false;
    }
    return true;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (!window.confirm("よろしいですか？")) return;

    const invoiceId = generateSalesInvoiceId();
    addSalesInvoice({
      invoiceId,
      createdAt: new Date().toISOString(),
      issuedDate: form.issuedDate,
      partnerName: form.partnerName,
      partnerTitle: form.partnerTitle,
      tel: form.tel,
      fax: form.fax,
      buyerName: form.buyerName,
      buyerPostalCode: form.buyerPostalCode,
      buyerAddress: form.buyerAddress,
      buyerRepresentative: form.buyerRepresentative,
      buyerTel: form.buyerTel,
      buyerFax: form.buyerFax,
      staff: form.staff,
      manager: form.manager,
      paymentDate: form.paymentDate,
      invoiceOriginal: form.invoiceOriginal,
      transferBank: form.transferBank,
      transferAccount: form.transferAccount,
      transferName: form.transferName,
      shippingMethod: form.shippingMethod,
      shippingDate: form.shippingDate,
      shippingTime: form.shippingTime,
      tradeMethod: form.tradeMethod,
      tradeDate: form.tradeDate,
      tradeTime: form.tradeTime,
      shippingAddress: form.shippingAddress,
      tradeAddress: form.tradeAddress,
      shippingInsurance: form.shippingInsurance,
      subtotal,
      tax,
      totalAmount: total,
      items,
      inventoryIds: records.map((r) => r.id),
    });

    setMessage("登録完了");
    router.push("/inventory/sales-invoice/list");
  };

  const highlight = "bg-[#fff8dc]";
  const blueOutline = "border-4 border-cyan-700 bg-[#e8f7fb] p-2";

  return (
    <div className="space-y-4 px-4 py-6 text-xs text-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-green-600" aria-hidden />
          <h1 className="text-lg font-bold">販売伝票登録（業者）</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            form="vendor-sales-invoice-form"
            className="min-w-[96px] rounded-none border border-amber-600 bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-inner"
          >
            確認
          </button>
          <Link
            href="/inventory/sales-invoice/create"
            className="min-w-[96px] rounded-none border border-gray-500 bg-gray-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner"
          >
            戻る
          </Link>
        </div>
      </div>
      <div className="border-b border-dashed border-slate-500" />

      <div className="flex items-center justify-between bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 bg-green-600" aria-hidden />
          <span>新規登録</span>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            form="vendor-sales-invoice-form"
            className="min-w-[96px] rounded-none border border-amber-600 bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-inner"
          >
            確認
          </button>
          <Link
            href="/inventory/sales-invoice/create"
            className="min-w-[96px] rounded-none border border-gray-500 bg-gray-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner"
          >
            戻る
          </Link>
        </div>
      </div>

      {message && (
        <div className="border border-green-600 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{message}</div>
      )}

      <form id="vendor-sales-invoice-form" onSubmit={handleSubmit} className="space-y-3">
        <div className={blueOutline}>
          <div className="relative border-2 border-black bg-white p-3">
            <div className="absolute right-3 top-3 flex items-center gap-2 border border-slate-700 bg-white px-2 py-1 text-xs">
              <span className="text-[10px] text-slate-700">日付</span>
              <input
                type="date"
                value={form.issuedDate}
                onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
                className="rounded-none border border-gray-400 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="border border-black">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className={`${cellBase} w-20 bg-slate-100 text-center font-semibold`}>販売先</td>
                      <td className={`${cellBase} ${highlight}`}>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            value={form.partnerName}
                            onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
                            className={subtleInput}
                          />
                          <span className="text-sm font-semibold">{form.partnerTitle}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={`${cellBase} bg-slate-100 text-center font-semibold`}>TEL</td>
                      <td className={cellBase}>
                        <div className="flex items-center gap-2">
                          <input
                            value={form.tel}
                            onChange={(e) => setForm({ ...form, tel: e.target.value })}
                            className={inputBase}
                          />
                          <button
                            type="button"
                            className="rounded-none border border-gray-500 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-800"
                          >
                            売主検索
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={`${cellBase} bg-slate-100 text-center font-semibold`}>FAX</td>
                      <td className={cellBase}>
                        <input
                          value={form.fax}
                          onChange={(e) => setForm({ ...form, fax: e.target.value })}
                          className={inputBase}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${cellBase} bg-slate-100 text-center font-semibold`}>注意</td>
                      <td className={`${cellBase} text-[11px] leading-tight text-red-700`}>
                        <div>※メールで送信する場合、相手先に確認してから送信してください。</div>
                        <div>※再送時はメール文章を変更してください。</div>
                        <div>※メール送信後、FAXも送付してください。</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-black">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className={labelCell}>[買主]</td>
                      <td className={cellBase}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]">〒</span>
                          <input
                            value={form.buyerPostalCode}
                            onChange={(e) => setForm({ ...form, buyerPostalCode: e.target.value })}
                            className="w-28 rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                          <span className="text-[10px]">住所</span>
                          <input
                            value={form.buyerAddress}
                            onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                            className="flex-1 rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                        </div>
                        <div className="mt-1 font-semibold">{form.buyerName}</div>
                        <div className="mt-1 text-[11px]">代表者 {form.buyerRepresentative}</div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                          <div>TEL {form.buyerTel}</div>
                          <div>FAX {form.buyerFax}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={labelCell}>担当</td>
                      <td className={cellBase}>
                        <div className="flex items-center gap-2">
                          <select
                            value={form.staff}
                            onChange={(e) => setForm({ ...form, staff: e.target.value })}
                            className="w-40 rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                          >
                            <option>デモユーザー</option>
                            <option>担当A</option>
                            <option>担当B</option>
                          </select>
                          <span className="text-[11px]">管理担当</span>
                          <input
                            value={form.manager}
                            onChange={(e) => setForm({ ...form, manager: e.target.value })}
                            className="flex-1 rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-[11px] text-slate-700">行を追加します</div>
              <div className="overflow-x-auto border border-black">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-center">
                      <th className={cellBase}>メーカー名</th>
                      <th className={cellBase}>商品名</th>
                      <th className={cellBase}>タイプ</th>
                      <th className={cellBase}>数量</th>
                      <th className={cellBase}>単価</th>
                      <th className={cellBase}>金額</th>
                      <th className={cellBase}>残債</th>
                      <th className={cellBase}>申請道府</th>
                      <th className={cellBase}>申請日</th>
                      <th className={cellBase}>商品補足</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className={`${cellBase} text-center text-sm`}>
                          売却済み在庫を選択してください
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const detail = itemsInput.find((input) => input.inventoryId === item.inventoryId);
                        return (
                          <tr key={item.inventoryId} className="text-center">
                            <td className={`${cellBase} bg-white text-left`}>{item.maker ?? "-"}</td>
                            <td className={`${cellBase} bg-white`}>
                              <div className="flex items-center gap-1">
                                <select className="w-full rounded-none border border-gray-400 bg-white px-2 py-1 text-xs">
                                  <option>{item.productName ?? "商品名未設定"}</option>
                                </select>
                                <span className="text-[10px]">▼</span>
                              </div>
                            </td>
                            <td className={`${cellBase} bg-white`}>{item.type ?? "-"}</td>
                            <td className={`${cellBase} ${highlight}`}>
                              <input
                                type="number"
                                min={1}
                                value={detail?.quantity ?? 1}
                                onChange={(e) =>
                                  handleItemChange(item.inventoryId, "quantity", Number(e.target.value) || 0)
                                }
                                className={`${subtleInput} text-right`}
                              />
                            </td>
                            <td className={`${cellBase} ${highlight}`}>
                              <input
                                type="number"
                                min={0}
                                value={detail?.unitPrice ?? 0}
                                onChange={(e) =>
                                  handleItemChange(item.inventoryId, "unitPrice", Number(e.target.value) || 0)
                                }
                                className={`${subtleInput} text-right`}
                              />
                            </td>
                            <td className={cellBase}>{formatNumber(item.amount)}</td>
                            <td className={cellBase}>
                              <input
                                type="number"
                                value={detail?.remainingDebt ?? 0}
                                onChange={(e) =>
                                  handleItemChange(item.inventoryId, "remainingDebt", Number(e.target.value) || 0)
                                }
                                className={`${inputBase} text-right`}
                              />
                            </td>
                            <td className={cellBase}>
                              <input
                                value={detail?.applicationPrefecture ?? ""}
                                onChange={(e) => handleItemChange(item.inventoryId, "applicationPrefecture", e.target.value)}
                                className={inputBase}
                              />
                            </td>
                            <td className={cellBase}>
                              <input
                                type="date"
                                value={detail?.applicationDate ?? ""}
                                onChange={(e) => handleItemChange(item.inventoryId, "applicationDate", e.target.value)}
                                className={inputBase}
                              />
                            </td>
                            <td className={cellBase}>
                              <input
                                value={detail?.note ?? ""}
                                onChange={(e) => handleItemChange(item.inventoryId, "note", e.target.value)}
                                className={inputBase}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="border border-black">
                    <div className="border-b border-black bg-slate-100 px-2 py-1 font-semibold">お振込先</div>
                    <div className="space-y-1 px-2 py-2">
                      <div>{form.transferBank}</div>
                      <div>{form.transferAccount}</div>
                      <div>{form.transferName}</div>
                    </div>
                  </div>
                  <div className="border border-black">
                    <table className="w-full border-collapse text-xs">
                      <tbody>
                        <tr>
                          <td className={labelCell}>支払期日</td>
                          <td className={cellBase}>
                            <input
                              type="date"
                              value={form.paymentDate}
                              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className={labelCell}>請求書原本</td>
                          <td className={cellBase}>
                            <select
                              value={form.invoiceOriginal}
                              onChange={(e) => setForm({ ...form, invoiceOriginal: e.target.value })}
                              className={inputBase}
                            >
                              <option>不要</option>
                              <option>要</option>
                            </select>
                          </td>
                        </tr>
                        <tr>
                          <td className={labelCell}>売主様控印欄</td>
                          <td className={`${cellBase} text-right font-semibold`}>印</td>
                        </tr>
                        <tr>
                          <td className={labelCell}>担当者</td>
                          <td className={cellBase}>
                            <input
                              value={form.staff}
                              onChange={(e) => setForm({ ...form, staff: e.target.value })}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="border border-black bg-[#fff3d6] p-2 text-[11px]">
                    <div className="font-semibold">商品引き渡し</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span>方法</span>
                      <select
                        value={form.shippingMethod}
                        onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}
                        className="rounded-none border border-gray-400 bg-white px-2 py-1 text-xs"
                      >
                        <option>陸送</option>
                        <option>持込</option>
                        <option>その他</option>
                      </select>
                      <span>商品引き渡し日</span>
                      <input
                        type="date"
                        value={form.shippingDate}
                        onChange={(e) => setForm({ ...form, shippingDate: e.target.value })}
                        className="rounded-none border border-gray-400 bg-white px-2 py-1 text-xs"
                      />
                      <select
                        value={form.shippingTime}
                        onChange={(e) => setForm({ ...form, shippingTime: e.target.value })}
                        className="rounded-none border border-gray-400 bg-white px-2 py-1 text-xs"
                      >
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                    <div className="mt-2 border border-dashed border-amber-500 bg-white px-2 py-2">
                      <div className="font-semibold">引き渡し先</div>
                      <textarea
                        value={form.shippingAddress}
                        onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                        className="mt-1 w-full rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="border border-black bg-[#fff3d6] p-2 text-[11px]">
                    <div className="font-semibold">売買引き渡し</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span>方法</span>
                      <select
                        value={form.tradeMethod}
                        onChange={(e) => setForm({ ...form, tradeMethod: e.target.value })}
                        className="rounded-none border border-gray-400 bg-white px-2 py-1 text-xs"
                      >
                        <option>店頭</option>
                        <option>銀行振込</option>
                        <option>その他</option>
                      </select>
                      <span>売買引き渡し日</span>
                      <input
                        type="date"
                        value={form.tradeDate}
                        onChange={(e) => setForm({ ...form, tradeDate: e.target.value })}
                        className="rounded-none border border-gray-400 bg-white px-2 py-1 text-xs"
                      />
                      <select
                        value={form.tradeTime}
                        onChange={(e) => setForm({ ...form, tradeTime: e.target.value })}
                        className="rounded-none border border-gray-400 bg-white px-2 py-1 text-xs"
                      >
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                    <div className="mt-2 border border-dashed border-amber-500 bg-white px-2 py-2">
                      <div className="font-semibold">住所</div>
                      <textarea
                        value={form.tradeAddress}
                        onChange={(e) => setForm({ ...form, tradeAddress: e.target.value })}
                        className="mt-1 w-full rounded-none border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-black bg-white">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className={`${labelCell} w-24`}>小計</td>
                      <td className={`${cellBase} text-right font-semibold`}>{formatNumber(subtotal)}</td>
                    </tr>
                    <tr>
                      <td className={labelCell}>消費税（10%）</td>
                      <td className={`${cellBase} text-right font-semibold`}>{formatNumber(tax)}</td>
                    </tr>
                    <tr>
                      <td className={labelCell}>運送保険（税込）</td>
                      <td className={cellBase}>
                        <input
                          type="number"
                          value={form.shippingInsurance}
                          onChange={(e) => setForm({ ...form, shippingInsurance: Number(e.target.value) || 0 })}
                          className={`${inputBase} text-right`}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${labelCell} bg-amber-100`}>合計金額</td>
                      <td className={`${cellBase} bg-amber-50 text-right text-base font-bold`}>{formatNumber(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="border border-black bg-slate-50 p-2 text-[11px]">
                <div className="font-semibold">リアルタイムの在庫確認ができます</div>
                <div className="mt-1 text-[10px] leading-tight text-slate-700">
                  <div>URL： https://pachimart.jp</div>
                  <div>Email： info@pachimart.jp</div>
                  <div>FAX： 03-1234-5678</div>
                  <div className="mt-1 text-center text-slate-500">↓↓↓↓↓↓↓↓↓↓↓</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="min-w-[96px] rounded-none border border-amber-600 bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-inner"
          >
            確認
          </button>
          <Link
            href="/inventory/sales-invoice/create"
            className="min-w-[96px] rounded-none border border-gray-500 bg-gray-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner"
          >
            戻る
          </Link>
        </div>
      </form>
    </div>
  );
}
