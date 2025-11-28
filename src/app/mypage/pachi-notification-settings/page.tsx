import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function PachiNotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="通知設定"
        description="通知設定を管理するスタブです。メール・プッシュなどの受信条件をここで切り替えられる想定です。"
      />
    </div>
  );
}
