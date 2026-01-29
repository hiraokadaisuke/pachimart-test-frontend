import { redirect } from "next/navigation";

type InventoryRedirectProps = {
  params: { path?: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
};

const buildSearchParams = (searchParams?: Record<string, string | string[] | undefined>) => {
  if (!searchParams) return "";
  const entries = Object.entries(searchParams).flatMap(([key, value]) => {
    if (typeof value === "undefined") return [];
    if (Array.isArray(value)) return value.map((item) => [key, item]);
    return [[key, value]];
  });
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
};

export default function InventoryRedirectPage({ params, searchParams }: InventoryRedirectProps) {
  const path = params.path?.join("/") ?? "";
  const suffix = path ? `/${path}` : "";
  const query = buildSearchParams(searchParams);
  redirect(`/sales${suffix}${query}`);
}
