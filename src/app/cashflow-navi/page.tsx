import { redirect } from "next/navigation";

type SearchParams = { [key: string]: string | string[] | undefined };

const buildSearchString = (searchParams: SearchParams) => {
  const urlSearchParams = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlSearchParams.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => urlSearchParams.append(key, item));
    }
  });

  const query = urlSearchParams.toString();
  return query ? `?${query}` : "";
};

export default function CashflowNaviRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const search = buildSearchString(searchParams);
  redirect(`/payments${search}`);
}
