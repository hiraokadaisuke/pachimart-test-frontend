import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import MyPageStubPage from "@/components/mypage/MyPageStubPage";

export default function NewExhibitPage() {
  return (
    <div className="space-y-6">
      <ExhibitSubTabs activeTab="new" />
      <MyPageStubPage
        title="新規出品"
        description="本番パチマートの新規出品作成フローに対応するスタブです。今後ここから商品登録フォームに遷移できるようにします。"
      />
    </div>
  );
}
