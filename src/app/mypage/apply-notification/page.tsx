import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function ApplyNotificationPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="取引情報通知先"
        description="取引情報の通知先を設定するスタブです。メールやSlackなどの連携先をここで管理します。"
      />
    </div>
  );
}
