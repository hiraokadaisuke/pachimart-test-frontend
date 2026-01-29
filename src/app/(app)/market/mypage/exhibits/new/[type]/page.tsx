import { redirect } from "next/navigation";

import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import MyPageLayout from "@/components/layout/MyPageLayout";
import { SellForm } from "@/components/exhibits/SellForm";

type ExhibitType = "PACHINKO" | "SLOT";

const typeMap: Record<string, ExhibitType> = {
  pachinko: "PACHINKO",
  slot: "SLOT",
};

export default function NewExhibitFormPage({ params }: { params: { type?: string } }) {
  const routeType = params?.type ? typeMap[params.type] : undefined;

  if (!routeType) {
    redirect("/market/mypage/exhibits/new");
  }

  return (
    <MyPageLayout subTabs={<ExhibitSubTabs activeTab="new" />} compact>
      <SellForm exhibitType={routeType} />
    </MyPageLayout>
  );
}
