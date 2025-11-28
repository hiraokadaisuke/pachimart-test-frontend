import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";

export default function PachipayVirtualAccountPage() {
  return (
    <div className="space-y-6">
      <PachipayInfoCard
        title="パチマートへの入金口座"
        description="パチマートへの入金口座情報を表示するスタブです。実装時に振込先口座の詳細を案内します。"
      />
    </div>
  );
}
