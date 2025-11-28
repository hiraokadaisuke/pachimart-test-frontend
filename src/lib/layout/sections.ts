export type MyPageSectionKey =
  | "products"
  | "tradeNavi"
  | "notice"
  | "balance"
  | "settings";

export type MyPageSection = {
  key: MyPageSectionKey;
  label: string;
  href: string;
  matchers: string[];
};

export const MY_PAGE_SECTIONS: MyPageSection[] = [
  {
    key: "products",
    label: "商品",
    href: "/mypage/exhibits",
    matchers: ["/mypage/exhibits", "/mypage/drafts"],
  },
  {
    key: "tradeNavi",
    label: "取引Navi",
    href: "/trade-navi",
    matchers: [
      "/trade-navi",
      "/mypage/dealings",
      "/mypage/todo-list",
      "/transactions/navi",
    ],
  },
  {
    key: "notice",
    label: "通知",
    href: "/mypage/pachi-notice",
    matchers: [
      "/mypage/pachi-notice",
      "/mypage/inquiry-messages",
      "/mypage/notices",
    ],
  },
  {
    key: "balance",
    label: "残高",
    href: "/mypage/pachipay/balance",
    matchers: ["/mypage/pachipay"],
  },
  {
    key: "settings",
    label: "設定",
    href: "/mypage/user/profile/edit",
    matchers: [
      "/mypage/user",
      "/mypage/company",
      "/mypage/machine-storage-locations",
      "/mypage/apply-notification",
      "/mypage/exhibit-user-color",
    ],
  },
];
