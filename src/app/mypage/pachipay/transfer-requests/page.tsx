import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";

export default function PachipayTransferRequestsPage() {
  return (
    <div className="space-y-6">
      <PachipayInfoCard
        title="パチマートからの出金申請"
        description="出金申請の一覧と申請フローを扱うスタブです。今後の実装で申請状況を確認できるようにします。"
      />
    </div>
  );
}
