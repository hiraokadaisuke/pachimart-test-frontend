import { redirect } from "next/navigation";

import { SellForm } from "@/components/exhibits/SellForm";
import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import MyPageLayout from "@/components/layout/MyPageLayout";

type ExhibitType = "PACHINKO" | "SLOT";

const typeMap: Record<string, ExhibitType> = {
  pachinko: "PACHINKO",
  slot: "SLOT",
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const toPositiveInt = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export default function NewExhibitFormPage({
  params,
  searchParams,
}: {
  params: { type?: string };
  searchParams?: SearchParams;
}) {
  const routeType = params?.type ? typeMap[params.type] : undefined;

  if (!routeType) {
    redirect("/market/mypage/exhibits/new");
  }

  const initialFromInventory = searchParams
    ? {
        inventoryItemId: first(searchParams.inventoryItemId) ?? "",
        maker: first(searchParams.makerName) ?? "",
        machineName: first(searchParams.modelName) ?? "",
        frameColor: first(searchParams.frameColor) ?? "",
        quantity: toPositiveInt(first(searchParams.quantity)),
        unitPriceExclTax: toPositiveInt(first(searchParams.unitPriceExclTax)),
        storageLocationId: first(searchParams.storageLocationId) ?? "",
        note: first(searchParams.note) ?? "",
      }
    : undefined;

  return (
    <MyPageLayout subTabs={<ExhibitSubTabs activeTab="new" />} compact>
      <SellForm exhibitType={routeType} initialFromInventory={initialFromInventory} />
    </MyPageLayout>
  );
}
