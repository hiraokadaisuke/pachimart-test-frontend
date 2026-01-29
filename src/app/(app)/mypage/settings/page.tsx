import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="設定"
        description="設定エリアのプレースホルダーです。将来のアカウント設定や通知設定をここに集約する予定です。"
      />
    </div>
  );
}
