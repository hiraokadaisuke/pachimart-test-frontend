import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="パスワード変更"
        description="ログインパスワードを変更するためのスタブです。安全な認証手順をここに集約します。"
      />
    </div>
  );
}
