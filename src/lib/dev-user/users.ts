export type DevUser = {
  key: "A" | "B";
  id: "user-a" | "user-b";
  label: string;
  companyName: string;
  address: string;
  tel: string;
  fax?: string;
  contactName: string;
};

export const DEV_USERS: Record<DevUser["key"], DevUser> = {
  A: {
    key: "A",
    id: "user-a",
    label: "株式会社あいおえお",
    companyName: "株式会社あいおえお",
    address: "東京都千代田区丸の内1-1-1 パチマートビル 10F",
    tel: "03-1234-5678",
    fax: "03-1234-5679",
    contactName: "田中 太郎",
  },
  B: {
    key: "B",
    id: "user-b",
    label: "株式会社かきくけこ",
    companyName: "株式会社かきくけこ",
    address: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
    tel: "06-9876-5432",
    fax: "06-9876-5433",
    contactName: "佐藤 花子",
  },
};

export const DEV_USER_LIST = Object.values(DEV_USERS);

export type DevUserKey = keyof typeof DEV_USERS;

export function getDevUsers() {
  return DEV_USER_LIST;
}

export function findDevUserById(userId: string) {
  return DEV_USER_LIST.find((user) => user.id === userId) ?? null;
}
