import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";

export default function PachipayTradingAccountsPage() {
  return (
    <div className="space-y-6">
      <PachipayInfoCard
        title="振込先口座登録・変更"
        description="本番の振込先口座設定に対応するスタブです。銀行口座の登録や変更を行う画面をここで受け止めます。"
      />
    </div>
  );
}
