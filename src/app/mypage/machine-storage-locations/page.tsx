"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MyPageStubPage from "@/components/mypage/MyPageStubPage";
import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { fetchWithDevHeader, resolveCurrentDevUserId } from "@/lib/api/fetchWithDevHeader";

type RegionKey =
  | "hokkaido"
  | "tohokuNorth"
  | "tohokuSouth"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kitakyushu"
  | "minamikyushu"
  | "okinawa";

type ShippingFeesByRegion = Record<RegionKey, number>;

type StorageLocation = {
  id: string;
  ownerUserId: string;
  name: string;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  handlingFeePerUnit: number | null;
  shippingFeesByRegion: ShippingFeesByRegion | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  handlingFeePerUnit: string;
  shippingFeesByRegion: Record<RegionKey, string>;
};

const REGION_FIELDS: { key: RegionKey; label: string }[] = [
  { key: "hokkaido", label: "北海道" },
  { key: "tohokuNorth", label: "北東北" },
  { key: "tohokuSouth", label: "南東北" },
  { key: "kanto", label: "関東" },
  { key: "chubu", label: "中部" },
  { key: "kinki", label: "近畿" },
  { key: "chugoku", label: "中国" },
  { key: "shikoku", label: "四国" },
  { key: "kitakyushu", label: "北九州" },
  { key: "minamikyushu", label: "南九州" },
  { key: "okinawa", label: "沖縄" },
];

const createEmptyFees = (): Record<RegionKey, string> =>
  REGION_FIELDS.reduce(
    (acc, region) => {
      acc[region.key] = "";
      return acc;
    },
    {} as Record<RegionKey, string>
  );

const createEmptyForm = (): FormState => ({
  name: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  handlingFeePerUnit: "",
  shippingFeesByRegion: createEmptyFees(),
});

type Mode = "list" | "new" | "edit";

export default function MachineStorageLocationsPage() {
  const currentUser = useCurrentDevUser();
  const [mode, setMode] = useState<Mode>("list");
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [formState, setFormState] = useState<FormState>(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalCountLabel = useMemo(() => `全件数：${locations.length}件`, [locations.length]);
  const resolveDevUserId = useCallback(
    () => resolveCurrentDevUserId() ?? currentUser.id,
    [currentUser.id]
  );

  const fetchLocations = useCallback(async () => {
    setLoadingMessage("読み込み中...");
    setErrorMessage(null);
    try {
      const response = await fetchWithDevHeader(
        "/api/storage-locations",
        {},
        resolveDevUserId()
      );
      if (!response.ok) {
        throw new Error("倉庫一覧の取得に失敗しました。");
      }
      const data = (await response.json()) as StorageLocation[];
      setLocations(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "倉庫一覧の取得に失敗しました。";
      setErrorMessage(message);
    } finally {
      setLoadingMessage(null);
    }
  }, [resolveDevUserId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleStartNew = () => {
    setFormState(createEmptyForm());
    setEditingId(null);
    setMode("new");
    setErrorMessage(null);
  };

  const handleStartEdit = (location: StorageLocation) => {
    setEditingId(location.id);
    setFormState({
      name: location.name,
      postalCode: location.postalCode ?? "",
      prefecture: location.prefecture ?? "",
      city: location.city ?? "",
      addressLine: location.addressLine ?? "",
      handlingFeePerUnit: String(location.handlingFeePerUnit ?? ""),
      shippingFeesByRegion: REGION_FIELDS.reduce(
        (acc, region) => {
          acc[region.key] = String(location.shippingFeesByRegion?.[region.key] ?? "");
          return acc;
        },
        {} as Record<RegionKey, string>
      ),
    });
    setMode("edit");
    setErrorMessage(null);
  };

  const handleCancel = () => {
    setMode("list");
    setFormState(createEmptyForm());
    setEditingId(null);
    setErrorMessage(null);
  };

  const buildPayload = () => {
    const requiredFields: { label: string; value: string }[] = [
      { label: "保管倉庫名", value: formState.name },
      { label: "郵便番号", value: formState.postalCode },
      { label: "都道府県", value: formState.prefecture },
      { label: "市区町村", value: formState.city },
      { label: "以降の住所", value: formState.addressLine },
      { label: "出庫手数料", value: formState.handlingFeePerUnit },
    ];

    const missing = requiredFields.filter((field) => field.value.trim() === "");
    const missingRegions = REGION_FIELDS.filter(
      (region) => formState.shippingFeesByRegion[region.key].trim() === ""
    );

    if (missing.length > 0 || missingRegions.length > 0) {
      setErrorMessage("必須項目を入力してください。");
      return null;
    }

    const handlingFee = Number(formState.handlingFeePerUnit);
    if (Number.isNaN(handlingFee)) {
      setErrorMessage("出庫手数料は数値で入力してください。");
      return null;
    }

    const shippingFees = REGION_FIELDS.reduce((acc, region) => {
      const value = Number(formState.shippingFeesByRegion[region.key]);
      acc[region.key] = Number.isNaN(value) ? 0 : value;
      return acc;
    }, {} as ShippingFeesByRegion);

    return {
      name: formState.name.trim(),
      postalCode: formState.postalCode.trim(),
      prefecture: formState.prefecture.trim(),
      city: formState.city.trim(),
      addressLine: formState.addressLine.trim(),
      handlingFeePerUnit: handlingFee,
      shippingFeesByRegion: shippingFees,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setLoadingMessage(mode === "edit" ? "更新中..." : "登録中...");
    setErrorMessage(null);
    try {
      const devUserId = resolveDevUserId();
      const response = await fetchWithDevHeader(
        editingId ? `/api/storage-locations/${editingId}` : "/api/storage-locations",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        devUserId
      );

      if (!response.ok) {
        let detail: string | null = null;
        try {
          const data = (await response.json()) as { detail?: unknown } | null;
          if (data?.detail) {
            detail = String(data.detail);
          }
        } catch (error) {
          detail = null;
        }

        if (response.status === 401) {
          setErrorMessage("ユーザー情報の取得に失敗しました。画面をリロードして再度お試しください。");
          return;
        }
        if (response.status === 400) {
          setErrorMessage("入力内容に不備があります（必須項目・数値）");
          return;
        }
        if (response.status === 409) {
          setErrorMessage("同名の倉庫が既に存在します（倉庫名を変更してください）");
          return;
        }

        const baseMessage = "倉庫情報の保存に失敗しました。";
        setErrorMessage(detail ? `${baseMessage}（${detail}）` : baseMessage);
        return;
      }

      await fetchLocations();
      setMode("list");
      setEditingId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "倉庫情報の保存に失敗しました。";
      setErrorMessage(message);
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleDelete = async (location: StorageLocation) => {
    const confirmed = window.confirm(`「${location.name}」を削除しますか？`);
    if (!confirmed) return;

    setLoadingMessage("削除中...");
    setErrorMessage(null);
    try {
      const response = await fetchWithDevHeader(
        `/api/storage-locations/${location.id}`,
        {
          method: "DELETE",
        },
        resolveDevUserId()
      );

      if (!response.ok) {
        throw new Error("倉庫情報の削除に失敗しました。");
      }

      await fetchLocations();
    } catch (error) {
      const message = error instanceof Error ? error.message : "倉庫情報の削除に失敗しました。";
      setErrorMessage(message);
    } finally {
      setLoadingMessage(null);
    }
  };

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-700">{totalCountLabel}</div>
        <Button onClick={handleStartNew}>新規登録</Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {loadingMessage ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {loadingMessage}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full table-auto text-sm text-slate-800">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2">倉庫名</th>
              <th className="px-3 py-2">住所</th>
              <th className="px-3 py-2 text-right">出庫手数料</th>
              <th className="px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{location.name}</td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {`${location.postalCode ? `${location.postalCode} ` : ""}${location.prefecture ?? ""}${location.city ?? ""}${location.addressLine ?? ""}`}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(location.handlingFeePerUnit ?? 0).toLocaleString()} 円
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => handleStartEdit(location)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 px-3 text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(location)}
                    >
                      削除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {locations.length === 0 && !loadingMessage && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-neutral-500" colSpan={4}>
                  登録されている倉庫がありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {loadingMessage ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {loadingMessage}
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-900">基本情報</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            保管倉庫名
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="例：東京第1倉庫"
              required
            />
          </label>
          <div className="space-y-2 text-sm font-medium text-slate-700">
            郵便番号
            <div className="flex gap-2">
              <Input
                value={formState.postalCode}
                onChange={(event) => setFormState({ ...formState, postalCode: event.target.value })}
                placeholder="例：100-0001"
                required
              />
              <Button variant="outline" className="whitespace-nowrap">
                郵便番号検索
              </Button>
            </div>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            都道府県
            <Input
              value={formState.prefecture}
              onChange={(event) => setFormState({ ...formState, prefecture: event.target.value })}
              placeholder="例：東京都"
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            市区町村
            <Input
              value={formState.city}
              onChange={(event) => setFormState({ ...formState, city: event.target.value })}
              placeholder="例：千代田区"
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            以降の住所
            <Input
              value={formState.addressLine}
              onChange={(event) => setFormState({ ...formState, addressLine: event.target.value })}
              placeholder="例：丸の内1-1-1"
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            出庫手数料（1台あたり）
            <Input
              type="number"
              min="0"
              value={formState.handlingFeePerUnit}
              onChange={(event) =>
                setFormState({ ...formState, handlingFeePerUnit: event.target.value })
              }
              placeholder="例：5000"
              required
            />
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-900">送料（地域別）</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REGION_FIELDS.map((region) => (
            <label key={region.key} className="space-y-2 text-sm font-medium text-slate-700">
              {region.label}
              <Input
                type="number"
                min="0"
                value={formState.shippingFeesByRegion[region.key]}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    shippingFeesByRegion: {
                      ...formState.shippingFeesByRegion,
                      [region.key]: event.target.value,
                    },
                  })
                }
                placeholder="例：12000"
                required
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={handleCancel}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit}>{mode === "edit" ? "更新" : "登録"}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage title="倉庫設定" description="遊技機保管倉庫（保管場所）を管理します。">
        {mode === "list" ? renderList() : renderForm()}
      </MyPageStubPage>
    </div>
  );
}
