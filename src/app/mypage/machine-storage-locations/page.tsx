import SettingsSubTabs from "@/components/mypage/SettingsSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function MachineStorageLocationsPage() {
  return (
    <div className="space-y-6">
      <SettingsSubTabs />
      <MyPageStubPage
        title="倉庫設定"
        description="遊技機の保管・出庫拠点を管理するためのスタブ画面です。"
      />
    </div>
  );
}
