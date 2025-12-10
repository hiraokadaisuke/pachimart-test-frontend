"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterFormValues = z.infer<typeof filterSchema>;

const filterSchema = z.object({
  keyword: z.string().optional().default(""),
  makers: z.array(z.string()).optional().default([]),
  states: z.array(z.string()).optional().default([]),
  types: z.array(z.enum(["P", "S"])).optional().default([]),
  warehouses: z.array(z.string()).optional().default([]),
  panelColor: z.string().optional().default(""),
  priceMin: z.string().optional().default(""),
  priceMax: z.string().optional().default(""),
});

const makerOptions = ["SANKYO", "三洋", "京楽", "山佐", "ユニバーサル"];
const stateOptions = ["倉庫", "出品中", "売却済", "設置中", "廃棄"];
const typeOptions: ("P" | "S")[] = ["P", "S"];
const warehouseOptions = ["東京第1倉庫", "東京第2倉庫", "埼玉倉庫", "大阪倉庫"];
const panelColorOptions = ["ブルー", "ブラック", "ホワイト", "レッド", "ネイビー"];

function buildSearchParams(values: FilterFormValues) {
  const params = new URLSearchParams();

  if (values.keyword?.trim()) {
    params.set("keyword", values.keyword.trim());
  }

  values.makers?.forEach((maker) => params.append("maker", maker));
  values.states?.forEach((state) => params.append("state", state));
  values.types?.forEach((type) => params.append("type", type));
  values.warehouses?.forEach((warehouse) => params.append("warehouse", warehouse));

  if (values.panelColor?.trim()) {
    params.set("panelColor", values.panelColor.trim());
  }

  if (values.priceMin && !Number.isNaN(Number(values.priceMin))) {
    params.set("priceMin", values.priceMin);
  }

  if (values.priceMax && !Number.isNaN(Number(values.priceMax))) {
    params.set("priceMax", values.priceMax);
  }

  return params;
}

function parseSearchParams(searchParams: Readonly<URLSearchParams> | null): FilterFormValues {
  const makerValues = searchParams ? searchParams.getAll("maker") : [];
  const stateValues = searchParams ? searchParams.getAll("state") : [];
  const typeValues = searchParams ? searchParams.getAll("type") : [];
  const warehouseValues = searchParams ? searchParams.getAll("warehouse") : [];

  return {
    keyword: searchParams?.get("keyword") ?? "",
    makers: makerValues,
    states: stateValues,
    types: typeValues.filter((type): type is "P" | "S" => type === "P" || type === "S"),
    warehouses: warehouseValues,
    panelColor: searchParams?.get("panelColor") ?? "",
    priceMin: searchParams?.get("priceMin") ?? "",
    priceMax: searchParams?.get("priceMax") ?? "",
  };
}

const emptyValues: FilterFormValues = {
  keyword: "",
  makers: [],
  states: [],
  types: [],
  warehouses: [],
  panelColor: "",
  priceMin: "",
  priceMax: "",
};

export function InventorySearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const defaults = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const {
    control,
    register,
    reset,
    watch,
    getValues,
    handleSubmit,
  } = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: defaults,
  });

  const keywordValue = watch("keyword");

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const syncFilters = useCallback(
    (values: FilterFormValues) => {
      const params = buildSearchParams(values);
      const queryString = params.toString();
      const resolvedPath = pathname ?? "/";
      const nextUrl = queryString ? `${resolvedPath}?${queryString}` : resolvedPath;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      syncFilters({ ...getValues(), keyword: keywordValue || "" });
    }, 300);

    return () => clearTimeout(timer);
  }, [getValues, keywordValue, syncFilters]);

  const onSubmit = (values: FilterFormValues) => {
    syncFilters(values);
    setIsFilterOpen(false);
    setIsMobileOpen(false);
  };

  const handleReset = () => {
    reset(emptyValues);
    syncFilters(emptyValues);
    setIsFilterOpen(false);
    setIsMobileOpen(false);
  };

  const activeBadges = useMemo(() => {
    const badges: string[] = [];
    if (keywordValue?.trim()) badges.push(`キーワード: ${keywordValue.trim()}`);
    const values = getValues();
    if (values.makers?.length) badges.push(`メーカー: ${values.makers.join(", ")}`);
    if (values.states?.length) badges.push(`状態: ${values.states.join(", ")}`);
    if (values.types?.length) badges.push(`種類: ${values.types.join(", ")}`);
    if (values.warehouses?.length) badges.push(`倉庫: ${values.warehouses.join(", ")}`);
    if (values.panelColor?.trim()) badges.push(`パネル色: ${values.panelColor}`);
    if (values.priceMin || values.priceMax) {
      badges.push(`価格帯: ${values.priceMin || "0"}〜${values.priceMax || "上限なし"}`);
    }
    return badges;
  }, [getValues, keywordValue]);

  return (
    <div className="flex w-full items-center justify-center">
      <div className="hidden w-full max-w-3xl items-center gap-3 md:flex">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full items-center gap-3"
        >
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.64 5.64a7.5 7.5 0 0010.01 10.01z"
                />
              </svg>
            </span>
            <Input
              placeholder="機種名・メーカー・倉庫・価格などを横断検索"
              className="h-12 rounded-full pl-10 pr-4"
              {...register("keyword")}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 px-4"
            onClick={() => setIsFilterOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h18M6 12h12M10 19h4"
              />
            </svg>
            <span className="hidden lg:inline">絞り込み</span>
          </Button>
        </form>
        <div className="hidden flex-wrap items-center gap-2 xl:flex">
          {activeBadges.length === 0 && (
            <Badge variant="outline">条件なし</Badge>
          )}
          {activeBadges.map((badge) => (
            <Badge key={badge}>{badge}</Badge>
          ))}
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-2 md:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-10 rounded-full p-0"
          aria-label="検索"
          onClick={() => setIsMobileOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.64 5.64a7.5 7.5 0 0010.01 10.01z"
            />
          </svg>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-10 rounded-full p-0"
          aria-label="絞り込み"
          onClick={() => setIsFilterOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5h18M6 12h12M10 19h4"
            />
          </svg>
        </Button>
      </div>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>絞り込み条件</DialogTitle>
            <DialogDescription>
              メーカー、状態、種類、倉庫、パネル色、価格帯で詳細に絞り込めます。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">メーカー</p>
                <div className="flex flex-wrap gap-2">
                  <Controller
                    name="makers"
                    control={control}
                    render={({ field }) => (
                      <>
                        {makerOptions.map((maker) => {
                          const checked = field.value?.includes(maker) ?? false;
                          return (
                            <label
                              key={maker}
                              className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                                checked
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-slate-50 text-neutral-900",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={(event) => {
                                  const next = new Set(field.value ?? []);
                                  if (event.target.checked) {
                                    next.add(maker);
                                  } else {
                                    next.delete(maker);
                                  }
                                  field.onChange(Array.from(next));
                                }}
                              />
                              <span>{maker}</span>
                            </label>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">状態</p>
                <div className="flex flex-wrap gap-2">
                  <Controller
                    name="states"
                    control={control}
                    render={({ field }) => (
                      <>
                        {stateOptions.map((state) => {
                          const checked = field.value?.includes(state) ?? false;
                          return (
                            <label
                              key={state}
                              className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                                checked
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-slate-50 text-neutral-900",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={(event) => {
                                  const next = new Set(field.value ?? []);
                                  if (event.target.checked) {
                                    next.add(state);
                                  } else {
                                    next.delete(state);
                                  }
                                  field.onChange(Array.from(next));
                                }}
                              />
                              <span>{state}</span>
                            </label>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">種類</p>
                <Controller
                  name="types"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {typeOptions.map((type) => {
                        const checked = field.value?.includes(type) ?? false;
                        return (
                          <label
                            key={type}
                            className={cn(
                              "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                              checked
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-neutral-900",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={(event) => {
                                const next = new Set(field.value ?? []);
                                if (event.target.checked) {
                                  next.add(type);
                                } else {
                                  next.delete(type);
                                }
                                field.onChange(Array.from(next));
                              }}
                            />
                            <span>{type}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">倉庫</p>
                <Controller
                  name="warehouses"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {warehouseOptions.map((warehouse) => {
                        const checked = field.value?.includes(warehouse) ?? false;
                        return (
                          <label
                            key={warehouse}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                              checked
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-neutral-900",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={(event) => {
                                const next = new Set(field.value ?? []);
                                if (event.target.checked) {
                                  next.add(warehouse);
                                } else {
                                  next.delete(warehouse);
                                }
                                field.onChange(Array.from(next));
                              }}
                            />
                            <span className="truncate">{warehouse}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="panelColor"
                control={control}
                render={({ field }) => (
                  <Select
                    label="パネル色"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  >
                    <option value="">指定なし</option>
                    {panelColorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </Select>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="最小価格"
                  aria-label="最小価格"
                  {...register("priceMin")}
                />
                <Input
                  type="number"
                  placeholder="最大価格"
                  aria-label="最大価格"
                  {...register("priceMax")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleReset}>
                リセット
              </Button>
              <Button type="submit">適用</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white px-0 pb-2 pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="px-4">
              <DialogTitle className="px-0">検索・絞り込み</DialogTitle>
              <DialogDescription className="mt-1 px-0">
                キーワードと条件をまとめて指定できます。
              </DialogDescription>
            </div>

            <div className="px-4">
              <Input
                placeholder="機種名・メーカー・倉庫・価格などを横断検索"
                className="h-12 rounded-full"
                {...register("keyword")}
              />
            </div>

            <div className="space-y-6 px-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">メーカー</p>
                  <Controller
                    name="makers"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {makerOptions.map((maker) => {
                          const checked = field.value?.includes(maker) ?? false;
                          return (
                            <label
                              key={maker}
                              className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                                checked
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-slate-50 text-neutral-900",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={(event) => {
                                  const next = new Set(field.value ?? []);
                                  if (event.target.checked) {
                                    next.add(maker);
                                  } else {
                                    next.delete(maker);
                                  }
                                  field.onChange(Array.from(next));
                                }}
                              />
                              <span>{maker}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">状態</p>
                  <Controller
                    name="states"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {stateOptions.map((state) => {
                          const checked = field.value?.includes(state) ?? false;
                          return (
                            <label
                              key={state}
                              className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                                checked
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-slate-50 text-neutral-900",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={(event) => {
                                  const next = new Set(field.value ?? []);
                                  if (event.target.checked) {
                                    next.add(state);
                                  } else {
                                    next.delete(state);
                                  }
                                  field.onChange(Array.from(next));
                                }}
                              />
                              <span>{state}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">種類</p>
                <Controller
                  name="types"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {typeOptions.map((type) => {
                        const checked = field.value?.includes(type) ?? false;
                        return (
                          <label
                            key={type}
                            className={cn(
                              "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                              checked
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-neutral-900",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={(event) => {
                                const next = new Set(field.value ?? []);
                                if (event.target.checked) {
                                  next.add(type);
                                } else {
                                  next.delete(type);
                                }
                                field.onChange(Array.from(next));
                              }}
                            />
                            <span>{type}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">倉庫</p>
                <Controller
                  name="warehouses"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {warehouseOptions.map((warehouse) => {
                        const checked = field.value?.includes(warehouse) ?? false;
                        return (
                          <label
                            key={warehouse}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                              checked
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-neutral-900",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={(event) => {
                                const next = new Set(field.value ?? []);
                                if (event.target.checked) {
                                  next.add(warehouse);
                                } else {
                                  next.delete(warehouse);
                                }
                                field.onChange(Array.from(next));
                              }}
                            />
                            <span className="truncate">{warehouse}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="panelColor"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="パネル色"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                    >
                      <option value="">指定なし</option>
                      {panelColorOptions.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </Select>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="最小価格"
                    aria-label="最小価格"
                    {...register("priceMin")}
                  />
                  <Input
                    type="number"
                    placeholder="最大価格"
                    aria-label="最大価格"
                    {...register("priceMax")}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 pt-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                リセット
              </Button>
              <Button type="submit">適用</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
