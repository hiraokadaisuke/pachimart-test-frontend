import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function UserProfileEditPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="担当者情報の設定"
        description="担当者情報を編集する本番画面のスタブです。氏名や連絡先の更新をここで扱う予定です。"
      />
    </div>
  );
}
