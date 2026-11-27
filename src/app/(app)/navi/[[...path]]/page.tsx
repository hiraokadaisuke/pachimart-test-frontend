import { redirect } from "next/navigation";

// ⚠️ Legacy route redirect: /navi moved under /market/navi.
// Routing change warning intentionally kept per request.
export default async function LegacyNaviRedirect(
  props: {
    params: Promise<{ path?: string[] }>;
    searchParams?: Promise<Record<string, string | string[]>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const suffix = params.path?.length ? `/${params.path.join("/")}` : "";
  const query = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => query.append(key, entry));
      } else if (value) {
        query.append(key, value);
      }
    }
  }
  const queryString = query.toString();
  redirect(`/market/navi${suffix}${queryString ? `?${queryString}` : ""}`);
}
