import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";

export default function PachipayTransactionsPage() {
  return (
    <div className="space-y-6">
      <PachipayInfoCard
        title="入出金履歴"
        description="パチマート残高の入出金履歴を表示するスタブページです。振込や出金の履歴をここに集約します。"
      />
    </div>
  );
}
