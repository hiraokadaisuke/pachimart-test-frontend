"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_MASTER_DATA,
  createMasterId,
  loadMasterData,
  saveMasterData,
  type MasterData,
  type SupplierBranch,
  type SupplierCategory,
  type SupplierCorporate,
} from "@/lib/demo-data/demoMasterData";

const createEmptyInputs = () => ({ buyerStaffs: "", warehouses: "" });

type SimpleMasterKey = Exclude<keyof MasterData, "suppliers">;

type InputState = Record<SimpleMasterKey, string>;

const LABELS: Record<SimpleMasterKey, string> = {
  buyerStaffs: "仕入れ担当者",
  warehouses: "保管先 (倉庫)",
};

type SupplierFormState = {
  category: SupplierCategory;
  corporateName: string;
  corporatePostalCode: string;
  corporateAddress: string;
  corporatePhone: string;
  corporateFax: string;
  branchName: string;
  branchPostalCode: string;
  branchAddress: string;
  branchPhone: string;
  branchFax: string;
};

const createEmptySupplierForm = (): SupplierFormState => ({
  category: "vendor",
  corporateName: "",
  corporatePostalCode: "",
  corporateAddress: "",
  corporatePhone: "",
  corporateFax: "",
  branchName: "",
  branchPostalCode: "",
  branchAddress: "",
  branchPhone: "",
  branchFax: "",
});

export default function InventorySettingsPage() {
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [inputs, setInputs] = useState<InputState>(createEmptyInputs());
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(createEmptySupplierForm());
  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none";

  useEffect(() => {
    setMasterData(loadMasterData());
  }, []);

  const updateStorage = (next: MasterData) => {
    setMasterData(next);
    saveMasterData(next);
  };

  const handleAdd = (key: SimpleMasterKey) => {
    const value = inputs[key].trim();
    if (!value) return;
    if (masterData[key].includes(value)) {
      setInputs((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const next = { ...masterData, [key]: [...masterData[key], value] };
    updateStorage(next);
    setInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const handleDelete = (key: SimpleMasterKey, value: string) => {
    const next = { ...masterData, [key]: masterData[key].filter((item) => item !== value) };
    updateStorage(next);
  };

  const handleInputChange = (key: SimpleMasterKey, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSupplierFormChange = <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => {
    setSupplierForm((prev) => ({ ...prev, [key]: value }));
  };

  const upsertSupplier = (corporate: SupplierCorporate, branch: SupplierBranch, isExisting: boolean) => {
    const normalizedCorporate = {
      ...corporate,
      branches: isExisting
        ? corporate.branches.some((item) => item.name === branch.name)
          ? corporate.branches.map((item) => (item.name === branch.name ? { ...item, ...branch } : item))
          : [...corporate.branches, branch]
        : [branch],
    } satisfies SupplierCorporate;

    const nextSuppliers = isExisting
      ? masterData.suppliers.map((item) => (item.id === corporate.id ? normalizedCorporate : item))
      : [...masterData.suppliers, normalizedCorporate];

    updateStorage({ ...masterData, suppliers: nextSuppliers });
  };

  const handleAddSupplier = () => {
    const corporateName = supplierForm.corporateName.trim();
    const branchName = supplierForm.branchName.trim();
    if (!corporateName || !branchName) return;

    const existing = masterData.suppliers.find(
      (supplier) => supplier.corporateName === corporateName && supplier.category === supplierForm.category,
    );

    const branch: SupplierBranch = {
      id: createMasterId("branch"),
      name: branchName,
      postalCode: supplierForm.branchPostalCode.trim(),
      address: supplierForm.branchAddress.trim(),
      phone: supplierForm.branchPhone.trim(),
      fax: supplierForm.branchFax.trim(),
    };

    const corporate: SupplierCorporate = existing
      ? {
          ...existing,
          corporateName,
          postalCode: supplierForm.corporatePostalCode.trim(),
          address: supplierForm.corporateAddress.trim(),
          phone: supplierForm.corporatePhone.trim(),
          fax: supplierForm.corporateFax.trim(),
        }
      : {
          id: createMasterId("supplier"),
          category: supplierForm.category,
          corporateName,
          postalCode: supplierForm.corporatePostalCode.trim(),
          address: supplierForm.corporateAddress.trim(),
          phone: supplierForm.corporatePhone.trim(),
          fax: supplierForm.corporateFax.trim(),
          branches: [],
        };

    upsertSupplier(corporate, branch, Boolean(existing));
    setSupplierForm(createEmptySupplierForm());
  };

  const handleDeleteSupplier = (supplierId: string) => {
    updateStorage({
      ...masterData,
      suppliers: masterData.suppliers.filter((supplier) => supplier.id !== supplierId),
    });
  };

  const handleDeleteBranch = (supplierId: string, branchId: string) => {
    const nextSuppliers = masterData.suppliers
      .map((supplier) =>
        supplier.id === supplierId
          ? { ...supplier, branches: supplier.branches.filter((branch) => branch.id !== branchId) }
          : supplier,
      )
      .filter((supplier) => supplier.branches.length > 0);
    updateStorage({ ...masterData, suppliers: nextSuppliers });
  };

  const renderSection = (key: SimpleMasterKey) => (
    <section key={key} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 whitespace-nowrap">{LABELS[key]}</h2>
        <div className="flex items-center gap-2">
          <input
            value={inputs[key]}
            onChange={(event) => handleInputChange(key, event.target.value)}
            placeholder="新しい項目を入力"
            className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleAdd(key)}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            追加
          </button>
        </div>
      </div>

      {masterData[key].length === 0 ? (
        <p className="text-sm text-neutral-600">まだ登録がありません。</p>
      ) : (
        <ul className="space-y-2">
          {masterData[key].map((item) => (
            <li key={item} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-neutral-800" title={item}>
                {item}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(key, item)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">詳細設定</h1>
        <p className="text-sm text-neutral-600">仕入れ先マスタや仕入れ担当、保管先の候補を追加・削除できます。</p>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-neutral-900">仕入先マスタ</h2>
            <p className="text-sm text-neutral-600">
              業者/ホールの法人情報と支店・ホール情報を登録し、在庫登録で2段階選択できるようにします。
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-neutral-700">localStorage保存</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr,1fr]">
          <div className="space-y-4 rounded-md border border-slate-100 bg-slate-50 p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-800">法人情報</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  区分
                  <select
                    value={supplierForm.category}
                    onChange={(event) => handleSupplierFormChange("category", event.target.value as SupplierCategory)}
                    className={inputClass}
                  >
                    <option value="vendor">業者</option>
                    <option value="hall">ホール</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  法人名
                  <input
                    value={supplierForm.corporateName}
                    onChange={(event) => handleSupplierFormChange("corporateName", event.target.value)}
                    className={inputClass}
                    placeholder="法人名を入力"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  郵便番号
                  <input
                    value={supplierForm.corporatePostalCode}
                    onChange={(event) => handleSupplierFormChange("corporatePostalCode", event.target.value)}
                    className={inputClass}
                    placeholder="例: 123-4567"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  住所
                  <input
                    value={supplierForm.corporateAddress}
                    onChange={(event) => handleSupplierFormChange("corporateAddress", event.target.value)}
                    className={inputClass}
                    placeholder="住所を入力"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  電話番号 (任意)
                  <input
                    value={supplierForm.corporatePhone}
                    onChange={(event) => handleSupplierFormChange("corporatePhone", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  FAX番号 (任意)
                  <input
                    value={supplierForm.corporateFax}
                    onChange={(event) => handleSupplierFormChange("corporateFax", event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-800">支店・ホール情報</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  支店名・ホール名
                  <input
                    value={supplierForm.branchName}
                    onChange={(event) => handleSupplierFormChange("branchName", event.target.value)}
                    className={inputClass}
                    placeholder="支店 / ホール名"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  郵便番号
                  <input
                    value={supplierForm.branchPostalCode}
                    onChange={(event) => handleSupplierFormChange("branchPostalCode", event.target.value)}
                    className={inputClass}
                    placeholder="例: 123-4567"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  住所
                  <input
                    value={supplierForm.branchAddress}
                    onChange={(event) => handleSupplierFormChange("branchAddress", event.target.value)}
                    className={inputClass}
                    placeholder="住所を入力"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  電話番号 (任意)
                  <input
                    value={supplierForm.branchPhone}
                    onChange={(event) => handleSupplierFormChange("branchPhone", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-neutral-800">
                  FAX番号 (任意)
                  <input
                    value={supplierForm.branchFax}
                    onChange={(event) => handleSupplierFormChange("branchFax", event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddSupplier}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
              >
                法人＋支店を登録
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {masterData.suppliers.length === 0 ? (
              <p className="text-sm text-neutral-600">まだ仕入先が登録されていません。</p>
            ) : (
              masterData.suppliers.map((supplier) => (
                <div key={supplier.id} className="space-y-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 text-sm text-neutral-800">
                      <div className="flex items-center gap-2 text-base font-semibold text-neutral-900">
                        <span>{supplier.corporateName}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-neutral-700">
                          {supplier.category === "hall" ? "ホール" : "業者"}
                        </span>
                      </div>
                      <div className="whitespace-nowrap text-xs text-neutral-700">
                        〒{supplier.postalCode || "未登録"} {supplier.address || ""}
                      </div>
                      {(supplier.phone || supplier.fax) && (
                        <div className="flex gap-2 whitespace-nowrap text-xs text-neutral-700">
                          {supplier.phone && <span>TEL {supplier.phone}</span>}
                          {supplier.fax && <span>FAX {supplier.fax}</span>}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      法人削除
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-hidden rounded border border-slate-100 bg-slate-50 text-xs text-neutral-800">
                    {supplier.branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="grid gap-2 px-3 py-2 sm:grid-cols-[1fr,1fr,auto] sm:items-center"
                      >
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-neutral-900">{branch.name}</div>
                          <div className="whitespace-nowrap">〒{branch.postalCode || "未登録"}</div>
                          <div className="whitespace-nowrap">{branch.address || ""}</div>
                        </div>
                        <div className="space-y-0.5 whitespace-nowrap text-neutral-700">
                          {branch.phone && <div>TEL {branch.phone}</div>}
                          {branch.fax && <div>FAX {branch.fax}</div>}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(supplier.id, branch.id)}
                            className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            支店削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderSection("buyerStaffs")}
        {renderSection("warehouses")}
      </div>
    </div>
  );
}
