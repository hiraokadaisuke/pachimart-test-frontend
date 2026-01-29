import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function CompanyEditPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="企業情報の設定"
        description="企業情報を編集するスタブです。会社名・所在地・連絡先などの管理画面を想定しています。"
      />
    </div>
  );
}
