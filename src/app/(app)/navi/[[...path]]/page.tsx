import { redirect } from "next/navigation";

// ⚠️ Legacy route redirect: /navi moved under /market/navi.
// Routing change warning intentionally kept per request.
export default function LegacyNaviRedirect({
  params,
  searchParams,
}: {
  params: { path?: string[] };
  searchParams?: Record<string, string | string[]>;
}) {
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
