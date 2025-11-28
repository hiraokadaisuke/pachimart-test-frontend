import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function ExhibitUserColorPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="出品者色分け"
        description="出品者ごとに色分けする表示設定のスタブです。ラベル管理や表示ルールをここにまとめます。"
      />
    </div>
  );
}
