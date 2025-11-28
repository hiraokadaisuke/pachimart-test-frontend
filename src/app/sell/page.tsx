import MyPageLayout from "@/components/layout/MyPageLayout";
import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import { SellForm } from "@/components/exhibits/SellForm";

export default function SellPage() {
  return (
    <MyPageLayout subTabs={<ExhibitSubTabs activeTab="new" />}>
      <SellForm />
    </MyPageLayout>
  );
}
