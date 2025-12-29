"use client";

import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type CorporateFormState = {
  category: SupplierCategory;
  corporateName: string;
  corporateNameKana: string;
  corporateRepresentative: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  phone: string;
  fax: string;
  email: string;
  isHidden: boolean;
};

type BranchFormState = {
  corporateId: string;
  name: string;
  nameKana: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  representative: string;
  contactPerson: string;
  phone: string;
  fax: string;
  type: "hall" | "branch";
};

const createEmptyCorporateForm = (): CorporateFormState => ({
  category: "vendor",
  corporateName: "",
  corporateNameKana: "",
  corporateRepresentative: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  phone: "",
  fax: "",
  email: "",
  isHidden: false,
});

const createEmptyBranchForm = (): BranchFormState => ({
  corporateId: "",
  name: "",
  nameKana: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  representative: "",
  contactPerson: "",
  phone: "",
  fax: "",
  type: "branch",
});

  const buildAddress = (prefecture: string, city: string, addressLine: string) =>
    `${prefecture}${city}${addressLine}`.trim();

function InventorySettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [inputs, setInputs] = useState<InputState>(createEmptyInputs());
  const [corporateForm, setCorporateForm] = useState<CorporateFormState>(createEmptyCorporateForm());
  const [branchForm, setBranchForm] = useState<BranchFormState>(createEmptyBranchForm());
  const [editingCorporateId, setEditingCorporateId] = useState<string | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchCorporateId, setEditingBranchCorporateId] = useState<string | null>(null);
  const [corporateSearchInput, setCorporateSearchInput] = useState<string>("");
  const [corporateSearchTerm, setCorporateSearchTerm] = useState<string>("");
  const [branchSearchInput, setBranchSearchInput] = useState<string>("");
  const [branchSearchTerm, setBranchSearchTerm] = useState<string>("");
  const [corporateFilterInput, setCorporateFilterInput] = useState<string>("");
  const [lastAutoFilledPostal, setLastAutoFilledPostal] = useState<string>("");
  const postalLookupRef = useRef<AbortController | null>(null);
  const focusMap = useRef<Map<string, HTMLElement>>(new Map());

  const corporateFieldOrder = [
    "corporate-category",
    "corporate-name",
    "corporate-nameKana",
    "corporate-postalCode",
    "corporate-prefecture",
    "corporate-city",
    "corporate-addressLine",
    "corporate-representative",
    "corporate-phone",
    "corporate-fax",
    "corporate-email",
  ];

  const branchFieldOrder = [
    "branch-corporateId",
    "branch-name",
    "branch-nameKana",
    "branch-postalCode",
    "branch-prefecture",
    "branch-city",
    "branch-addressLine",
    "branch-representative",
    "branch-contactPerson",
    "branch-phone",
    "branch-fax",
    "branch-type",
  ];

  const mode = useMemo(() => {
    const value = searchParams?.get("mode");
    return value === "company" ? "company" : "customer";
  }, [searchParams]);

  const tab = useMemo(() => {
    const value = searchParams?.get("tab");
    return value === "branch" ? "branch" : "corp";
  }, [searchParams]);

  useEffect(() => {
    const loaded = loadMasterData();
    setMasterData(loaded);
    const firstCorporateId = loaded.suppliers[0]?.id ?? "";
    setBranchForm((prev) => ({
      ...prev,
      corporateId: prev.corporateId || firstCorporateId,
    }));
  }, []);

  useEffect(() => {
    const normalized = corporateForm.postalCode.replace(/\D/g, "");
    if (normalized.length < 7) return;

    const timer = window.setTimeout(async () => {
      postalLookupRef.current?.abort();
      const controller = new AbortController();
      postalLookupRef.current = controller;
      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalized}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          results?: { address1: string; address2: string; address3: string }[];
        };
        const result = data.results?.[0];
        if (!result) return;
        const nextCity = `${result.address2}${result.address3}`.trim();
        setCorporateForm((prev) => {
          const shouldOverwrite = !prev.prefecture && !prev.city;
          if (!shouldOverwrite && lastAutoFilledPostal !== normalized) return prev;
          return {
            ...prev,
            prefecture: prev.prefecture || result.address1,
            city: prev.city || nextCity,
          };
        });
        setLastAutoFilledPostal(normalized);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [corporateForm.postalCode, lastAutoFilledPostal]);

  const updateStorage = (next: MasterData) => {
    setMasterData(next);
    saveMasterData(next);
  };

  const registerFocus = (key: string) => (element: HTMLElement | null) => {
    if (!element) {
      focusMap.current.delete(key);
      return;
    }
    focusMap.current.set(key, element);
  };

  const focusTo = (key: string) => {
    const target = focusMap.current.get(key);
    if (!target) return;
    target.focus();
    if (target instanceof HTMLInputElement) {
      target.select();
    }
  };

  const handleEnterNext = (event: React.KeyboardEvent<HTMLElement>, order: string[], currentKey: string) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const currentIndex = order.indexOf(currentKey);
    if (currentIndex === -1) return;
    const nextKey = order[currentIndex + 1];
    if (!nextKey) return;
    focusTo(nextKey);
  };

  const updateQuery = (nextMode: "customer" | "company", nextTab?: "corp" | "branch") => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("mode", nextMode);
    if (nextTab) {
      params.set("tab", nextTab);
    }
    router.replace(`?${params.toString()}`);
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

  const handleCorporateFormChange = <K extends keyof CorporateFormState>(
    key: K,
    value: CorporateFormState[K],
  ) => {
    setCorporateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBranchFormChange = <K extends keyof BranchFormState>(key: K, value: BranchFormState[K]) => {
    setBranchForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetCorporateForm = () => {
    setCorporateForm(createEmptyCorporateForm());
    setEditingCorporateId(null);
  };

  const resetBranchForm = () => {
    setBranchForm((prev) => ({
      ...createEmptyBranchForm(),
      corporateId: prev.corporateId,
    }));
    setEditingBranchId(null);
    setEditingBranchCorporateId(null);
  };

  const handleCorporateSubmit = () => {
    const corporateName = corporateForm.corporateName.trim();
    if (!corporateName) return;

    const address = buildAddress(
      corporateForm.prefecture.trim(),
      corporateForm.city.trim(),
      corporateForm.addressLine.trim(),
    );
    if (editingCorporateId) {
      const nextSuppliers = masterData.suppliers.map((supplier) => {
        if (supplier.id !== editingCorporateId) return supplier;
        return {
          ...supplier,
          category: corporateForm.category,
          corporateName,
          corporateNameKana: corporateForm.corporateNameKana.trim(),
          corporateRepresentative: corporateForm.corporateRepresentative.trim(),
          postalCode: corporateForm.postalCode.trim(),
          prefecture: corporateForm.prefecture.trim(),
          city: corporateForm.city.trim(),
          addressLine: corporateForm.addressLine.trim(),
          address,
          phone: corporateForm.phone.trim(),
          fax: corporateForm.fax.trim(),
          email: corporateForm.email.trim(),
          isHidden: corporateForm.isHidden,
        } satisfies SupplierCorporate;
      });
      updateStorage({ ...masterData, suppliers: nextSuppliers });
    } else {
      const nextCorporate: SupplierCorporate = {
        id: createMasterId("supplier"),
        category: corporateForm.category,
        corporateName,
        corporateNameKana: corporateForm.corporateNameKana.trim(),
        corporateRepresentative: corporateForm.corporateRepresentative.trim(),
        postalCode: corporateForm.postalCode.trim(),
        prefecture: corporateForm.prefecture.trim(),
        city: corporateForm.city.trim(),
        addressLine: corporateForm.addressLine.trim(),
        address,
        phone: corporateForm.phone.trim(),
        fax: corporateForm.fax.trim(),
        email: corporateForm.email.trim(),
        isHidden: corporateForm.isHidden,
        branches: [],
      };
      updateStorage({ ...masterData, suppliers: [...masterData.suppliers, nextCorporate] });
      setBranchForm((prev) => ({
        ...prev,
        corporateId: prev.corporateId || nextCorporate.id,
      }));
    }

    resetCorporateForm();
  };

  const handleCorporateEdit = (supplier: SupplierCorporate) => {
    setCorporateForm({
      category: supplier.category,
      corporateName: supplier.corporateName,
      corporateNameKana: supplier.corporateNameKana ?? "",
      corporateRepresentative: supplier.corporateRepresentative ?? "",
      postalCode: supplier.postalCode ?? "",
      prefecture: supplier.prefecture ?? "",
      city: supplier.city ?? supplier.address ?? "",
      addressLine: supplier.addressLine ?? "",
      phone: supplier.phone ?? "",
      fax: supplier.fax ?? "",
      email: supplier.email ?? "",
      isHidden: supplier.isHidden ?? false,
    });
    setEditingCorporateId(supplier.id);
  };

  const handleCorporateDelete = (supplierId: string) => {
    updateStorage({
      ...masterData,
      suppliers: masterData.suppliers.filter((supplier) => supplier.id !== supplierId),
    });
    if (editingCorporateId === supplierId) {
      resetCorporateForm();
    }
    if (branchForm.corporateId === supplierId) {
      setBranchForm((prev) => ({ ...prev, corporateId: "" }));
    }
  };

  const handleBranchSubmit = () => {
    if (!branchForm.corporateId) return;
    const name = branchForm.name.trim();
    if (!name) return;

    const address = buildAddress(
      branchForm.prefecture.trim(),
      branchForm.city.trim(),
      branchForm.addressLine.trim(),
    );
    const nextBranch: SupplierBranch = {
      id: editingBranchId ?? createMasterId("branch"),
      name,
      nameKana: branchForm.nameKana.trim(),
      postalCode: branchForm.postalCode.trim(),
      prefecture: branchForm.prefecture.trim(),
      city: branchForm.city.trim(),
      addressLine: branchForm.addressLine.trim(),
      address,
      representative: branchForm.representative.trim(),
      contactPerson: branchForm.contactPerson.trim(),
      phone: branchForm.phone.trim(),
      fax: branchForm.fax.trim(),
      type: branchForm.type,
    };

    let nextSuppliers = [...masterData.suppliers];

    if (editingBranchId && editingBranchCorporateId) {
      nextSuppliers = nextSuppliers.map((supplier) => {
        if (supplier.id === editingBranchCorporateId) {
          return {
            ...supplier,
            branches: supplier.branches.filter((branch) => branch.id !== editingBranchId),
          };
        }
        return supplier;
      });
    }

    nextSuppliers = nextSuppliers.map((supplier) => {
      if (supplier.id !== branchForm.corporateId) return supplier;
      const hasExisting = supplier.branches.some((branch) => branch.id === nextBranch.id);
      return {
        ...supplier,
        branches: hasExisting
          ? supplier.branches.map((branch) => (branch.id === nextBranch.id ? nextBranch : branch))
          : [...supplier.branches, nextBranch],
      };
    });

    updateStorage({ ...masterData, suppliers: nextSuppliers });
    resetBranchForm();
  };

  const handleBranchEdit = (supplier: SupplierCorporate, branch: SupplierBranch) => {
    setBranchForm({
      corporateId: supplier.id,
      name: branch.name,
      nameKana: branch.nameKana ?? "",
      postalCode: branch.postalCode ?? "",
      prefecture: branch.prefecture ?? "",
      city: branch.city ?? branch.address ?? "",
      addressLine: branch.addressLine ?? "",
      representative: branch.representative ?? "",
      contactPerson: branch.contactPerson ?? "",
      phone: branch.phone ?? "",
      fax: branch.fax ?? "",
      type: branch.type ?? "branch",
    });
    setEditingBranchId(branch.id);
    setEditingBranchCorporateId(supplier.id);
  };

  const handleBranchDelete = (supplierId: string, branchId: string) => {
    const nextSuppliers = masterData.suppliers.map((supplier) => {
      if (supplier.id !== supplierId) return supplier;
      return { ...supplier, branches: supplier.branches.filter((branch) => branch.id !== branchId) };
    });
    updateStorage({ ...masterData, suppliers: nextSuppliers });
    if (editingBranchId === branchId) {
      resetBranchForm();
    }
  };

  const corporateFilter = corporateSearchTerm.trim().toLowerCase();
  const filteredCorporates = masterData.suppliers.filter((supplier) => {
    if (!corporateFilter) return true;
    const fields = [
      supplier.corporateName,
      supplier.corporateNameKana ?? "",
      supplier.corporateRepresentative ?? "",
      supplier.postalCode ?? "",
      supplier.prefecture ?? "",
      supplier.city ?? "",
      supplier.addressLine ?? "",
      supplier.address ?? "",
      supplier.phone ?? "",
      supplier.fax ?? "",
      supplier.email ?? "",
    ];
    return fields.some((field) => field.toLowerCase().includes(corporateFilter));
  });

  const branchFilter = branchSearchTerm.trim().toLowerCase();
  const filteredBranches = masterData.suppliers.flatMap((supplier) =>
    supplier.branches
      .filter((branch) => {
        if (!branchFilter) return true;
        const fields = [
          supplier.corporateName,
          branch.name,
          branch.nameKana ?? "",
          branch.postalCode ?? "",
          branch.prefecture ?? "",
          branch.city ?? "",
          branch.addressLine ?? "",
          branch.address ?? "",
          branch.phone ?? "",
          branch.fax ?? "",
        ];
        return fields.some((field) => field.toLowerCase().includes(branchFilter));
      })
      .map((branch) => ({ supplier, branch })),
  );

  const corporateSelectFilter = corporateFilterInput.trim().toLowerCase();
  const corporateOptions = masterData.suppliers.filter((supplier) => {
    if (!corporateSelectFilter) return true;
    return supplier.corporateName.toLowerCase().includes(corporateSelectFilter);
  });

  const sectionHeader = "bg-gray-200 px-3 py-2 text-sm font-semibold text-slate-800";
  const tableHeader = "border border-gray-400 bg-green-600 px-2 py-1 text-xs font-bold text-white";
  const tableCell = "border border-gray-400 px-2 py-1 text-sm";
  const inputBase =
    "w-full border border-gray-400 bg-white px-2 py-1 text-sm focus:border-gray-700 focus:outline-none";
  const buttonBase =
    "rounded-none border border-slate-600 bg-yellow-300 px-4 py-1 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] transition hover:bg-yellow-200";
  const secondaryButton =
    "rounded-none border border-slate-500 bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 shadow-[inset_1px_1px_0px_0px_#ffffff] transition hover:bg-slate-100";

  const renderSection = (key: SimpleMasterKey) => (
    <section key={key} className="border border-gray-400 bg-white">
      <div className={sectionHeader}>{LABELS[key]}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-400 px-3 py-2">
        <input
          value={inputs[key]}
          onChange={(event) => handleInputChange(key, event.target.value)}
          placeholder="新しい項目を入力"
          className={`${inputBase} w-56`}
        />
        <button type="button" onClick={() => handleAdd(key)} className={secondaryButton}>
          追加
        </button>
      </div>
      {masterData[key].length === 0 ? (
        <p className="px-3 py-4 text-sm text-slate-600">まだ登録がありません。</p>
      ) : (
        <ul className="divide-y divide-gray-300">
          {masterData[key].map((item) => (
            <li key={item} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="truncate" title={item}>
                {item}
              </span>
              <button type="button" onClick={() => handleDelete(key, item)} className={secondaryButton}>
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
      <section className="border border-gray-400 bg-white">
        <div className="border-b border-gray-400 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => updateQuery("customer", tab)}
              className={`rounded-none border border-gray-500 px-6 py-2 text-sm font-semibold transition ${
                mode === "customer" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
              }`}
            >
              取引先管理
            </button>
            <button
              type="button"
              onClick={() => updateQuery("company", tab)}
              className={`rounded-none border border-gray-500 px-6 py-2 text-sm font-semibold transition ${
                mode === "company" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
              }`}
            >
              自社設定
            </button>
          </div>
        </div>

        {mode === "customer" ? (
          <div className="space-y-4 p-4">
            <div className="border border-gray-400 bg-white">
              <div className="flex flex-wrap gap-2 border-b border-gray-400 bg-gray-200 px-3 py-3">
                <button
                  type="button"
                  onClick={() => updateQuery("customer", "corp")}
                  className={`rounded-none border border-gray-500 px-4 py-2 text-sm font-semibold transition ${
                    tab === "corp" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  法人設定
                </button>
                <button
                  type="button"
                  onClick={() => updateQuery("customer", "branch")}
                  className={`rounded-none border border-gray-500 px-4 py-2 text-sm font-semibold transition ${
                    tab === "branch" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  ホール・支店設定
                </button>
              </div>
            </div>

            {tab === "corp" ? (
              <section className="space-y-4">
                <div className="border border-gray-400 bg-white">
                  <div className={sectionHeader}>法人設定（取引先）</div>
                  <div className="border-t border-gray-400">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        <tr>
                          <th className={tableHeader}>区分</th>
                          <td className={tableCell}>
                            <select
                              value={corporateForm.category}
                              onChange={(event) =>
                                handleCorporateFormChange("category", event.target.value as SupplierCategory)
                              }
                              onKeyDown={(event) =>
                                handleEnterNext(event, corporateFieldOrder, "corporate-category")
                              }
                              ref={registerFocus("corporate-category")}
                              className={inputBase}
                            >
                              <option value="vendor">業者</option>
                              <option value="hall">ホール</option>
                            </select>
                          </td>
                          <th className={tableHeader}>非表示</th>
                          <td className={tableCell}>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={corporateForm.isHidden}
                                onChange={(event) => handleCorporateFormChange("isHidden", event.target.checked)}
                                className="h-4 w-4 border border-gray-500"
                              />
                              <span className="text-xs text-slate-700">一覧から隠す</span>
                            </label>
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>取引先名</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.corporateName}
                              onChange={(event) => handleCorporateFormChange("corporateName", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-name")}
                              ref={registerFocus("corporate-name")}
                              className={inputBase}
                              placeholder="例: サンプル商事"
                            />
                          </td>
                          <th className={tableHeader}>取引先名カナ</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.corporateNameKana}
                              onChange={(event) => handleCorporateFormChange("corporateNameKana", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-nameKana")}
                              ref={registerFocus("corporate-nameKana")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>郵便番号</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.postalCode}
                              onChange={(event) => handleCorporateFormChange("postalCode", event.target.value)}
                              onKeyDown={(event) =>
                                handleEnterNext(event, corporateFieldOrder, "corporate-postalCode")
                              }
                              ref={registerFocus("corporate-postalCode")}
                              className={inputBase}
                              placeholder="例: 123-4567"
                            />
                          </td>
                          <th className={tableHeader}>都道府県</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.prefecture}
                              onChange={(event) => handleCorporateFormChange("prefecture", event.target.value)}
                              onKeyDown={(event) =>
                                handleEnterNext(event, corporateFieldOrder, "corporate-prefecture")
                              }
                              ref={registerFocus("corporate-prefecture")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>市区町村（住所）</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.city}
                              onChange={(event) => handleCorporateFormChange("city", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-city")}
                              ref={registerFocus("corporate-city")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>番地・建物名</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.addressLine}
                              onChange={(event) => handleCorporateFormChange("addressLine", event.target.value)}
                              onKeyDown={(event) =>
                                handleEnterNext(event, corporateFieldOrder, "corporate-addressLine")
                              }
                              ref={registerFocus("corporate-addressLine")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>代表者</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.corporateRepresentative}
                              onChange={(event) =>
                                handleCorporateFormChange("corporateRepresentative", event.target.value)
                              }
                              onKeyDown={(event) =>
                                handleEnterNext(event, corporateFieldOrder, "corporate-representative")
                              }
                              ref={registerFocus("corporate-representative")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>電話番号</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.phone}
                              onChange={(event) => handleCorporateFormChange("phone", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-phone")}
                              ref={registerFocus("corporate-phone")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>FAX番号</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.fax}
                              onChange={(event) => handleCorporateFormChange("fax", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-fax")}
                              ref={registerFocus("corporate-fax")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>mailアドレス</th>
                          <td className={tableCell}>
                            <input
                              value={corporateForm.email}
                              onChange={(event) => handleCorporateFormChange("email", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-email")}
                              ref={registerFocus("corporate-email")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-2 border-t border-gray-400 px-3 py-2">
                      {editingCorporateId && (
                        <button type="button" onClick={resetCorporateForm} className={secondaryButton}>
                          新規入力へ戻す
                        </button>
                      )}
                      <button type="button" onClick={handleCorporateSubmit} className={buttonBase}>
                        {editingCorporateId ? "更新" : "登録"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-400 bg-white">
                  <div className={sectionHeader}>登録済み法人一覧</div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-400 px-3 py-2 text-sm">
                    <span>件数: {filteredCorporates.length}</span>
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-slate-700">あいまい検索</span>
                      <input
                        value={corporateSearchInput}
                        onChange={(event) => setCorporateSearchInput(event.target.value)}
                        className="w-48 border border-gray-400 px-2 py-1 text-sm"
                        placeholder="法人名・電話など"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCorporateSearchTerm(corporateSearchInput)}
                      className={secondaryButton}
                    >
                      検索する
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className={tableHeader}>取引先名</th>
                          <th className={tableHeader}>カナ</th>
                          <th className={tableHeader}>区分</th>
                          <th className={tableHeader}>郵便番号</th>
                          <th className={tableHeader}>都道府県</th>
                          <th className={tableHeader}>市区町村</th>
                          <th className={tableHeader}>代表者</th>
                          <th className={tableHeader}>電話番号</th>
                          <th className={tableHeader}>FAX番号</th>
                          <th className={tableHeader}>mail</th>
                          <th className={tableHeader}>非表示</th>
                          <th className={tableHeader}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCorporates.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="border border-gray-400 px-3 py-4 text-center text-sm">
                              該当する法人がありません。
                            </td>
                          </tr>
                        ) : (
                          filteredCorporates.map((supplier) => (
                            <tr key={supplier.id} className="odd:bg-white even:bg-slate-50">
                              <td className={tableCell}>{supplier.corporateName}</td>
                              <td className={tableCell}>{supplier.corporateNameKana || "-"}</td>
                              <td className={tableCell}>{supplier.category === "hall" ? "ホール" : "業者"}</td>
                              <td className={tableCell}>{supplier.postalCode || "-"}</td>
                              <td className={tableCell}>{supplier.prefecture || "-"}</td>
                              <td className={tableCell}>
                                {supplier.city || supplier.addressLine
                                  ? `${supplier.city ?? ""}${supplier.addressLine ?? ""}`
                                  : supplier.address || "-"}
                              </td>
                              <td className={tableCell}>{supplier.corporateRepresentative || "-"}</td>
                              <td className={tableCell}>{supplier.phone || "-"}</td>
                              <td className={tableCell}>{supplier.fax || "-"}</td>
                              <td className={tableCell}>{supplier.email || "-"}</td>
                              <td className={tableCell}>{supplier.isHidden ? "非表示" : "表示"}</td>
                              <td className={`${tableCell} whitespace-nowrap`}>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCorporateEdit(supplier)}
                                    className={secondaryButton}
                                  >
                                    編集
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCorporateDelete(supplier.id)}
                                    className="rounded-none border border-red-400 bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                                  >
                                    削除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-4">
                <div className="border border-gray-400 bg-white">
                  <div className={sectionHeader}>ホール・支店設定</div>
                  <div className="border-t border-gray-400">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        <tr>
                          <th className={tableHeader}>法人名検索</th>
                          <td className={tableCell}>
                            <input
                              value={corporateFilterInput}
                              onChange={(event) => setCorporateFilterInput(event.target.value)}
                              className={inputBase}
                              placeholder="法人名で絞り込み"
                            />
                          </td>
                          <th className={tableHeader}>法人名</th>
                          <td className={tableCell}>
                            <select
                              value={branchForm.corporateId}
                              onChange={(event) => handleBranchFormChange("corporateId", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-corporateId")}
                              ref={registerFocus("branch-corporateId")}
                              className={inputBase}
                            >
                              <option value="">法人を選択</option>
                              {corporateOptions.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.corporateName}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>支店・ホール名</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.name}
                              onChange={(event) => handleBranchFormChange("name", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-name")}
                              ref={registerFocus("branch-name")}
                              className={inputBase}
                              placeholder="例: 本店"
                            />
                          </td>
                          <th className={tableHeader}>支店・ホール名カナ</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.nameKana}
                              onChange={(event) => handleBranchFormChange("nameKana", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-nameKana")}
                              ref={registerFocus("branch-nameKana")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>郵便番号</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.postalCode}
                              onChange={(event) => handleBranchFormChange("postalCode", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-postalCode")}
                              ref={registerFocus("branch-postalCode")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>都道府県</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.prefecture}
                              onChange={(event) => handleBranchFormChange("prefecture", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-prefecture")}
                              ref={registerFocus("branch-prefecture")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>市区町村（住所）</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.city}
                              onChange={(event) => handleBranchFormChange("city", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-city")}
                              ref={registerFocus("branch-city")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>番地・建物名</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.addressLine}
                              onChange={(event) => handleBranchFormChange("addressLine", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-addressLine")}
                              ref={registerFocus("branch-addressLine")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>代表者</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.representative}
                              onChange={(event) => handleBranchFormChange("representative", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-representative")}
                              ref={registerFocus("branch-representative")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>担当者</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.contactPerson}
                              onChange={(event) => handleBranchFormChange("contactPerson", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-contactPerson")}
                              ref={registerFocus("branch-contactPerson")}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={tableHeader}>電話番号</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.phone}
                              onChange={(event) => handleBranchFormChange("phone", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-phone")}
                              ref={registerFocus("branch-phone")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>FAX番号</th>
                          <td className={tableCell}>
                            <input
                              value={branchForm.fax}
                              onChange={(event) => handleBranchFormChange("fax", event.target.value)}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-fax")}
                              ref={registerFocus("branch-fax")}
                              className={inputBase}
                            />
                          </td>
                          <th className={tableHeader}>種別</th>
                          <td className={tableCell}>
                            <select
                              value={branchForm.type}
                              onChange={(event) => handleBranchFormChange("type", event.target.value as "hall" | "branch")}
                              onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-type")}
                              ref={registerFocus("branch-type")}
                              className={inputBase}
                            >
                              <option value="hall">ホール</option>
                              <option value="branch">支店</option>
                            </select>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-2 border-t border-gray-400 px-3 py-2">
                      {editingBranchId && (
                        <button type="button" onClick={resetBranchForm} className={secondaryButton}>
                          新規入力へ戻す
                        </button>
                      )}
                      <button type="button" onClick={handleBranchSubmit} className={buttonBase}>
                        {editingBranchId ? "更新" : "登録"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-400 bg-white">
                  <div className={sectionHeader}>登録済みホール・支店一覧</div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-400 px-3 py-2 text-sm">
                    <span>件数: {filteredBranches.length}</span>
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-slate-700">あいまい検索</span>
                      <input
                        value={branchSearchInput}
                        onChange={(event) => setBranchSearchInput(event.target.value)}
                        className="w-48 border border-gray-400 px-2 py-1 text-sm"
                        placeholder="ホール名・電話など"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setBranchSearchTerm(branchSearchInput)}
                      className={secondaryButton}
                    >
                      検索する
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className={tableHeader}>法人名</th>
                          <th className={tableHeader}>支店・ホール名</th>
                          <th className={tableHeader}>カナ</th>
                          <th className={tableHeader}>種別</th>
                          <th className={tableHeader}>郵便番号</th>
                          <th className={tableHeader}>都道府県</th>
                          <th className={tableHeader}>市区町村</th>
                          <th className={tableHeader}>代表者</th>
                          <th className={tableHeader}>担当者</th>
                          <th className={tableHeader}>電話番号</th>
                          <th className={tableHeader}>FAX番号</th>
                          <th className={tableHeader}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBranches.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="border border-gray-400 px-3 py-4 text-center text-sm">
                              該当するホール・支店がありません。
                            </td>
                          </tr>
                        ) : (
                          filteredBranches.map(({ supplier, branch }) => (
                            <tr key={branch.id} className="odd:bg-white even:bg-slate-50">
                              <td className={tableCell}>{supplier.corporateName}</td>
                              <td className={tableCell}>{branch.name}</td>
                              <td className={tableCell}>{branch.nameKana || "-"}</td>
                              <td className={tableCell}>{branch.type === "hall" ? "ホール" : "支店"}</td>
                              <td className={tableCell}>{branch.postalCode || "-"}</td>
                              <td className={tableCell}>{branch.prefecture || "-"}</td>
                              <td className={tableCell}>
                                {branch.city || branch.addressLine
                                  ? `${branch.city ?? ""}${branch.addressLine ?? ""}`
                                  : branch.address || "-"}
                              </td>
                              <td className={tableCell}>{branch.representative || "-"}</td>
                              <td className={tableCell}>{branch.contactPerson || "-"}</td>
                              <td className={tableCell}>{branch.phone || "-"}</td>
                              <td className={tableCell}>{branch.fax || "-"}</td>
                              <td className={`${tableCell} whitespace-nowrap`}>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleBranchEdit(supplier, branch)}
                                    className={secondaryButton}
                                  >
                                    編集
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleBranchDelete(supplier.id, branch.id)}
                                    className="rounded-none border border-red-400 bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                                  >
                                    削除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

          </div>
        ) : (
          <div className="space-y-3 p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {["法人情報", "ホール・支店設定", "担当者設定", "倉庫設定"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-none border border-gray-500 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="border border-gray-400 bg-gray-50 px-4 py-4 text-center text-sm text-gray-600">
              準備中
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {renderSection("buyerStaffs")}
              {renderSection("warehouses")}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function InventorySettingsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-600">読み込み中...</div>}>
      <InventorySettingsContent />
    </Suspense>
  );
}
