"use client";

import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_MASTER_DATA,
  createMasterId,
  loadMasterData,
  saveMasterData,
  type CompanyBranch,
  type CompanyProfile,
  type CompanyStaff,
  type MasterData,
  type SupplierBranch,
  type SupplierCategory,
  type SupplierCorporate,
} from "@/lib/demo-data/demoMasterData";

const buildAddress = (prefecture: string, city: string, addressLine: string) =>
  `${prefecture}${city}${addressLine}`.trim();

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

type CompanyBranchFormState = {
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine2: string;
  phone: string;
  fax: string;
  manager: string;
  note: string;
};

type CompanyStaffFormState = {
  branchId: string;
  name: string;
};

type ConfirmRow = {
  label: string;
  value: string;
};

type ConfirmModalState = {
  title: string;
  rows: ConfirmRow[];
  actionLabel: string;
  completeMessage: string;
  onConfirm: () => void;
  stage: "confirm" | "complete";
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

const createEmptyCompanyBranchForm = (): CompanyBranchFormState => ({
  name: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine2: "",
  phone: "",
  fax: "",
  manager: "",
  note: "",
});

const createEmptyCompanyStaffForm = (): CompanyStaffFormState => ({
  branchId: "",
  name: "",
});

const buildCompanyAddressLine = (profile: Pick<CompanyProfile, "addressLine2" | "addressLine">) =>
  profile.addressLine2?.trim() || profile.addressLine?.trim() || "";

const syncBuyerStaffs = (existing: string[], staffs: CompanyStaff[]) => {
  const next = new Set(existing.map((name) => name.trim()).filter(Boolean));
  staffs.forEach((staff) => {
    const name = staff.name.trim();
    if (name) next.add(name);
  });
  return Array.from(next);
};

function InventorySettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
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
  const [companyTab, setCompanyTab] = useState<"profile" | "branches" | "staffs" | "warehouses">("profile");
  const [companyProfileForm, setCompanyProfileForm] = useState<CompanyProfile>(DEFAULT_MASTER_DATA.companyProfile);
  const [isCompanyProfileEditing, setIsCompanyProfileEditing] = useState(false);
  const [companyBranchForm, setCompanyBranchForm] = useState<CompanyBranchFormState>(createEmptyCompanyBranchForm());
  const [editingCompanyBranchId, setEditingCompanyBranchId] = useState<string | null>(null);
  const [companyStaffForm, setCompanyStaffForm] = useState<CompanyStaffFormState>(createEmptyCompanyStaffForm());
  const [editingCompanyStaffId, setEditingCompanyStaffId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
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
    if (value === "self" || value === "company") return "self";
    return "customer";
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
    setCompanyProfileForm({
      ...loaded.companyProfile,
      addressLine2: buildCompanyAddressLine(loaded.companyProfile),
    });
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

  const updateQuery = (nextTab?: "corp" | "branch") => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("mode", "customer");
    if (nextTab) {
      params.set("tab", nextTab);
    }
    router.replace(`?${params.toString()}`);
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

  const handleCompanyProfileFormChange = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setCompanyProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanyBranchFormChange = <K extends keyof CompanyBranchFormState>(
    key: K,
    value: CompanyBranchFormState[K],
  ) => {
    setCompanyBranchForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanyStaffFormChange = <K extends keyof CompanyStaffFormState>(
    key: K,
    value: CompanyStaffFormState[K],
  ) => {
    setCompanyStaffForm((prev) => ({ ...prev, [key]: value }));
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

  const resetCompanyProfileForm = () => {
    setCompanyProfileForm({
      ...masterData.companyProfile,
      addressLine2: buildCompanyAddressLine(masterData.companyProfile),
    });
    setIsCompanyProfileEditing(false);
  };

  const resetCompanyBranchForm = () => {
    setCompanyBranchForm(createEmptyCompanyBranchForm());
    setEditingCompanyBranchId(null);
  };

  const resetCompanyStaffForm = () => {
    setCompanyStaffForm(createEmptyCompanyStaffForm());
    setEditingCompanyStaffId(null);
  };

  const openConfirmModal = (state: Omit<ConfirmModalState, "stage">) => {
    setConfirmModal({ ...state, stage: "confirm" });
  };

  const handleConfirmModalClose = () => {
    setConfirmModal(null);
  };

  const handleConfirmModalAction = () => {
    if (!confirmModal) return;
    confirmModal.onConfirm();
    setConfirmModal((prev) => (prev ? { ...prev, stage: "complete" } : prev));
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

    const address = buildAddress(branchForm.prefecture.trim(), branchForm.city.trim(), branchForm.addressLine.trim());
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

  const handleCompanyProfileEdit = () => {
    setCompanyProfileForm({
      ...masterData.companyProfile,
      addressLine2: buildCompanyAddressLine(masterData.companyProfile),
    });
    setIsCompanyProfileEditing(true);
  };

  const handleCompanyProfileSave = () => {
    const normalized: CompanyProfile = {
      corporateName: companyProfileForm.corporateName.trim(),
      postalCode: companyProfileForm.postalCode.trim(),
      prefecture: companyProfileForm.prefecture.trim(),
      city: companyProfileForm.city.trim(),
      addressLine: companyProfileForm.addressLine2?.trim() ?? "",
      addressLine2: companyProfileForm.addressLine2?.trim() ?? "",
      phone: companyProfileForm.phone.trim(),
      fax: companyProfileForm.fax.trim(),
      title: companyProfileForm.title.trim(),
      representative: companyProfileForm.representative.trim(),
      note: companyProfileForm.note.trim(),
    };

    openConfirmModal({
      title: "法人情報 確認",
      rows: [
        { label: "管理者法人名", value: normalized.corporateName || "-" },
        { label: "郵便番号", value: normalized.postalCode || "-" },
        { label: "都道府県", value: normalized.prefecture || "-" },
        { label: "市区町村", value: normalized.city || "-" },
        { label: "番地・ビル名", value: normalized.addressLine2 || "-" },
        { label: "電話番号", value: normalized.phone || "-" },
        { label: "FAX番号", value: normalized.fax || "-" },
        { label: "役職", value: normalized.title || "-" },
        { label: "代表名", value: normalized.representative || "-" },
        { label: "備考", value: normalized.note || "-" },
      ],
      actionLabel: masterData.companyProfile.corporateName ? "更新" : "登録",
      completeMessage: "法人情報の登録が完了しました。",
      onConfirm: () => {
        updateStorage({ ...masterData, companyProfile: normalized });
        setIsCompanyProfileEditing(false);
      },
    });
  };

  const handleCompanyBranchSubmit = () => {
    const name = companyBranchForm.name.trim();
    if (!name) return;

    const normalized: CompanyBranch = {
      id: editingCompanyBranchId ?? createMasterId("company-branch"),
      name,
      postalCode: companyBranchForm.postalCode.trim(),
      prefecture: companyBranchForm.prefecture.trim(),
      city: companyBranchForm.city.trim(),
      addressLine: companyBranchForm.addressLine2.trim(),
      addressLine2: companyBranchForm.addressLine2.trim(),
      phone: companyBranchForm.phone.trim(),
      fax: companyBranchForm.fax.trim(),
      manager: companyBranchForm.manager.trim(),
      note: companyBranchForm.note.trim(),
    };

    const nextBranches = editingCompanyBranchId
      ? masterData.companyBranches.map((branch) => (branch.id === editingCompanyBranchId ? normalized : branch))
      : [...masterData.companyBranches, normalized];

    openConfirmModal({
      title: editingCompanyBranchId ? "ホール・支店更新 確認" : "ホール・支店登録 確認",
      rows: [
        { label: "管理者法人名", value: masterData.companyProfile.corporateName || "-" },
        { label: "管理者支店名", value: normalized.name || "-" },
        { label: "郵便番号", value: normalized.postalCode || "-" },
        { label: "都道府県", value: normalized.prefecture || "-" },
        { label: "市区町村", value: normalized.city || "-" },
        { label: "番地・ビル名", value: normalized.addressLine2 || "-" },
        { label: "電話番号", value: normalized.phone || "-" },
        { label: "FAX番号", value: normalized.fax || "-" },
        { label: "責任者", value: normalized.manager || "-" },
        { label: "備考", value: normalized.note || "-" },
      ],
      actionLabel: editingCompanyBranchId ? "更新" : "登録",
      completeMessage: editingCompanyBranchId ? "支店情報の更新が完了しました。" : "支店情報の登録が完了しました。",
      onConfirm: () => {
        updateStorage({ ...masterData, companyBranches: nextBranches });
        resetCompanyBranchForm();
      },
    });
  };

  const handleCompanyBranchEdit = (branch: CompanyBranch) => {
    setCompanyBranchForm({
      name: branch.name,
      postalCode: branch.postalCode ?? "",
      prefecture: branch.prefecture ?? "",
      city: branch.city ?? "",
      addressLine2: buildCompanyAddressLine(branch),
      phone: branch.phone ?? "",
      fax: branch.fax ?? "",
      manager: branch.manager ?? "",
      note: branch.note ?? "",
    });
    setEditingCompanyBranchId(branch.id);
  };

  const handleCompanyBranchDelete = (branchId: string) => {
    if (!window.confirm("この支店を削除しますか？")) return;
    const nextBranches = masterData.companyBranches.filter((branch) => branch.id !== branchId);
    const nextStaffs = masterData.companyStaffs.map((staff) =>
      staff.branchId === branchId ? { ...staff, branchId: "" } : staff,
    );
    updateStorage({
      ...masterData,
      companyBranches: nextBranches,
      companyStaffs: nextStaffs,
      buyerStaffs: syncBuyerStaffs(masterData.buyerStaffs, nextStaffs),
    });
    if (editingCompanyBranchId === branchId) {
      resetCompanyBranchForm();
    }
  };

  const handleCompanyStaffSubmit = () => {
    const name = companyStaffForm.name.trim();
    if (!name) return;

    const normalized: CompanyStaff = {
      id: editingCompanyStaffId ?? createMasterId("company-staff"),
      name,
      branchId: companyStaffForm.branchId || undefined,
    };

    const nextStaffs = editingCompanyStaffId
      ? masterData.companyStaffs.map((staff) => (staff.id === editingCompanyStaffId ? normalized : staff))
      : [...masterData.companyStaffs, normalized];

    const branchName = masterData.companyBranches.find((branch) => branch.id === normalized.branchId)?.name ?? "-";

    openConfirmModal({
      title: editingCompanyStaffId ? "担当者更新 確認" : "担当者登録 確認",
      rows: [
        { label: "法人名", value: masterData.companyProfile.corporateName || "-" },
        { label: "ホール・支店", value: branchName },
        { label: "名前", value: normalized.name || "-" },
      ],
      actionLabel: editingCompanyStaffId ? "更新" : "登録",
      completeMessage: editingCompanyStaffId ? "担当者情報の更新が完了しました。" : "担当者情報の登録が完了しました。",
      onConfirm: () => {
        updateStorage({
          ...masterData,
          companyStaffs: nextStaffs,
          buyerStaffs: syncBuyerStaffs(masterData.buyerStaffs, nextStaffs),
        });
        resetCompanyStaffForm();
      },
    });
  };

  const handleCompanyStaffEdit = (staff: CompanyStaff) => {
    setCompanyStaffForm({
      branchId: staff.branchId ?? "",
      name: staff.name,
    });
    setEditingCompanyStaffId(staff.id);
  };

  const handleCompanyStaffDelete = (staffId: string) => {
    if (!window.confirm("この担当者を削除しますか？")) return;
    const nextStaffs = masterData.companyStaffs.filter((staff) => staff.id !== staffId);
    updateStorage({
      ...masterData,
      companyStaffs: nextStaffs,
      buyerStaffs: syncBuyerStaffs(masterData.buyerStaffs, nextStaffs),
    });
    if (editingCompanyStaffId === staffId) {
      resetCompanyStaffForm();
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
    "rounded-none border border-slate-600 bg-yellow-300 px-4 py-1 text-sm font-semibold text-slate-800 transition hover:bg-yellow-200";
  const secondaryButton =
    "rounded-none border border-slate-500 bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100";
  const dangerButton =
    "rounded-none border border-red-400 bg-red-100 px-3 py-1 text-sm font-semibold text-red-700";
  const mutedText = "text-sm text-slate-600";
  const compactContainer = "max-w-[1200px] mx-auto w-full";

  const companyName = masterData.companyProfile.corporateName || "-";

  const renderConfirmModal = () => {
    if (!confirmModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
        <div className="w-full max-w-2xl border-2 border-gray-700 bg-white shadow-none">
          <div className="flex items-center justify-between border-b-2 border-gray-700 bg-gray-300 px-4 py-2">
            <h2 className="text-base font-bold text-black">{confirmModal.title}</h2>
            <button
              type="button"
              onClick={handleConfirmModalClose}
              className="border border-gray-600 bg-white px-2 py-1 text-sm font-semibold text-black"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            {confirmModal.stage === "confirm" ? (
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {confirmModal.rows.map((row) => (
                    <tr key={row.label}>
                      <th className="border border-gray-700 bg-gray-200 px-3 py-2 text-left text-sm font-semibold">
                        {row.label}
                      </th>
                      <td className="border border-gray-700 px-3 py-2 text-sm">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="border border-gray-700 bg-white px-4 py-6 text-center text-sm font-semibold">
                {confirmModal.completeMessage}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t-2 border-gray-700 bg-gray-100 px-4 py-3">
            {confirmModal.stage === "confirm" ? (
              <>
                <button type="button" onClick={handleConfirmModalClose} className={secondaryButton}>
                  キャンセル
                </button>
                <button type="button" onClick={handleConfirmModalAction} className={buttonBase}>
                  {confirmModal.actionLabel}
                </button>
              </>
            ) : (
              <button type="button" onClick={handleConfirmModalClose} className={buttonBase}>
                閉じる
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {mode === "customer" ? (
        <section className="border border-gray-400 bg-white">
          <div className="flex flex-wrap gap-2 border-b border-gray-400 bg-gray-200 px-3 py-3">
            <button
              type="button"
              onClick={() => updateQuery("corp")}
              className={`rounded-none border border-gray-500 px-4 py-2 text-sm font-semibold transition ${
                tab === "corp" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
              }`}
            >
              法人設定
            </button>
            <button
              type="button"
              onClick={() => updateQuery("branch")}
              className={`rounded-none border border-gray-500 px-4 py-2 text-sm font-semibold transition ${
                tab === "branch" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
              }`}
            >
              ホール・支店設定
            </button>
          </div>

          <div className="space-y-4 p-4">
            {tab === "corp" ? (
              <section className="space-y-4">
                <div className="border border-gray-400 bg-white">
                  <div className={sectionHeader}>法人設定（取引先）</div>
                  <div className="border-t border-gray-400">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <tbody>
                          <tr>
                            <th className={tableHeader}>区分</th>
                            <th className={tableHeader}>非表示</th>
                            <th className={tableHeader}>取引先名</th>
                            <th className={tableHeader}>取引先名カナ</th>
                            <th className={tableHeader}>郵便番号</th>
                            <th className={tableHeader}>都道府県</th>
                            <th className={tableHeader}>市区町村（住所）</th>
                            <th className={tableHeader}>番地・建物名</th>
                          </tr>
                          <tr>
                            <td className={tableCell}>
                              <select
                                value={corporateForm.category}
                                onChange={(event) =>
                                  handleCorporateFormChange("category", event.target.value as SupplierCategory)
                                }
                                onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-category")}
                                ref={registerFocus("corporate-category")}
                                className={inputBase}
                              >
                                <option value="vendor">業者</option>
                                <option value="hall">ホール</option>
                              </select>
                            </td>
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
                            <td className={tableCell}>
                              <input
                                value={corporateForm.corporateNameKana}
                                onChange={(event) => handleCorporateFormChange("corporateNameKana", event.target.value)}
                                onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-nameKana")}
                                ref={registerFocus("corporate-nameKana")}
                                className={inputBase}
                              />
                            </td>
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
                            <td className={tableCell}>
                              <input
                                value={corporateForm.city}
                                onChange={(event) => handleCorporateFormChange("city", event.target.value)}
                                onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-city")}
                                ref={registerFocus("corporate-city")}
                                className={inputBase}
                              />
                            </td>
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
                            <th className={tableHeader}>電話番号</th>
                            <th className={tableHeader}>FAX番号</th>
                            <th className={tableHeader}>mailアドレス</th>
                            <th className={tableHeader}>操作</th>
                          </tr>
                          <tr>
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
                            <td className={tableCell}>
                              <input
                                value={corporateForm.phone}
                                onChange={(event) => handleCorporateFormChange("phone", event.target.value)}
                                onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-phone")}
                                ref={registerFocus("corporate-phone")}
                                className={inputBase}
                              />
                            </td>
                            <td className={tableCell}>
                              <input
                                value={corporateForm.fax}
                                onChange={(event) => handleCorporateFormChange("fax", event.target.value)}
                                onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-fax")}
                                ref={registerFocus("corporate-fax")}
                                className={inputBase}
                              />
                            </td>
                            <td className={tableCell}>
                              <input
                                value={corporateForm.email}
                                onChange={(event) => handleCorporateFormChange("email", event.target.value)}
                                onKeyDown={(event) => handleEnterNext(event, corporateFieldOrder, "corporate-email")}
                                ref={registerFocus("corporate-email")}
                                className={inputBase}
                              />
                            </td>
                            <td className={`${tableCell} min-w-[160px]`}>
                              <div className="flex flex-col gap-1">
                                {editingCorporateId && (
                                  <button type="button" onClick={resetCorporateForm} className={secondaryButton}>
                                    新規入力へ戻す
                                  </button>
                                )}
                                <button type="button" onClick={handleCorporateSubmit} className={buttonBase}>
                                  {editingCorporateId ? "更新" : "登録"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
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
                                    className={dangerButton}
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
                    <div className="space-y-3 p-3">
                      <label className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs text-slate-700">法人名検索</span>
                        <input
                          value={corporateFilterInput}
                          onChange={(event) => setCorporateFilterInput(event.target.value)}
                          className="w-56 border border-gray-400 px-2 py-1 text-sm"
                          placeholder="法人名で絞り込み"
                        />
                      </label>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <tbody>
                            <tr>
                              <th className={tableHeader}>法人名</th>
                              <th className={tableHeader}>支店・ホール名</th>
                              <th className={tableHeader}>支店・ホール名カナ</th>
                              <th className={tableHeader}>郵便番号</th>
                              <th className={tableHeader}>都道府県</th>
                              <th className={tableHeader}>市区町村（住所）</th>
                              <th className={tableHeader}>番地・建物名</th>
                            </tr>
                            <tr>
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
                              <td className={tableCell}>
                                <input
                                  value={branchForm.nameKana}
                                  onChange={(event) => handleBranchFormChange("nameKana", event.target.value)}
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-nameKana")}
                                  ref={registerFocus("branch-nameKana")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.postalCode}
                                  onChange={(event) => handleBranchFormChange("postalCode", event.target.value)}
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-postalCode")}
                                  ref={registerFocus("branch-postalCode")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.prefecture}
                                  onChange={(event) => handleBranchFormChange("prefecture", event.target.value)}
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-prefecture")}
                                  ref={registerFocus("branch-prefecture")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.city}
                                  onChange={(event) => handleBranchFormChange("city", event.target.value)}
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-city")}
                                  ref={registerFocus("branch-city")}
                                  className={inputBase}
                                />
                              </td>
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
                              <th className={tableHeader}>担当者</th>
                              <th className={tableHeader}>電話番号</th>
                              <th className={tableHeader}>FAX番号</th>
                              <th className={tableHeader}>種別</th>
                              <th className={tableHeader}>操作</th>
                            </tr>
                            <tr>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.representative}
                                  onChange={(event) => handleBranchFormChange("representative", event.target.value)}
                                  onKeyDown={(event) =>
                                    handleEnterNext(event, branchFieldOrder, "branch-representative")
                                  }
                                  ref={registerFocus("branch-representative")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.contactPerson}
                                  onChange={(event) => handleBranchFormChange("contactPerson", event.target.value)}
                                  onKeyDown={(event) =>
                                    handleEnterNext(event, branchFieldOrder, "branch-contactPerson")
                                  }
                                  ref={registerFocus("branch-contactPerson")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.phone}
                                  onChange={(event) => handleBranchFormChange("phone", event.target.value)}
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-phone")}
                                  ref={registerFocus("branch-phone")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <input
                                  value={branchForm.fax}
                                  onChange={(event) => handleBranchFormChange("fax", event.target.value)}
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-fax")}
                                  ref={registerFocus("branch-fax")}
                                  className={inputBase}
                                />
                              </td>
                              <td className={tableCell}>
                                <select
                                  value={branchForm.type}
                                  onChange={(event) =>
                                    handleBranchFormChange("type", event.target.value as "hall" | "branch")
                                  }
                                  onKeyDown={(event) => handleEnterNext(event, branchFieldOrder, "branch-type")}
                                  ref={registerFocus("branch-type")}
                                  className={inputBase}
                                >
                                  <option value="hall">ホール</option>
                                  <option value="branch">支店</option>
                                </select>
                              </td>
                              <td className={`${tableCell} min-w-[160px]`}>
                                <div className="flex flex-col gap-1">
                                  {editingBranchId && (
                                    <button type="button" onClick={resetBranchForm} className={secondaryButton}>
                                      新規入力へ戻す
                                    </button>
                                  )}
                                  <button type="button" onClick={handleBranchSubmit} className={buttonBase}>
                                    {editingBranchId ? "更新" : "登録"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
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
                                    className={dangerButton}
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
        </section>
      ) : (
        <section className="space-y-4">
          <div className={`${compactContainer} grid gap-2 sm:grid-cols-2 lg:grid-cols-4`}>
            {[
              { key: "profile", label: "法人情報" },
              { key: "branches", label: "ホール・支店設定" },
              { key: "staffs", label: "担当者設定" },
              { key: "warehouses", label: "倉庫設定" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setCompanyTab(item.key as "profile" | "branches" | "staffs" | "warehouses")}
                className={`rounded-none border border-gray-500 px-4 py-3 text-sm font-semibold transition ${
                  companyTab === item.key ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {companyTab === "profile" && (
            <div className={`${compactContainer} space-y-4`}>
              <div className="border border-gray-400 bg-white">
                <div className="flex items-center justify-between border-b border-gray-400 bg-gray-200 px-3 py-2">
                  <h3 className="text-sm font-semibold text-slate-800">法人情報</h3>
                  {!isCompanyProfileEditing && (
                    <button type="button" onClick={handleCompanyProfileEdit} className={secondaryButton}>
                      編集
                    </button>
                  )}
                </div>

                {isCompanyProfileEditing ? (
                  <div className="border-t border-gray-400">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <tbody>
                        <tr>
                          <th className={`${tableHeader} w-[220px]`}>管理者法人名</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.corporateName}
                              onChange={(event) => handleCompanyProfileFormChange("corporateName", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <th className={`${tableHeader} w-[220px]`}>郵便番号</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.postalCode}
                              onChange={(event) => handleCompanyProfileFormChange("postalCode", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={`${tableHeader} w-[220px]`}>都道府県</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.prefecture}
                              onChange={(event) => handleCompanyProfileFormChange("prefecture", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <th className={`${tableHeader} w-[220px]`}>市区町村</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.city}
                              onChange={(event) => handleCompanyProfileFormChange("city", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={`${tableHeader} w-[220px]`}>番地・ビル名</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.addressLine2 ?? ""}
                              onChange={(event) => handleCompanyProfileFormChange("addressLine2", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <th className={`${tableHeader} w-[220px]`}>電話番号</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.phone}
                              onChange={(event) => handleCompanyProfileFormChange("phone", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={`${tableHeader} w-[220px]`}>FAX番号</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.fax}
                              onChange={(event) => handleCompanyProfileFormChange("fax", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <th className={`${tableHeader} w-[220px]`}>役職</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.title}
                              onChange={(event) => handleCompanyProfileFormChange("title", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={`${tableHeader} w-[220px]`}>代表名</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.representative}
                              onChange={(event) => handleCompanyProfileFormChange("representative", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <th className={`${tableHeader} w-[220px]`}>備考</th>
                          <td className={tableCell}>
                            <input
                              value={companyProfileForm.note}
                              onChange={(event) => handleCompanyProfileFormChange("note", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-2 border-t border-gray-400 px-3 py-2">
                      <button type="button" onClick={resetCompanyProfileForm} className={secondaryButton}>
                        キャンセル
                      </button>
                      <button type="button" onClick={handleCompanyProfileSave} className={buttonBase}>
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-400">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <tbody>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            管理者法人名
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">{companyName}</td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            郵便番号
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.postalCode || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            都道府県
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.prefecture || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            市区町村
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.city || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            番地・ビル名
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {buildCompanyAddressLine(masterData.companyProfile) || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            電話番号
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.phone || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            FAX番号
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.fax || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            役職
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.title || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            代表名
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.representative || "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="w-[220px] border border-gray-400 bg-gray-100 px-3 py-2 text-left text-sm font-semibold">
                            備考
                          </th>
                          <td className="border border-gray-400 px-3 py-2 text-sm">
                            {masterData.companyProfile.note || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {companyTab === "branches" && (
            <div className={`${compactContainer} space-y-4`}>
              <div className="border border-gray-400 bg-white">
                <div className={sectionHeader}>ホール・支店設定</div>
                <div className="border-t border-gray-400">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <tbody>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>管理者法人名</th>
                        <td className={tableCell}>{companyName}</td>
                        <th className={`${tableHeader} w-[220px]`}>管理者支店名</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.name}
                            onChange={(event) => handleCompanyBranchFormChange("name", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>郵便番号</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.postalCode}
                            onChange={(event) => handleCompanyBranchFormChange("postalCode", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                        <th className={`${tableHeader} w-[220px]`}>都道府県</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.prefecture}
                            onChange={(event) => handleCompanyBranchFormChange("prefecture", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>市区町村</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.city}
                            onChange={(event) => handleCompanyBranchFormChange("city", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                        <th className={`${tableHeader} w-[220px]`}>番地・ビル名</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.addressLine2}
                            onChange={(event) => handleCompanyBranchFormChange("addressLine2", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>電話番号</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.phone}
                            onChange={(event) => handleCompanyBranchFormChange("phone", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                        <th className={`${tableHeader} w-[220px]`}>FAX番号</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.fax}
                            onChange={(event) => handleCompanyBranchFormChange("fax", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>責任者</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.manager}
                            onChange={(event) => handleCompanyBranchFormChange("manager", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                        <th className={`${tableHeader} w-[220px]`}>備考</th>
                        <td className={tableCell}>
                          <input
                            value={companyBranchForm.note}
                            onChange={(event) => handleCompanyBranchFormChange("note", event.target.value)}
                            className={inputBase}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex items-center justify-end gap-2 border-t border-gray-400 px-3 py-2">
                    {editingCompanyBranchId && (
                      <button type="button" onClick={resetCompanyBranchForm} className={secondaryButton}>
                        新規入力へ戻す
                      </button>
                    )}
                    <button type="button" onClick={handleCompanyBranchSubmit} className={buttonBase}>
                      {editingCompanyBranchId ? "更新" : "登録"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-400 bg-white">
                <div className={sectionHeader}>登録済みホール・支店一覧</div>
                <div className="border-t border-gray-400 px-3 py-2 text-sm">件数: {masterData.companyBranches.length}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className={tableHeader}>管理者法人名</th>
                        <th className={tableHeader}>管理者支店名</th>
                        <th className={tableHeader}>郵便番号</th>
                        <th className={tableHeader}>住所</th>
                        <th className={tableHeader}>電話番号</th>
                        <th className={tableHeader}>FAX番号</th>
                        <th className={tableHeader}>責任者</th>
                        <th className={tableHeader}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.companyBranches.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-gray-400 px-3 py-4 text-center text-sm">
                            登録済みホール・支店がありません。
                          </td>
                        </tr>
                      ) : (
                        masterData.companyBranches.map((branch) => (
                          <tr key={branch.id} className="odd:bg-white even:bg-slate-50">
                            <td className={tableCell}>{companyName}</td>
                            <td className={tableCell}>{branch.name}</td>
                            <td className={tableCell}>{branch.postalCode || "-"}</td>
                            <td className={tableCell}>
                              {branch.city || branch.addressLine || branch.addressLine2
                                ? `${branch.city ?? ""}${buildCompanyAddressLine(branch)}`
                                : "-"}
                            </td>
                            <td className={tableCell}>{branch.phone || "-"}</td>
                            <td className={tableCell}>{branch.fax || "-"}</td>
                            <td className={tableCell}>{branch.manager || "-"}</td>
                            <td className={`${tableCell} whitespace-nowrap`}>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCompanyBranchEdit(branch)}
                                  className={secondaryButton}
                                >
                                  編集
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCompanyBranchDelete(branch.id)}
                                  className={dangerButton}
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
            </div>
          )}

          {companyTab === "staffs" && (
            <div className={`${compactContainer} space-y-4`}>
              <div className="border border-gray-400 bg-white">
                <div className={sectionHeader}>担当者設定</div>
                <div className="border-t border-gray-400">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <tbody>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>法人名</th>
                        <td className={tableCell}>{companyName}</td>
                        <th className={`${tableHeader} w-[220px]`}>ホール・支店</th>
                        <td className={tableCell}>
                          {masterData.companyBranches.length > 0 ? (
                            <select
                              value={companyStaffForm.branchId}
                              onChange={(event) => handleCompanyStaffFormChange("branchId", event.target.value)}
                              className={inputBase}
                            >
                              <option value="">未選択</option>
                              {masterData.companyBranches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={mutedText}>-</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th className={`${tableHeader} w-[220px]`}>名前</th>
                        <td className={tableCell} colSpan={3}>
                          <input
                            value={companyStaffForm.name}
                            onChange={(event) => handleCompanyStaffFormChange("name", event.target.value)}
                            className={inputBase}
                            placeholder="担当者名を入力"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between gap-2 border-t border-gray-400 px-3 py-2">
                    <div className="text-xs text-slate-600">
                      {masterData.companyProfile.corporateName
                        ? ""
                        : "法人情報が未登録です。先に法人情報を登録してください。"}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingCompanyStaffId && (
                        <button type="button" onClick={resetCompanyStaffForm} className={secondaryButton}>
                          新規入力へ戻す
                        </button>
                      )}
                      <button type="button" onClick={handleCompanyStaffSubmit} className={buttonBase}>
                        {editingCompanyStaffId ? "更新" : "登録"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-400 bg-white">
                <div className={sectionHeader}>登録済み担当者一覧</div>
                <div className="border-t border-gray-400 px-3 py-2 text-sm">件数: {masterData.companyStaffs.length}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className={tableHeader}>法人名</th>
                        <th className={tableHeader}>ホール・支店</th>
                        <th className={tableHeader}>名前</th>
                        <th className={tableHeader}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.companyStaffs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border border-gray-400 px-3 py-4 text-center text-sm">
                            登録済み担当者がありません。
                          </td>
                        </tr>
                      ) : (
                        masterData.companyStaffs.map((staff) => {
                          const branchName =
                            masterData.companyBranches.find((branch) => branch.id === staff.branchId)?.name ?? "-";
                          return (
                            <tr key={staff.id} className="odd:bg-white even:bg-slate-50">
                              <td className={tableCell}>{companyName}</td>
                              <td className={tableCell}>{branchName}</td>
                              <td className={tableCell}>{staff.name}</td>
                              <td className={`${tableCell} whitespace-nowrap`}>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCompanyStaffEdit(staff)}
                                    className={secondaryButton}
                                  >
                                    編集
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCompanyStaffDelete(staff.id)}
                                    className={dangerButton}
                                  >
                                    削除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {companyTab === "warehouses" && (
            <div className={`${compactContainer} border border-gray-400 bg-white px-4 py-6 text-center text-sm text-gray-600`}>
              準備中
            </div>
          )}
        </section>
      )}
      {renderConfirmModal()}
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
