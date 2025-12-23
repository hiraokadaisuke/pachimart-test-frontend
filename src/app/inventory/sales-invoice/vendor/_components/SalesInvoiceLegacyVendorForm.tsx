"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { addSalesInvoice, generateSalesInvoiceId } from "@/lib/demo-data/salesInvoices";
import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

type BaseRow = {
  inventoryId?: string;
  maker?: string;
  productName?: string;
  type?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remainingDebt?: number;
  applicationPrefecture?: string;
  applicationDate?: string;
  note?: string;
};

type Props = {
  inventories?: InventoryRecord[];
  selectedIds?: string[];
};

const yellowInput =
  "w-full bg-amber-100 border border-black px-2 py-1 text-[12px] leading-tight focus:outline-none";
const orangeInput =
  "w-full bg-orange-200 border border-black px-2 py-1 text-[12px] leading-tight focus:outline-none";
const labelCell = "w-20 text-[12px]";

export function SalesInvoiceLegacyVendorForm({ inventories, selectedIds }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [error, setError] = useState<string>("");

  const [vendorName, setVendorName] = useState("株式会社ピーコム");
  const [contactName] = useState("御中");
  const [vendorTel, setVendorTel] = useState("03-1234-5678");
  const [vendorFax, setVendorFax] = useState("03-1234-5679");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState("デモユーザー");
  const [manager, setManager] = useState("担当者A");
  const [insurance, setInsurance] = useState(0);
  const [bankNote] = useState("三井住友銀行 渋谷支店 普通 1234567 株式会社ピーコム");
  const [paymentDate, setPaymentDate] = useState("");
  const [invoiceOriginal, setInvoiceOriginal] = useState("不要");
  const [deliveryMethod, setDeliveryMethod] = useState("持参");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("AM");
  const [tradeMethod, setTradeMethod] = useState("直送");
  const [tradeDate, setTradeDate] = useState("");
  const [tradeTime, setTradeTime] = useState("AM");
  const [deliveryAddress] = useState("東京都渋谷区桜丘町26-1 セルリアンタワー15F");
  const [tradeAddress] = useState("東京都渋谷区桜丘町26-1 セルリアンタワー15F");
  const [remarks, setRemarks] = useState("リアルタイムの在庫確認ができます");
  const [noteUrl] = useState("https://pachimart.jp");
  const [noteMail] = useState("info@pachimart.jp");

  const idsKey = useMemo(() => (selectedIds && selectedIds.length > 0 ? selectedIds.join("_") : ""), [selectedIds]);

  useEffect(() => {
    const availableInventories = inventories && inventories.length > 0 ? inventories : loadInventoryRecords();
    if (!selectedIds || selectedIds.length === 0) {
      setError("在庫が選択されていません。前の画面で在庫を選択してください。");
      setRows([]);
      setInventoryRecords([]);
      return;
    }

    const lookup = new Map(availableInventories.map((item) => [item.id, item]));
    const orderedRecords = selectedIds
      .map((id) => lookup.get(id))
      .filter((item): item is InventoryRecord => Boolean(item));

    setInventoryRecords(orderedRecords);

    if (orderedRecords.length === 0) {
      setError("指定された在庫が見つかりませんでした。");
      setRows([]);
      return;
    }

    setError("");
    const mapped = orderedRecords.map<BaseRow>((item) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.saleUnitPrice ?? item.unitPrice ?? item.defaultPrice ?? 0;
      return {
        inventoryId: item.id,
        maker: item.maker ?? "",
        productName: item.model ?? item.machineName ?? "",
        type: item.type ?? item.deviceType ?? "",
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
        remainingDebt: item.remainingDebt ?? 0,
        note: item.note ?? item.notes ?? "",
      };
    });

    setRows(mapped);
    const firstVendor = orderedRecords[0]?.vendorName;
    if (firstVendor) {
      setVendorName(firstVendor);
    }
  }, [idsKey, inventories, selectedIds]);

  const subtotal = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0), 0),
    [rows],
  );
  const tax = useMemo(() => Math.floor(subtotal * 0.1), [subtotal]);
  const totalAmount = useMemo(() => subtotal + tax + (Number(insurance) || 0), [subtotal, tax, insurance]);

  const invoiceInventoryIds = useMemo(
    () => (inventoryRecords.length > 0 ? inventoryRecords.map((item) => item.id) : selectedIds ?? []),
    [inventoryRecords, selectedIds],
  );

  const handleChange = (index: number, key: keyof BaseRow, value: string) => {
    setRows((prev) => {
      const next = prev.map((row, i) => {
        if (i !== index) return row;
        const updated: BaseRow = {
          ...row,
          [key]: key === "quantity" || key === "unitPrice" ? Number(value) || 0 : value,
        } as BaseRow;
        if (key === "quantity" || key === "unitPrice") {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
        }
        return updated;
      });
      return next;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const moneyDisplay = (value: number | string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString("ja-JP");
  };

  const handleSubmit = () => {
    if (error) return;
    if (!vendorName) {
      alert("販売先を入力してください");
      return;
    }
    if (rows.length === 0) {
      alert("明細を1行以上入力してください");
      return;
    }
    if (rows.some((row) => !row.quantity || !row.unitPrice)) {
      alert("数量と単価を入力してください");
      return;
    }
    if (!window.confirm("よろしいですか？")) return;

    const items: SalesInvoiceItem[] = rows.map((row) => ({
      inventoryId: row.inventoryId,
      maker: row.maker,
      productName: row.productName,
      type: row.type,
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unitPrice) || 0,
      amount: (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0),
      remainingDebt: row.remainingDebt,
      applicationPrefecture: row.applicationPrefecture,
      applicationDate: row.applicationDate,
      note: row.note,
    }));

    const invoiceId = generateSalesInvoiceId("vendor");
    addSalesInvoice({
      invoiceId,
      invoiceType: "vendor",
      createdAt: new Date().toISOString(),
      issuedDate,
      vendorName,
      buyerName: "株式会社ピーコム",
      staff,
      manager,
      inventoryIds: invoiceInventoryIds,
      items,
      subtotal,
      tax,
      insurance: Number(insurance) || 0,
      totalAmount,
      remarks,
      paymentDueDate: paymentDate,
      invoiceOriginalRequired: invoiceOriginal === "要",
    });

    alert("登録完了");
    router.push("/inventory/sales-invoice/list");
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#dfe8f5] px-2 py-4 text-[12px] text-neutral-900">
      <div className="w-[1120px] border-[6px] border-cyan-700 bg-white p-4 shadow-[5px_5px_0_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 text-lg font-bold text-emerald-900">
          <span className="text-green-600">●</span>
          <span>販売伝票登録（業者）</span>
        </div>
        <div className="my-2 border-b border-dashed border-slate-400" />

        {error ? (
          <div className="mb-3 border border-red-600 bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
            {error} / <button onClick={() => router.back()}>戻る</button>
          </div>
        ) : null}

        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 bg-emerald-800" aria-hidden />
            <span className="bg-slate-100 px-3 py-1">新規登録</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="border border-amber-700 bg-amber-300 px-4 py-2 shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
            >
              確認
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-neutral-600 bg-neutral-200 px-4 py-2 shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
            >
              戻る
            </button>
          </div>
        </div>

        <div className="border-[4px] border-cyan-700 bg-white p-3">
          <div className="grid grid-cols-2 gap-3 border-2 border-black bg-white p-3">
            <div className="col-span-2 grid grid-cols-[1.05fr_0.95fr] gap-3 border-b-2 border-black pb-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[15px] font-bold">
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className={`${yellowInput} max-w-sm text-lg font-bold`}
                  />
                  <span className="text-sm font-semibold">{contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>FAX</span>
                  <input
                    type="text"
                    value={vendorFax}
                    onChange={(e) => setVendorFax(e.target.value)}
                    className={`${yellowInput} w-32`}
                  />
                  <span>TEL</span>
                  <input
                    type="text"
                    value={vendorTel}
                    onChange={(e) => setVendorTel(e.target.value)}
                    className={`${yellowInput} w-32`}
                  />
                </div>
                <div className="rounded-sm border border-black bg-amber-50 px-3 py-2 text-[12px] leading-tight">
                  <div className="text-sm font-semibold">当社規約に基づき売買いたします</div>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>成立後キャンセルは売買代金の50%をご請求します。</li>
                    <li>商品到着後3営業日以内に検品・ご連絡ください。</li>
                    <li>搬出入車両は指定場所への手配をお願いします。</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 border border-black bg-white px-2 py-1 text-sm font-semibold">
                    <span>日付</span>
                    <input
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className={`${yellowInput} w-36 text-center`}
                    />
                  </div>
                </div>
                <div className="border border-black">
                  <div className="border-b border-black bg-slate-100 px-2 py-1 text-sm font-bold">【売主】</div>
                  <div className="space-y-1 px-2 py-2 text-[12px] leading-tight">
                    <div className="flex items-center gap-2">
                      <span className={labelCell}>郵便番号</span>
                      <span className="border border-black px-2 py-1">150-8512</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={labelCell}>住所</span>
                      <span className="border border-black px-2 py-1">東京都渋谷区桜丘町26-1 セルリアンタワー15F</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={labelCell}>会社名</span>
                      <span className="border border-black px-2 py-1">株式会社ピーコム</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={labelCell}>代表</span>
                      <span className="border border-black px-2 py-1">代表 太郎</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={labelCell}>TEL</span>
                      <span className="border border-black px-2 py-1">03-1234-5678</span>
                      <span className="w-10 text-right">FAX</span>
                      <span className="border border-black px-2 py-1">03-1234-5679</span>
                    </div>
                  </div>
                  <div className="border-t border-black px-2 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">担当</span>
                      <select
                        value={staff}
                        onChange={(e) => setStaff(e.target.value)}
                        className={`${orangeInput} w-28`}
                      >
                        {["デモユーザー", "担当A", "担当B"].map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <span className="font-semibold">経理担当</span>
                      <input
                        type="text"
                        value={manager}
                        onChange={(e) => setManager(e.target.value)}
                        className={`${yellowInput} w-32`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 pt-2">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-neutral-800">
                <span>行を追加します</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="border border-black bg-amber-200 px-3 py-1 text-sm font-semibold"
                >
                  行追加
                </button>
              </div>
              <div className="overflow-hidden rounded-sm border-2 border-black">
                <table
                  className="w-full table-fixed text-center text-[12px]"
                  style={{ borderCollapse: "collapse" }}
                >
                  <colgroup>
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                  </colgroup>
                  <thead className="bg-slate-100 text-[12px] font-semibold">
                    <tr>
                      <th className="border border-black px-2 py-1">メーカー名</th>
                      <th className="border border-black px-2 py-1">商品名</th>
                      <th className="border border-black px-2 py-1">タイプ</th>
                      <th className="border border-black px-2 py-1">数量</th>
                      <th className="border border-black px-2 py-1">単価</th>
                      <th className="border border-black px-2 py-1">金額</th>
                      <th className="border border-black px-2 py-1">残債</th>
                      <th className="border border-black px-2 py-1">申請適用</th>
                      <th className="border border-black px-2 py-1">申請日</th>
                      <th className="border border-black px-2 py-1">商品補足</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.inventoryId ?? "row"}-${index}`} className="bg-white">
                        <td className="border border-black px-1 py-1">
                          <input
                            type="text"
                            value={row.maker ?? ""}
                            onChange={(e) => handleChange(index, "maker", e.target.value)}
                            className={yellowInput}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="text"
                            value={row.productName ?? ""}
                            onChange={(e) => handleChange(index, "productName", e.target.value)}
                            className={yellowInput}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="text"
                            value={row.type ?? ""}
                            onChange={(e) => handleChange(index, "type", e.target.value)}
                            className={yellowInput}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => handleChange(index, "quantity", e.target.value)}
                            className={`${yellowInput} text-right`}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="number"
                            value={row.unitPrice}
                            onChange={(e) => handleChange(index, "unitPrice", e.target.value)}
                            className={`${yellowInput} text-right`}
                          />
                        </td>
                        <td className="border border-black px-1 py-1 bg-amber-50 text-right font-semibold">
                          {moneyDisplay(row.amount)}
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="number"
                            value={row.remainingDebt ?? 0}
                            onChange={(e) => handleChange(index, "remainingDebt", e.target.value)}
                            className={`${yellowInput} text-right`}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="text"
                            value={row.applicationPrefecture ?? ""}
                            onChange={(e) => handleChange(index, "applicationPrefecture", e.target.value)}
                            className={orangeInput}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="date"
                            value={row.applicationDate ?? ""}
                            onChange={(e) => handleChange(index, "applicationDate", e.target.value)}
                            className={`${yellowInput} text-center`}
                          />
                        </td>
                        <td className="border border-black px-1 py-1">
                          <input
                            type="text"
                            value={row.note ?? ""}
                            onChange={(e) => handleChange(index, "note", e.target.value)}
                            className={yellowInput}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-1 text-right text-[11px] text-neutral-600">商品補足（印刷料金で表示されます）</div>
            </div>

            <div className="col-span-2 mt-3 grid grid-cols-[1.05fr_0.95fr] gap-3 text-sm">
              <div className="space-y-2 border border-black p-2">
                <div className="border-b border-black bg-slate-100 px-2 py-1 text-sm font-semibold">
                  備考（印刷料金で表示されます）
                </div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`${yellowInput} h-[72px] w-full resize-none border-0 bg-amber-50`}
                />
              </div>

              <div className="space-y-2">
                <div className="border border-black">
                  <div className="border-b border-black bg-slate-100 px-2 py-1 text-sm font-semibold">金額集計</div>
                  <div className="space-y-2 px-3 py-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span>小計</span>
                      <span className="border border-black bg-white px-2 py-1 text-right font-semibold">{moneyDisplay(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>消費税（10%）</span>
                      <span className="border border-black bg-white px-2 py-1 text-right font-semibold">{moneyDisplay(tax)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>運送保険（税込）</span>
                      <input
                        type="number"
                        value={insurance}
                        onChange={(e) => setInsurance(Number(e.target.value) || 0)}
                        className={`${yellowInput} w-28 text-right`}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-black pt-2 text-base font-bold">
                      <span>合計金額</span>
                      <span className="border border-black bg-amber-50 px-2 py-1">{moneyDisplay(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-black">
                  <div className="flex items-stretch divide-x divide-black border-b border-black bg-slate-100 text-sm font-semibold">
                    <div className="flex-1 px-2 py-1">お振込先</div>
                    <div className="w-[150px] px-2 py-1">支払期日</div>
                    <div className="w-[120px] px-2 py-1">請求書原本</div>
                  </div>
                  <div className="flex divide-x divide-black text-[12px] leading-tight">
                    <div className="flex-1 bg-white px-2 py-2">{bankNote}</div>
                    <div className="flex w-[150px] items-center justify-center px-2 py-2">
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={`${yellowInput} w-full text-center`}
                      />
                    </div>
                    <div className="flex w-[120px] items-center justify-center px-2 py-2">
                      <select
                        value={invoiceOriginal}
                        onChange={(e) => setInvoiceOriginal(e.target.value)}
                        className={`${orangeInput} w-full`}
                      >
                        <option value="要">要</option>
                        <option value="不要">不要</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-2 border-2 border-black bg-white p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="border border-black bg-slate-100 px-2 py-1">配送 / 引渡し</span>
                </div>
                <div className="grid gap-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-24 border border-black bg-slate-100 px-2 py-1 text-left font-semibold">保管先</span>
                    <span className="flex-1 border border-black px-2 py-1">{deliveryAddress}</span>
                  </div>
                  <div className="rounded-sm border border-black bg-orange-100 px-2 py-2">
                    <div className="text-sm font-semibold">商品配送先</div>
                    <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className={`${orangeInput} w-full`}
                      >
                        <option value="持参">持参</option>
                        <option value="配送">配送</option>
                      </select>
                      <span className="text-right">直送日</span>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className={`${yellowInput} w-32 text-center`}
                      />
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className={`${yellowInput} w-16`}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <span className="text-xs">&nbsp;</span>
                    </div>
                  </div>
                  <div className="rounded-sm border border-black bg-orange-100 px-2 py-2">
                    <div className="text-sm font-semibold">売契→先</div>
                    <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
                      <select
                        value={tradeMethod}
                        onChange={(e) => setTradeMethod(e.target.value)}
                        className={`${orangeInput} w-full`}
                      >
                        <option value="直送">直送</option>
                        <option value="--">--</option>
                      </select>
                      <span className="text-right">直送日</span>
                      <input
                        type="date"
                        value={tradeDate}
                        onChange={(e) => setTradeDate(e.target.value)}
                        className={`${yellowInput} w-32 text-center`}
                      />
                      <select
                        value={tradeTime}
                        onChange={(e) => setTradeTime(e.target.value)}
                        className={`${yellowInput} w-16`}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <span className="text-xs">&nbsp;</span>
                    </div>
                  </div>
                  <div className="h-8 border border-dashed border-black bg-white" />
                </div>
              </div>

              <div className="border-2 border-black bg-white">
                <div className="flex items-center justify-between border-b-2 border-black bg-slate-100 px-3 py-2 text-sm font-semibold">
                  <span>買主様 捺印欄</span>
                  <span className="border border-black px-4 py-1">印</span>
                </div>
                <div className="space-y-2 px-3 py-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-20">住所</span>
                    <span className="flex-1 border border-black px-2 py-1">{tradeAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">会社名</span>
                    <span className="flex-1 border border-black px-2 py-1">{vendorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">電話番号</span>
                    <span className="flex-1 border border-black px-2 py-1">{vendorTel}</span>
                  </div>
                </div>
                <div className="border-t-2 border-black bg-white px-3 py-2 text-[12px] leading-snug">
                  <div className="font-semibold text-red-700">リアルタイムの在庫確認ができます</div>
                  <div>URL: {noteUrl}</div>
                  <div>Email: {noteMail}</div>
                  <div>FAX: 03-1234-5679</div>
                  <div className="mt-1 text-center text-lg text-slate-600">↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓</div>
                </div>
              </div>
            </div>

            <div className="col-span-2 mt-4 flex justify-center gap-6">
              <button
                type="button"
                onClick={handleSubmit}
                className="border border-amber-700 bg-amber-300 px-8 py-2 text-sm font-bold shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
              >
                確認
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="border border-neutral-700 bg-neutral-200 px-8 py-2 text-sm font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
