import { NextResponse } from "next/server";

const mockSellers = [
  { id: 1, name: "三共商事 東京支店", contactName: "営業部 佐藤", tel: "03-1234-5678" },
  { id: 2, name: "三共商事 大阪支店", contactName: "大阪営業所 田中", tel: "06-2345-6789" },
  { id: 3, name: "北都リサイクル", contactName: "担当 長谷川", tel: "011-876-5432" },
  { id: 4, name: "テストホールディングス", contactName: "営業一課 山本", tel: "052-246-8101" },
  { id: 5, name: "サンプル販売 小倉店", contactName: "松本", tel: "093-654-3210" },
  { id: 6, name: "株式会社パテテック", contactName: "営業部 田中", tel: "03-9876-5432" },
  { id: 7, name: "有限会社テスト商会", contactName: "佐藤", tel: "06-1357-2468" },
  { id: 8, name: "合同会社デモリンク", contactName: "山本", tel: "052-159-3579" },
  { id: 9, name: "アセットソリューションズ", contactName: "営業二課", tel: "045-222-3333" },
  { id: 10, name: "南九州トレーディング", contactName: "鹿児島営業所", tel: "099-111-2222" },
  { id: 11, name: "三共商事 札幌支店", contactName: "札幌営業所", tel: "011-123-4567" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!keyword) {
    return NextResponse.json([]);
  }

  const results = mockSellers.filter((seller) => {
    const joinedFields = `${seller.name}${seller.contactName ?? ""}${seller.tel ?? ""}`.toLowerCase();
    return joinedFields.includes(keyword);
  });

  return NextResponse.json(results.slice(0, 10));
}
