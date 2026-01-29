"use client";

import type React from "react";
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import PageTitleBand from "@/components/common/PageTitleBand";
import {
  DEFAULT_MASTER_DATA,
  createMasterId,
  loadMasterData,
  saveMasterData,
  type CompanyBranch,
  type CompanyProfileEntry,
  type CompanyProfile,
  type CompanyStaff,
  type MasterData,
  type SupplierBranch,
  type SupplierCategory,
  type SupplierCorporate,
  type Warehouse,
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
  invoiceNumber: string;
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

type CompanyProfileFormState = CompanyProfileEntry;

type CompanyBranchFormState = {
  corporateId: string;
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
  corporateId: string;
  branchId: string;
  name: string;
};

type WarehouseFormState = {
  name: string;
  address: string;
  category: "self" | "other";
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
  invoiceNumber: "",
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

const createEmptyCompanyProfileEntry = (isPrimary = false): CompanyProfileFormState => ({
  id: createMasterId("company-profile"),
  isPrimary,
  corporateName: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  addressLine2: "",
  phone: "",
  fax: "",
  invoiceNumber: "",
  title: "",
  representative: "",
  note: "",
});

const createEmptyCompanyBranchForm = (): CompanyBranchFormState => ({
  corporateId: "",
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
  corporateId: "",
  branchId: "",
  name: "",
});

const createEmptyWarehouseForm = (): WarehouseFormState => ({
  name: "",
  address: "",
  category: "self",
});

const buildCompanyAddressLine = (profile: Pick<CompanyProfile, "addressLine2" | "addressLine">) =>
  profile.addressLine2?.trim() || profile.addressLine?.trim() || "";

const ensurePrimaryProfile = (profiles: CompanyProfileEntry[]) => {
  if (profiles.length === 0) {
    return [createEmptyCompanyProfileEntry(true)];
  }
  const [first, ...rest] = profiles;
  return [
    { ...first, isPrimary: true },
    ...rest.map((profile) => ({ ...profile, isPrimary: false })),
  ];
};

const buildCompanyProfileForms = (profiles: CompanyProfileEntry[]): CompanyProfileFormState[] =>
  ensurePrimaryProfile(profiles).map((profile) => ({
    ...profile,
    addressLine2: buildCompanyAddressLine(profile),
  }));

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
  const [purchaseTermsText, setPurchaseTermsText] = useState<string>("");
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
  const [companyProfileForms, setCompanyProfileForms] = useState<CompanyProfileFormState[]>(() =>
    buildCompanyProfileForms(DEFAULT_MASTER_DATA.companyProfiles),
  );
  const [isCompanyProfileEditing, setIsCompanyProfileEditing] = useState(false);
  const [companyBranchForm, setCompanyBranchForm] = useState<CompanyBranchFormState>(createEmptyCompanyBranchForm());
  const [editingCompanyBranchId, setEditingCompanyBranchId] = useState<string | null>(null);
  const [companyStaffForm, setCompanyStaffForm] = useState<CompanyStaffFormState>(createEmptyCompanyStaffForm());
  const [editingCompanyStaffId, setEditingCompanyStaffId] = useState<string | null>(null);
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormState>(createEmptyWarehouseForm());
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [draggingWarehouseId, setDraggingWarehouseId] = useState<string | null>(null);
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
    "corporate-invoiceNumber",
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
    if (value === "purchase-terms") return "purchase-terms";
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
    setPurchaseTermsText(loaded.purchaseTermsText ?? "");
    const firstCorporateId = loaded.suppliers[0]?.id ?? "";
    setBranchForm((prev) => ({
      ...prev,
      corporateId: prev.corporateId || firstCorporateId,
    }));
    setCompanyProfileForms(buildCompanyProfileForms(loaded.companyProfiles));
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

  const handlePurchaseTermsSave = () => {
    updateStorage({ ...masterData, purchaseTermsText });
  };

  const companyProfiles = useMemo(() => {
    if (masterData.companyProfiles.length > 0) return masterData.companyProfiles;
    return [
      {
        id: "company-primary",
        isPrimary: true,
        ...masterData.companyProfile,
      },
    ];
  }, [masterData.companyProfile, masterData.companyProfiles]);

  const primaryCompanyProfile = companyProfiles.find((profile) => profile.isPrimary) ?? companyProfiles[0];
  const primaryCompanyProfileId = primaryCompanyProfile?.id ?? "company-primary";

  const getCompanyNameById = (id?: string) =>
    companyProfiles.find((profile) => profile.id === id)?.corporateName ||
    primaryCompanyProfile?.corporateName ||
    "-";

  const getBranchCorporateId = (branchId?: string) => {
    const branch = masterData.companyBranches.find((candidate) => candidate.id === branchId);
    return branch?.corporateId ?? primaryCompanyProfileId;
  };

  useEffect(() => {
    setCompanyBranchForm((prev) =>
      prev.corporateId ? prev : { ...prev, corporateId: primaryCompanyProfileId },
    );
    setCompanyStaffForm((prev) =>
      prev.corporateId ? prev : { ...prev, corporateId: primaryCompanyProfileId },
    );
  }, [primaryCompanyProfileId]);

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

  const handleCompanyProfileFormChange = <K extends keyof CompanyProfileFormState>(
    id: string,
    key: K,
    value: CompanyProfileFormState[K],
  ) => {
    setCompanyProfileForms((prev) => prev.map((profile) => (profile.id === id ? { ...profile, [key]: value } : profile)));
  };

  const handleCompanyProfileAdd = () => {
    setCompanyProfileForms((prev) => [...ensurePrimaryProfile(prev), createEmptyCompanyProfileEntry(false)]);
  };

  const handleCompanyProfileRemove = (id: string) => {
    setCompanyProfileForms((prev) => prev.filter((profile) => profile.id !== id));
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

  const handleWarehouseFormChange = <K extends keyof WarehouseFormState>(key: K, value: WarehouseFormState[K]) => {
    setWarehouseForm((prev) => ({ ...prev, [key]: value }));
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
    setCompanyProfileForms(buildCompanyProfileForms(masterData.companyProfiles));
    setIsCompanyProfileEditing(false);
  };

  const resetCompanyBranchForm = () => {
    setCompanyBranchForm((prev) => ({
      ...createEmptyCompanyBranchForm(),
      corporateId: prev.corporateId,
    }));
    setEditingCompanyBranchId(null);
  };

  const resetCompanyStaffForm = () => {
    setCompanyStaffForm((prev) => ({
      ...createEmptyCompanyStaffForm(),
      corporateId: prev.corporateId,
    }));
    setEditingCompanyStaffId(null);
  };

  const resetWarehouseForm = () => {
    setWarehouseForm(createEmptyWarehouseForm());
    setEditingWarehouseId(null);
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
          invoiceNumber: corporateForm.invoiceNumber.trim(),
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
        invoiceNumber: corporateForm.invoiceNumber.trim(),
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
      invoiceNumber: supplier.invoiceNumber ?? "",
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
    setCompanyProfileForms(buildCompanyProfileForms(masterData.companyProfiles));
    setIsCompanyProfileEditing(true);
  };

  const handleCompanyProfileSave = () => {
    const [primaryProfile, ...restProfiles] = ensurePrimaryProfile(companyProfileForms).map((profile) => ({
      ...profile,
      corporateName: profile.corporateName.trim(),
      postalCode: profile.postalCode.trim(),
      prefecture: profile.prefecture.trim(),
      city: profile.city.trim(),
      addressLine: profile.addressLine2?.trim() ?? "",
      addressLine2: profile.addressLine2?.trim() ?? "",
      phone: profile.phone.trim(),
      fax: profile.fax.trim(),
      invoiceNumber: profile.invoiceNumber?.trim() ?? "",
      title: profile.title.trim(),
      representative: profile.representative.trim(),
      note: profile.note.trim(),
    }));

    const hasAnyValue = (profile: CompanyProfileFormState) =>
      Boolean(
        profile.corporateName ||
          profile.postalCode ||
          profile.prefecture ||
          profile.city ||
          profile.addressLine2 ||
          profile.phone ||
          profile.fax ||
          profile.invoiceNumber ||
          profile.title ||
          profile.representative ||
          profile.note,
      );

    const normalizedProfiles = [
      primaryProfile,
      ...restProfiles.filter((profile) => hasAnyValue(profile)),
    ];

    const rows = normalizedProfiles.flatMap((profile, index) => {
      const labelPrefix = profile.isPrimary ? "代表法人" : `グループ会社${index}`;
      return [
        { label: `${labelPrefix} 法人名`, value: profile.corporateName || "-" },
        { label: `${labelPrefix} 郵便番号`, value: profile.postalCode || "-" },
        { label: `${labelPrefix} 都道府県`, value: profile.prefecture || "-" },
        { label: `${labelPrefix} 市区町村`, value: profile.city || "-" },
        { label: `${labelPrefix} 番地・ビル名`, value: profile.addressLine2 || "-" },
        { label: `${labelPrefix} 電話番号`, value: profile.phone || "-" },
        { label: `${labelPrefix} FAX番号`, value: profile.fax || "-" },
        { label: `${labelPrefix} インボイス番号`, value: profile.invoiceNumber || "-" },
        { label: `${labelPrefix} 役職`, value: profile.title || "-" },
        { label: `${labelPrefix} 代表名`, value: profile.representative || "-" },
        { label: `${labelPrefix} 備考`, value: profile.note || "-" },
      ];
    });

    const primaryNormalized: CompanyProfile = {
      corporateName: primaryProfile.corporateName,
      postalCode: primaryProfile.postalCode,
      prefecture: primaryProfile.prefecture,
      city: primaryProfile.city,
      addressLine: primaryProfile.addressLine,
      addressLine2: primaryProfile.addressLine2,
      phone: primaryProfile.phone,
      fax: primaryProfile.fax,
      invoiceNumber: primaryProfile.invoiceNumber ?? "",
      title: primaryProfile.title,
      representative: primaryProfile.representative,
      note: primaryProfile.note,
    };

    openConfirmModal({
      title: "法人情報 確認",
      rows,
      actionLabel: masterData.companyProfile.corporateName ? "更新" : "登録",
      completeMessage: "法人情報の登録が完了しました。",
      onConfirm: () => {
        updateStorage({
          ...masterData,
          companyProfiles: normalizedProfiles,
          companyProfile: primaryNormalized,
        });
        setIsCompanyProfileEditing(false);
      },
    });
  };

  const handleCompanyBranchSubmit = () => {
    const name = companyBranchForm.name.trim();
    if (!name) return;

    const normalized: CompanyBranch = {
      id: editingCompanyBranchId ?? createMasterId("company-branch"),
      corporateId: companyBranchForm.corporateId || primaryCompanyProfileId,
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
        { label: "法人名", value: getCompanyNameById(normalized.corporateId) },
        { label: "ホール・支店名", value: normalized.name || "-" },
        { label: "郵便番号", value: normalized.postalCode || "-" },
        { label: "都道府県", value: normalized.prefecture || "-" },
        { label: "市区町村", value: normalized.city || "-" },
        { label: "番地・ビル名", value: normalized.addressLine2 || "-" },
        { label: "電話番号", value: normalized.phone || "-" },
        { label: "FAX番号", value: normalized.fax || "-" },
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
      corporateId: branch.corporateId ?? primaryCompanyProfileId,
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
      corporateId: companyStaffForm.corporateId || primaryCompanyProfileId,
    };

    const nextStaffs = editingCompanyStaffId
      ? masterData.companyStaffs.map((staff) => (staff.id === editingCompanyStaffId ? normalized : staff))
      : [...masterData.companyStaffs, normalized];

    const branchName = masterData.companyBranches.find((branch) => branch.id === normalized.branchId)?.name ?? "-";

    openConfirmModal({
      title: editingCompanyStaffId ? "担当者更新 確認" : "担当者登録 確認",
      rows: [
        { label: "法人名", value: getCompanyNameById(normalized.corporateId) },
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
      corporateId: staff.corporateId ?? getBranchCorporateId(staff.branchId),
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

  const updateWarehouseStorage = (nextWarehouses: Warehouse[]) => {
    updateStorage({
      ...masterData,
      warehouseDetails: nextWarehouses,
      warehouses: nextWarehouses.map((warehouse) => warehouse.name),
    });
  };

  const handleWarehouseSubmit = () => {
    const name = warehouseForm.name.trim();
    if (!name) return;

    const normalized: Warehouse = {
      id: editingWarehouseId ?? createMasterId("warehouse"),
      name,
      address: warehouseForm.address.trim(),
      category: warehouseForm.category,
    };

    const nextWarehouses = editingWarehouseId
      ? masterData.warehouseDetails.map((warehouse) => (warehouse.id === editingWarehouseId ? normalized : warehouse))
      : [...masterData.warehouseDetails, normalized];

    updateWarehouseStorage(nextWarehouses);
    resetWarehouseForm();
  };

  const handleWarehouseEdit = (warehouse: Warehouse) => {
    setWarehouseForm({
      name: warehouse.name,
      address: warehouse.address ?? "",
      category: warehouse.category ?? "self",
    });
    setEditingWarehouseId(warehouse.id);
  };

  const handleWarehouseDelete = (warehouseId: string) => {
    if (!window.confirm("この倉庫を削除しますか？")) return;
    const nextWarehouses = masterData.warehouseDetails.filter((warehouse) => warehouse.id !== warehouseId);
    updateWarehouseStorage(nextWarehouses);
    if (editingWarehouseId === warehouseId) {
      resetWarehouseForm();
    }
  };

  const handleWarehouseReorder = (targetId: string) => {
    if (!draggingWarehouseId || draggingWarehouseId === targetId) return;
    const sourceIndex = masterData.warehouseDetails.findIndex((warehouse) => warehouse.id === draggingWarehouseId);
    const targetIndex = masterData.warehouseDetails.findIndex((warehouse) => warehouse.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const next = [...masterData.warehouseDetails];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    updateWarehouseStorage(next);
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

  const staffBranchOptions = masterData.companyBranches.filter(
    (branch) => getBranchCorporateId(branch.id) === companyStaffForm.corporateId,
  );

  const sectionHeader = "bg-slate-600 px-3 py-2 text-sm font-semibold text-white";
  const tableHeader = "border border-gray-400 bg-slate-600 px-2 py-1 text-xs font-bold text-white";
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
  const compactContainer = "mx-auto w-full max-w-[1200px]";
  const pageTitle = mode === "customer" ? "取引先管理" : mode === "purchase-terms" ? "購入規約" : "自社設定";
  const pageDescription =
    mode === "customer"
      ? "取引先情報の登録・更新・非表示設定を行います。"
      : mode === "purchase-terms"
        ? "購入伝票に表示する規約文を登録・更新します。"
        : "自社情報の登録・更新・管理を行います。";

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
      <PageTitleBand title={pageTitle} description={pageDescription} />
      {mode === "purchase-terms" ? (
        <div className={compactContainer}>
          <section className="border border-gray-400 bg-white">
            <div className={sectionHeader}>購入規約</div>
            <div className="space-y-4 border-t border-gray-400 p-4">
              <div className={mutedText}>購入伝票の売主欄に表示する規約文を登録します。</div>
              <textarea
                value={purchaseTermsText}
                onChange={(event) => setPurchaseTermsText(event.target.value)}
                placeholder="例：当社の規約に基づき下記の通り購入いたします。"
                className="min-h-[160px] w-full border border-gray-400 bg-white p-3 text-sm leading-relaxed focus:border-gray-700 focus:outline-none"
              />
              <div className="flex justify-end">
                <button type="button" onClick={handlePurchaseTermsSave} className={buttonBase}>
                  保存
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : mode === "customer" ? (
        <div className={compactContainer}>
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
                    <div className="border-b border-gray-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      ENTERを押すと次の項目に遷移します。
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <tbody>
                          <tr>
                            <th className={tableHeader}>区分</th>
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
                            <th className={tableHeader}>インボイス番号</th>
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
                                value={corporateForm.invoiceNumber}
                                onChange={(event) => handleCorporateFormChange("invoiceNumber", event.target.value)}
                                onKeyDown={(event) =>
                                  handleEnterNext(event, corporateFieldOrder, "corporate-invoiceNumber")
                                }
                                ref={registerFocus("corporate-invoiceNumber")}
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
                          <th className={tableHeader}>インボイス番号</th>
                          <th className={tableHeader}>mail</th>
                          <th className={tableHeader}>非表示</th>
                          <th className={tableHeader}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCorporates.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="border border-gray-400 px-3 py-4 text-center text-sm">
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
                              <td className={tableCell}>{supplier.invoiceNumber || "-"}</td>
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
                    <div className="border-b border-gray-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      ENTERを押すと次の項目に遷移します。
                    </div>
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
        </div>
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
                <div className={`${sectionHeader} flex items-center justify-between border-b border-gray-400`}>
                  <h3 className="text-sm font-semibold text-white">法人情報</h3>
                  <div className="flex items-center gap-2">
                    {isCompanyProfileEditing ? (
                      <button type="button" onClick={handleCompanyProfileAdd} className={secondaryButton}>
                        追加
                      </button>
                    ) : (
                      <button type="button" onClick={handleCompanyProfileEdit} className={secondaryButton}>
                        編集
                      </button>
                    )}
                  </div>
                </div>

                {isCompanyProfileEditing ? (
                  <div className="border-t border-gray-400">
                    <div className="overflow-x-auto">
                      <table className="min-w-[1200px] border-collapse text-sm">
                        <tbody>
                          {companyProfileForms.map((profile, index) => (
                            <Fragment key={profile.id}>
                              <tr>
                                <th className={tableHeader}>区分</th>
                                <th className={tableHeader}>法人名</th>
                                <th className={tableHeader}>郵便番号</th>
                                <th className={tableHeader}>都道府県</th>
                                <th className={tableHeader}>市区町村</th>
                                <th className={tableHeader}>番地・ビル名</th>
                                <th className={tableHeader}>電話番号</th>
                              </tr>
                              <tr className="odd:bg-white even:bg-slate-50">
                                <td className={tableCell}>
                                  <span className="text-xs font-semibold text-slate-700">
                                    {index === 0 ? "代表法人" : `グループ会社${index}`}
                                  </span>
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.corporateName}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "corporateName", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.postalCode}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "postalCode", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.prefecture}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "prefecture", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.city}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "city", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.addressLine2 ?? ""}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "addressLine2", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.phone}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "phone", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <th className={tableHeader}>FAX番号</th>
                                <th className={tableHeader}>インボイス番号</th>
                                <th className={tableHeader}>役職</th>
                                <th className={tableHeader}>代表者名</th>
                                <th className={tableHeader} colSpan={2}>
                                  備考
                                </th>
                                <th className={tableHeader}>操作</th>
                              </tr>
                              <tr className="odd:bg-white even:bg-slate-50">
                                <td className={tableCell}>
                                  <input
                                    value={profile.fax}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "fax", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.invoiceNumber ?? ""}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "invoiceNumber", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.title}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "title", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell}>
                                  <input
                                    value={profile.representative}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "representative", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={tableCell} colSpan={2}>
                                  <input
                                    value={profile.note}
                                    onChange={(event) =>
                                      handleCompanyProfileFormChange(profile.id, "note", event.target.value)
                                    }
                                    className={inputBase}
                                  />
                                </td>
                                <td className={`${tableCell} text-center`}>
                                  {index === 0 ? (
                                    <span className="text-xs text-slate-500">固定</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleCompanyProfileRemove(profile.id)}
                                      className={dangerButton}
                                    >
                                      削除
                                    </button>
                                  )}
                                </td>
                              </tr>
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                    <div className="overflow-x-auto">
                      <table className="min-w-[1200px] border-collapse text-sm">
                        <tbody>
                          {companyProfiles.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="border border-gray-400 px-3 py-4 text-center text-sm">
                                法人情報が登録されていません。
                              </td>
                            </tr>
                          ) : (
                            companyProfiles.map((profile, index) => (
                              <Fragment key={profile.id}>
                                <tr>
                                  <th className={tableHeader}>区分</th>
                                  <th className={tableHeader}>法人名</th>
                                  <th className={tableHeader}>郵便番号</th>
                                  <th className={tableHeader}>都道府県</th>
                                  <th className={tableHeader}>市区町村</th>
                                  <th className={tableHeader}>番地・ビル名</th>
                                  <th className={tableHeader}>電話番号</th>
                                </tr>
                                <tr className="odd:bg-white even:bg-slate-50">
                                  <td className={tableCell}>
                                    {index === 0 ? "代表法人" : `グループ会社${index}`}
                                  </td>
                                  <td className={tableCell}>{profile.corporateName || "-"}</td>
                                  <td className={tableCell}>{profile.postalCode || "-"}</td>
                                  <td className={tableCell}>{profile.prefecture || "-"}</td>
                                  <td className={tableCell}>{profile.city || "-"}</td>
                                  <td className={tableCell}>{buildCompanyAddressLine(profile) || "-"}</td>
                                  <td className={tableCell}>{profile.phone || "-"}</td>
                                </tr>
                                <tr>
                                  <th className={tableHeader}>FAX番号</th>
                                  <th className={tableHeader}>インボイス番号</th>
                                  <th className={tableHeader}>役職</th>
                                  <th className={tableHeader}>代表者名</th>
                                  <th className={tableHeader} colSpan={3}>
                                    備考
                                  </th>
                                </tr>
                                <tr className="odd:bg-white even:bg-slate-50">
                                  <td className={tableCell}>{profile.fax || "-"}</td>
                                  <td className={tableCell}>{profile.invoiceNumber || "-"}</td>
                                  <td className={tableCell}>{profile.title || "-"}</td>
                                  <td className={tableCell}>{profile.representative || "-"}</td>
                                  <td className={tableCell} colSpan={3}>
                                    {profile.note || "-"}
                                  </td>
                                </tr>
                              </Fragment>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
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
                  <div className="overflow-x-auto">
                    <table className="min-w-[1200px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={tableHeader}>法人名</th>
                          <th className={tableHeader}>ホール・支店名</th>
                          <th className={tableHeader}>郵便番号</th>
                          <th className={tableHeader}>都道府県</th>
                          <th className={tableHeader}>市区町村</th>
                          <th className={tableHeader}>番地・ビル名</th>
                          <th className={tableHeader}>電話番号</th>
                          <th className={tableHeader}>FAX番号</th>
                          <th className={tableHeader}>備考</th>
                          <th className={tableHeader}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={tableCell}>
                            {companyProfiles.length > 1 ? (
                              <select
                                value={companyBranchForm.corporateId}
                                onChange={(event) => handleCompanyBranchFormChange("corporateId", event.target.value)}
                                className={inputBase}
                              >
                                {companyProfiles.map((profile) => (
                                  <option key={profile.id} value={profile.id}>
                                    {profile.corporateName || "-"}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={mutedText}>{getCompanyNameById(companyBranchForm.corporateId)}</span>
                            )}
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.name}
                              onChange={(event) => handleCompanyBranchFormChange("name", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.postalCode}
                              onChange={(event) => handleCompanyBranchFormChange("postalCode", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.prefecture}
                              onChange={(event) => handleCompanyBranchFormChange("prefecture", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.city}
                              onChange={(event) => handleCompanyBranchFormChange("city", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.addressLine2}
                              onChange={(event) => handleCompanyBranchFormChange("addressLine2", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.phone}
                              onChange={(event) => handleCompanyBranchFormChange("phone", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.fax}
                              onChange={(event) => handleCompanyBranchFormChange("fax", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyBranchForm.note}
                              onChange={(event) => handleCompanyBranchFormChange("note", event.target.value)}
                              className={inputBase}
                            />
                          </td>
                          <td className={`${tableCell} min-w-[160px]`}>
                            <div className="flex flex-col gap-1">
                              {editingCompanyBranchId && (
                                <button type="button" onClick={resetCompanyBranchForm} className={secondaryButton}>
                                  新規入力へ戻す
                                </button>
                              )}
                              <button type="button" onClick={handleCompanyBranchSubmit} className={buttonBase}>
                                {editingCompanyBranchId ? "更新" : "登録"}
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
                <div className={sectionHeader}>登録済みホール・支店一覧</div>
                <div className="border-t border-gray-400 px-3 py-2 text-sm">件数: {masterData.companyBranches.length}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className={tableHeader}>法人名</th>
                        <th className={tableHeader}>ホール・支店名</th>
                        <th className={tableHeader}>郵便番号</th>
                        <th className={tableHeader}>住所</th>
                        <th className={tableHeader}>電話番号</th>
                        <th className={tableHeader}>FAX番号</th>
                        <th className={tableHeader}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.companyBranches.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="border border-gray-400 px-3 py-4 text-center text-sm">
                            登録済みホール・支店がありません。
                          </td>
                        </tr>
                      ) : (
                        masterData.companyBranches.map((branch) => (
                          <tr key={branch.id} className="odd:bg-white even:bg-slate-50">
                            <td className={tableCell}>{getCompanyNameById(branch.corporateId)}</td>
                            <td className={tableCell}>{branch.name}</td>
                            <td className={tableCell}>{branch.postalCode || "-"}</td>
                            <td className={tableCell}>
                              {branch.city || branch.addressLine || branch.addressLine2
                                ? `${branch.city ?? ""}${buildCompanyAddressLine(branch)}`
                                : "-"}
                            </td>
                            <td className={tableCell}>{branch.phone || "-"}</td>
                            <td className={tableCell}>{branch.fax || "-"}</td>
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
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={tableHeader}>法人名</th>
                          <th className={tableHeader}>ホール・支店</th>
                          <th className={tableHeader}>名前</th>
                          <th className={tableHeader}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={tableCell}>
                            {companyProfiles.length > 1 ? (
                              <select
                                value={companyStaffForm.corporateId}
                                onChange={(event) => {
                                  const nextCorporateId = event.target.value;
                                  setCompanyStaffForm((prev) => ({
                                    ...prev,
                                    corporateId: nextCorporateId,
                                    branchId:
                                      getBranchCorporateId(prev.branchId) === nextCorporateId ? prev.branchId : "",
                                  }));
                                }}
                                className={inputBase}
                              >
                                {companyProfiles.map((profile) => (
                                  <option key={profile.id} value={profile.id}>
                                    {profile.corporateName || "-"}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={mutedText}>{getCompanyNameById(companyStaffForm.corporateId)}</span>
                            )}
                          </td>
                          <td className={tableCell}>
                            {staffBranchOptions.length > 0 ? (
                              <select
                                value={companyStaffForm.branchId}
                                onChange={(event) => handleCompanyStaffFormChange("branchId", event.target.value)}
                                className={inputBase}
                              >
                                <option value="">未選択</option>
                                {staffBranchOptions.map((branch) => (
                                  <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={mutedText}>-</span>
                            )}
                          </td>
                          <td className={tableCell}>
                            <input
                              value={companyStaffForm.name}
                              onChange={(event) => handleCompanyStaffFormChange("name", event.target.value)}
                              className={inputBase}
                              placeholder="担当者名を入力"
                            />
                          </td>
                          <td className={`${tableCell} min-w-[160px]`}>
                            <div className="flex flex-col gap-1">
                              {editingCompanyStaffId && (
                                <button type="button" onClick={resetCompanyStaffForm} className={secondaryButton}>
                                  新規入力へ戻す
                                </button>
                              )}
                              <button type="button" onClick={handleCompanyStaffSubmit} className={buttonBase}>
                                {editingCompanyStaffId ? "更新" : "登録"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-gray-400 px-3 py-2">
                    <div className="text-xs text-slate-600">
                      {primaryCompanyProfile?.corporateName
                        ? ""
                        : "法人情報が未登録です。先に法人情報を登録してください。"}
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
                              <td className={tableCell}>{getCompanyNameById(staff.corporateId)}</td>
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
            <div className={`${compactContainer} space-y-4`}>
              <div className="border border-gray-400 bg-white">
                <div className={sectionHeader}>倉庫設定</div>
                <div className="border-t border-gray-400">
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={tableHeader}>保管先倉庫名</th>
                          <th className={tableHeader}>保管先倉庫住所</th>
                          <th className={tableHeader}>区分</th>
                          <th className={tableHeader}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={tableCell}>
                            <input
                              value={warehouseForm.name}
                              onChange={(event) => handleWarehouseFormChange("name", event.target.value)}
                              className={inputBase}
                              placeholder="例: 東京第1倉庫"
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              value={warehouseForm.address}
                              onChange={(event) => handleWarehouseFormChange("address", event.target.value)}
                              className={inputBase}
                              placeholder="例: 東京都港区..."
                            />
                          </td>
                          <td className={tableCell}>
                            <select
                              value={warehouseForm.category}
                              onChange={(event) =>
                                handleWarehouseFormChange("category", event.target.value as WarehouseFormState["category"])
                              }
                              className={inputBase}
                            >
                              <option value="self">自社</option>
                              <option value="other">他社</option>
                            </select>
                          </td>
                          <td className={`${tableCell} min-w-[160px]`}>
                            <div className="flex flex-col gap-1">
                              {editingWarehouseId && (
                                <button type="button" onClick={resetWarehouseForm} className={secondaryButton}>
                                  新規入力へ戻す
                                </button>
                              )}
                              <button type="button" onClick={handleWarehouseSubmit} className={buttonBase}>
                                {editingWarehouseId ? "更新" : "登録"}
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
                <div className={sectionHeader}>登録済み倉庫一覧</div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-400 px-3 py-2 text-sm">
                  <span>件数: {masterData.warehouseDetails.length}</span>
                  <span className="text-xs text-slate-600">ドラッグ&ドロップで並び替えできます。</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className={`${tableHeader} w-[80px]`}>並び替え</th>
                        <th className={tableHeader}>保管先倉庫名</th>
                        <th className={tableHeader}>保管先倉庫住所</th>
                        <th className={tableHeader}>区分</th>
                        <th className={tableHeader}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.warehouseDetails.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-400 px-3 py-4 text-center text-sm">
                            登録済み倉庫がありません。
                          </td>
                        </tr>
                      ) : (
                        masterData.warehouseDetails.map((warehouse) => (
                          <tr
                            key={warehouse.id}
                            draggable
                            onDragStart={() => setDraggingWarehouseId(warehouse.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleWarehouseReorder(warehouse.id)}
                            onDragEnd={() => setDraggingWarehouseId(null)}
                            className={`odd:bg-white even:bg-slate-50 ${
                              draggingWarehouseId === warehouse.id ? "opacity-60" : ""
                            }`}
                          >
                            <td className={`${tableCell} text-center text-lg text-slate-500`}>
                              <span className="cursor-grab">≡</span>
                            </td>
                            <td className={tableCell}>{warehouse.name}</td>
                            <td className={tableCell}>{warehouse.address || "-"}</td>
                            <td className={tableCell}>{warehouse.category === "self" ? "自社" : "他社"}</td>
                            <td className={`${tableCell} whitespace-nowrap`}>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleWarehouseEdit(warehouse)}
                                  className={secondaryButton}
                                >
                                  編集
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWarehouseDelete(warehouse.id)}
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
