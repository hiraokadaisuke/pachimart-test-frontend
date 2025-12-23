"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { addSalesInvoice, generateSalesInvoiceId } from "@/lib/demo-data/salesInvoices";
import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

const yellowInput =
  "w-full bg-amber-100 border border-black px-2 py-1 text-[13px] leading-tight focus:outline-none";

const toDateInputValue = (value?: string) => {
  if (value) return value;
  return new Date().toISOString().slice(0, 10);
};

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
};

export function SalesInvoiceLegacyHallForm({ inventories }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [hallName, setHallName] = useState("ダミーホール");
  const [contactName, setContactName] = useState("御中");
  const [hallTel, setHallTel] = useState("03-0000-0000");
  const [hallFax, setHallFax] = useState("03-0000-0001");
  const [issuedDate, setIssuedDate] = useState(toDateInputValue());
  const [staff, setStaff] = useState("デモユーザー");
  const [manager, setManager] = useState("担当者A");
  const [subtotal, setSubtotal] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [bankNote, setBankNote] = useState("三井住友銀行 渋谷支店 普通 1234567 株式会社ピーコム");
  const [paymentMethod, setPaymentMethod] = useState("口座振込");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [introductionStore, setIntroductionStore] = useState("-");
  const [installationDate, setInstallationDate] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [documentArrivalDate, setDocumentArrivalDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("倉庫A");
  const [remarks, setRemarks] = useState("特記事項があれば入力してください");

  useEffect(() => {
    if (rows.length > 0) return;
    const preferred = inventories && inventories.length > 0 ? inventories : loadInventoryRecords().filter((i) => i.status === "売却済");
    if (preferred.length > 0) {
      const mapped = preferred.map<BaseRow>((item) => ({
        inventoryId: item.id,
        maker: item.maker ?? "",
        productName: item.model ?? item.machineName ?? "",
        type: item.type ?? item.deviceType ?? "",
        quantity: item.quantity ?? 1,
        unitPrice: item.saleUnitPrice ?? item.unitPrice ?? 0,
        amount: (item.quantity ?? 1) * (item.saleUnitPrice ?? item.unitPrice ?? 0),
        remainingDebt: item.remainingDebt ?? 0,
        note: item.note ?? item.notes ?? "",
      }));
      setRows(mapped.length > 0 ? mapped : []);
    }
    if (preferred.length === 0) {
      setRows([
        {
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
    }
  }, [inventories, rows.length]);

  useEffect(() => {
    const total = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0), 0);
    setSubtotal(total);
  }, [rows]);

  const tax = useMemo(() => Math.floor(subtotal * 0.1), [subtotal]);
  const totalAmount = useMemo(() => subtotal + tax + (Number(insurance) || 0), [subtotal, tax, insurance]);

  const handleChange = (index: number, key: keyof BaseRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated: BaseRow = {
          ...row,
          [key]: key === "quantity" || key === "unitPrice" ? Number(value) || 0 : value,
        } as BaseRow;
        if (key === "quantity" || key === "unitPrice") {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
        }
        return updated;
      }),
    );
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

  const handleSubmit = () => {
    if (!hallName) {
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

    const memoLines = [
      remarks,
      paymentMethod ? `支払方法: ${paymentMethod}` : undefined,
      paymentDate ? `支払日: ${paymentDate}` : undefined,
      paymentAmount ? `支払金額: ${paymentAmount.toLocaleString("ja-JP")}` : undefined,
      introductionStore ? `導入店舗: ${introductionStore}` : undefined,
      installationDate ? `設置日: ${installationDate}` : undefined,
      openingDate ? `開店日: ${openingDate}` : undefined,
      documentArrivalDate ? `書類着日: ${documentArrivalDate}` : undefined,
      storageLocation ? `保管先: ${storageLocation}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const invoiceId = generateSalesInvoiceId("hall");
    addSalesInvoice({
      invoiceId,
      invoiceType: "hall",
      createdAt: new Date().toISOString(),
      issuedDate,
      vendorName: hallName,
      buyerName: "株式会社ピーコム",
      staff,
      manager,
      inventoryIds: inventories?.map((item) => item.id) ?? [],
      items,
      subtotal,
      tax,
      insurance: Number(insurance) || 0,
      totalAmount,
      remarks: memoLines,
    });

    alert("登録完了");
    router.push("/inventory/sales-invoice/list");
  };

  const moneyDisplay = (value: number | string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString("ja-JP");
  };

  return (
    <div className="min-h-screen bg-[#e7edf7] px-3 py-6 text-[13px] text-neutral-900">
      <div className="mx-auto max-w-6xl border border-black bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-bold text-emerald-900">
          <span className="text-green-600">●</span>
          <span>販売伝票登録（ホール）</span>
        </div>
        <div className="my-2 border-b border-black" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-1 bg-emerald-700" aria-hidden />
            <span className="bg-slate-100 px-3 py-1 text-sm font-semibold">新規登録</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={handleSubmit}
              className="border border-amber-600 bg-amber-300 px-4 py-2 shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
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

        <div className="border border-black bg-white p-3">
          <div className="flex justify-end pb-2">
            <div className="flex items-center gap-2 border border-black px-2 py-1 text-sm font-semibold">
              <span>日付</span>
              <input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className={`${yellowInput} w-36 text-center`}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7 border border-black p-2">
              <div className="mb-1 text-sm font-semibold">販売先（ホール）</div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    className={`${yellowInput} text-lg font-bold`}
                  />
                  <span className="text-sm font-semibold">{contactName}</span>
                  <button className="border border-gray-600 bg-white px-3 py-1 text-xs font-semibold shadow-inner" type="button">
                    宛名検索
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>TEL</span>
                  <input
                    type="text"
                    value={hallTel}
                    onChange={(e) => setHallTel(e.target.value)}
                    className={`${yellowInput} w-36`}
                  />
                  <span>FAX</span>
                  <input
                    type="text"
                    value={hallFax}
                    onChange={(e) => setHallFax(e.target.value)}
                    className={`${yellowInput} w-36`}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-5 border border-black p-2 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">[売主] 株式会社ピーコム</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">担当</span>
                  <select
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                    className={`${yellowInput} w-28`}
                  >
                    {["デモユーザー", "担当A", "担当B"].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-16">管理担当</span>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className={`${yellowInput} w-32`}
                  />
                  <span className="border border-black px-3 py-1">印</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">所在地</span>
                  <span className="border border-black px-2 py-1">東京都渋谷区桜丘町26-1 セルリアンタワー15F</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">TEL</span>
                  <span className="border border-black px-2 py-1">03-1234-5678</span>
                  <span className="w-12 text-right">FAX</span>
                  <span className="border border-black px-2 py-1">03-1234-5679</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-right text-[12px] text-neutral-700">行を追加します →</div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-black text-center text-[12px]">
              <thead className="bg-slate-100 text-[12px] font-semibold">
                <tr>
                  <th className="border border-black px-2 py-2">メーカー名</th>
                  <th className="border border-black px-2 py-2">商品名</th>
                  <th className="border border-black px-2 py-2">タイプ</th>
                  <th className="border border-black px-2 py-2">数量</th>
                  <th className="border border-black px-2 py-2">単価</th>
                  <th className="border border-black px-2 py-2">金額</th>
                  <th className="border border-black px-2 py-2">残債</th>
                  <th className="border border-black px-2 py-2">申請道府</th>
                  <th className="border border-black px-2 py-2">申請日</th>
                  <th className="border border-black px-2 py-2">商品補足</th>
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
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={row.productName ?? ""}
                          onChange={(e) => handleChange(index, "productName", e.target.value)}
                          className={`${yellowInput} flex-1`}
                        />
                        <span className="border border-black bg-slate-100 px-2 py-1 text-xs">▼</span>
                      </div>
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
                        className={yellowInput}
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
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddRow}
                className="border border-black bg-amber-200 px-3 py-1 text-sm font-semibold"
              >
                行追加
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-12 gap-3 text-sm">
            <div className="col-span-7 space-y-2">
              <div className="grid grid-cols-[1fr_auto] gap-2 border border-black p-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-20 font-semibold">小計</span>
                    <span className="border border-black bg-white px-2 py-1 text-right font-bold">{moneyDisplay(subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 font-semibold">消費税(10%)</span>
                    <span className="border border-black bg-white px-2 py-1 text-right font-bold">{moneyDisplay(tax)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 font-semibold">運送保険(税込)</span>
                    <input
                      type="number"
                      value={insurance}
                      onChange={(e) => setInsurance(Number(e.target.value) || 0)}
                      className={`${yellowInput} w-32 text-right`}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center border border-black bg-amber-50 px-3 py-2 text-center text-lg font-bold">
                  <div>合計金額</div>
                  <div>{moneyDisplay(totalAmount)}</div>
                </div>
              </div>

              <div className="border border-black p-2">
                <div className="font-semibold">お振込先</div>
                <textarea
                  value={bankNote}
                  onChange={(e) => setBankNote(e.target.value)}
                  className={`${yellowInput} mt-1 h-16 resize-none`}
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-20">支払方法</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={`${yellowInput} w-36`}
                      >
                        <option value="口座振込">口座振込</option>
                        <option value="現金">現金</option>
                        <option value="小切手">小切手</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20">支払日</span>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={`${yellowInput} w-36 text-center`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">支払金額</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                      className={`${yellowInput} w-40 text-right`}
                    />
                    <span className="border border-black px-3 py-1">円</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-5 space-y-2">
              <div className="border border-black bg-orange-50 p-2">
                <div className="mb-2 text-sm font-semibold">導入・設置情報</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-24">導入店舗</span>
                    <input
                      type="text"
                      value={introductionStore}
                      onChange={(e) => setIntroductionStore(e.target.value)}
                      className={`${yellowInput} w-full`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24">設置日</span>
                    <input
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className={`${yellowInput} w-40`}
                    />
                    <span className="w-20 text-right">開店日</span>
                    <input
                      type="date"
                      value={openingDate}
                      onChange={(e) => setOpeningDate(e.target.value)}
                      className={`${yellowInput} w-40`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24">書類着日</span>
                    <input
                      type="date"
                      value={documentArrivalDate}
                      onChange={(e) => setDocumentArrivalDate(e.target.value)}
                      className={`${yellowInput} w-40`}
                    />
                    <span className="w-20 text-right">残債</span>
                    <span className="border border-black bg-white px-2 py-1 text-right font-semibold">
                      {moneyDisplay(rows[0]?.remainingDebt ?? 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-black bg-white p-2 text-[12px] leading-relaxed">
                <div className="mb-1 text-sm font-semibold">社内メモ</div>
                <div className="space-y-1">
                  <div>・販売管理台帳に貼付</div>
                  <div>・社内FAX配信済み</div>
                  <div>・控えは担当者が保管</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-12 gap-3">
            <div className="col-span-9">
              <div className="border border-black">
                <div className="bg-slate-50 px-2 py-1 text-sm font-semibold">備考</div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`${yellowInput} h-24 w-full resize-none border-0 bg-amber-100 px-3 py-2`}
                />
              </div>
            </div>
            <div className="col-span-3 border border-black p-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-16">保管先</span>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className={`${yellowInput} w-full`}
                />
              </div>
              <div className="mt-2 rounded border border-dashed border-gray-500 bg-slate-50 px-2 py-4 text-center text-xs text-gray-700">
                ホール控え・社内控えを所定の場所へ保管してください。
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="border border-amber-600 bg-amber-300 px-6 py-2 text-sm font-bold shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
            >
              確認
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-neutral-600 bg-neutral-200 px-6 py-2 text-sm font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
