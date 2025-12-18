import { TradeStatus } from "./types";

export function getInProgressDescription(kind: "buy" | "sell", status: TradeStatus): string {
  switch (status) {
    case "APPROVAL_REQUIRED":
      return kind === "buy"
        ? "売主から依頼が届いています。発送先と担当者を入力して承認してください。"
        : "依頼を送りました。買主様からの承認をお待ちください。";
    case "PAYMENT_REQUIRED":
      return kind === "buy" ? "発送予定日までに振込をお願いします。" : "買主様からの入金をお待ちください。";
    case "CONFIRM_REQUIRED":
      return kind === "buy"
        ? "動作確認を行い、「確認完了」を押してください。"
        : "買主様からの入金がありました。発送をしてください。";
    case "COMPLETED":
      return "取引が完了しました。";
    case "CANCELED":
      return "取引がキャンセルされました。";
  }
}
