export type BuyerInfo = {
  id: string;
  label: string;
  postalCode: string;
  address: string;
  corporate: string;
  representative: string;
  tel: string;
  fax: string;
};

export const BUYER_OPTIONS: BuyerInfo[] = [
  {
    id: "p-kanriclub",
    label: "p-kanriclub",
    postalCode: "〒169-0075",
    address: "東京都新宿区高田馬場4-4-17",
    corporate: "p-kanriclub",
    representative: "代表取締役 田村綾子",
    tel: "TEL 03-5389-1955",
    fax: "FAX 03-5389-1956",
  },
  {
    id: "p-kanriclub-branch",
    label: "p-kanriclub（札幌支店）",
    postalCode: "〒060-0001",
    address: "北海道札幌市中央区北一条西2-1",
    corporate: "p-kanriclub 札幌支店",
    representative: "支店長 佐藤優",
    tel: "TEL 011-000-1111",
    fax: "FAX 011-000-2222",
  },
  {
    id: "p-kanriclub-osaka",
    label: "p-kanriclub（大阪営業所）",
    postalCode: "〒530-0001",
    address: "大阪府大阪市北区梅田1-1-1",
    corporate: "p-kanriclub 大阪営業所",
    representative: "所長 鈴木健一",
    tel: "TEL 06-0000-3333",
    fax: "FAX 06-0000-4444",
  },
];

export const findBuyerById = (id?: string | null): BuyerInfo => {
  if (!id) return BUYER_OPTIONS[0];
  return BUYER_OPTIONS.find((entry) => entry.id === id) ?? BUYER_OPTIONS[0];
};
