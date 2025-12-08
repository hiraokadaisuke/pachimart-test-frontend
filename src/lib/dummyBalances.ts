export const dummyBalances = [
  { userId: "user-a", plannedPurchase: 1200000, plannedSales: 2100000, available: 1650000 },
  { userId: "user-b", plannedPurchase: 800000, plannedSales: 1800000, available: 990000 },
];

export const dummyTransactions = [
  { id: 1, userId: "user-a", kind: "入金", amount: 500000, date: "2025-12-01" },
  { id: 2, userId: "user-a", kind: "出金", amount: 250000, date: "2025-12-05" },
  { id: 3, userId: "user-b", kind: "入金", amount: 300000, date: "2025-12-02" },
  { id: 4, userId: "user-b", kind: "出金", amount: 150000, date: "2025-12-07" },
];
