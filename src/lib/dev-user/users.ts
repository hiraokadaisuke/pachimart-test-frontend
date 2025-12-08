export const DEV_USERS = {
  A: {
    key: "A",
    id: "user-a",
    label: "ユーザーA",
  },
  B: {
    key: "B",
    id: "user-b",
    label: "ユーザーB",
  },
} as const;

export type DevUserKey = keyof typeof DEV_USERS;
