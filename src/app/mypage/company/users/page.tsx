import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function CompanyUsersPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="社内アカウント管理"
        description="社内メンバーのアカウント管理や権限設定を行う画面のスタブです。"
      />
    </div>
  );
}
