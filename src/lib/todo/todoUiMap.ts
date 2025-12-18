import { TodoKind } from "./todoKinds";

export type TodoUiDef = {
  section: "approval" | "payment" | "confirmation" | "completed" | "canceled";
  title: string;
  description: {
    buyer: string;
    seller: string;
  };
  primaryAction?: {
    label: string;
    role: "buyer" | "seller";
    nextTodo?: TodoKind;
  };
};

export const todoUiMap: Record<TodoKind, TodoUiDef> = {
  application_sent: {
    section: "approval",
    title: "承認待ち",
    description: {
      buyer: "売主から依頼が届いています。内容を確認し、承認してください。",
      seller: "依頼を送りました。買主様からの承認をお待ちください。",
    },
    primaryAction: {
      label: "承認",
      role: "buyer",
      nextTodo: "application_approved",
    },
  },

  application_approved: {
    section: "payment",
    title: "入金待ち",
    description: {
      buyer: "発送予定日までに振込をお願いします。",
      seller: "買主様からの入金をお待ちください。",
    },
    primaryAction: {
      label: "入金完了",
      role: "buyer",
      nextTodo: "payment_confirmed",
    },
  },

  payment_confirmed: {
    section: "confirmation",
    title: "確認待ち",
    description: {
      buyer: "動作確認を行い、問題なければ完了してください。",
      seller: "買主様の確認をお待ちください。",
    },
    primaryAction: {
      label: "確認完了",
      role: "buyer",
      nextTodo: "trade_completed",
    },
  },

  trade_completed: {
    section: "completed",
    title: "完了",
    description: {
      buyer: "取引が完了しました。",
      seller: "取引が完了しました。",
    },
  },

  trade_canceled: {
    section: "canceled",
    title: "キャンセル",
    description: {
      buyer: "この取引はキャンセルされました。",
      seller: "この取引はキャンセルされました。",
    },
  },

  x_test_shipping_address_fix: {
    section: "approval",
    title: "住所修正（テスト）",
    description: {
      buyer: "発送先住所の確認・修正をしてください。（テスト用拡張）",
      seller: "買主様の住所修正対応をお待ちください。（テスト用拡張）",
    },
  },
};
