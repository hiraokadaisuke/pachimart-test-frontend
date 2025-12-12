export type TradeMessage = {
  sender: string;
  body: string;
  timestamp: string;
};

const SAMPLE_MESSAGES: TradeMessage[] = [
  {
    sender: "営業担当",
    body: "ご連絡ありがとうございます。書類が整い次第、こちらで確認いたします。",
    timestamp: "2025/11/19 10:15",
  },
  {
    sender: "相手先",
    body: "発送予定日を1日後ろ倒しにしてください。",
    timestamp: "2025/11/19 12:32",
  },
  {
    sender: "営業担当",
    body: "承知しました。スケジュールを更新しました。",
    timestamp: "2025/11/19 12:45",
  },
];

const TRADE_MESSAGES: Record<string, TradeMessage[]> = {
  "S-2025110101": SAMPLE_MESSAGES,
  "S-2025102803": SAMPLE_MESSAGES,
  "S-2025101507": SAMPLE_MESSAGES,
  "S-2025092004": SAMPLE_MESSAGES,
  "S-2025081208": SAMPLE_MESSAGES,
  "P-2025110501": SAMPLE_MESSAGES,
  "P-2025103008": SAMPLE_MESSAGES,
  "P-2025101204": SAMPLE_MESSAGES,
  "P-2025092506": SAMPLE_MESSAGES,
  "P-2025081803": SAMPLE_MESSAGES,
  "T-2025111901": SAMPLE_MESSAGES,
  "T-2025111902": SAMPLE_MESSAGES,
  "T-2025111801": SAMPLE_MESSAGES,
  "T-2025111802": SAMPLE_MESSAGES,
  "T-2025111701": SAMPLE_MESSAGES,
  "T-2025111702": SAMPLE_MESSAGES,
  "T-2025111601": SAMPLE_MESSAGES,
  "T-2025111602": SAMPLE_MESSAGES,
};

export function getMessagesForTrade(tradeId: string | null | undefined): TradeMessage[] {
  if (!tradeId) return [];
  return TRADE_MESSAGES[tradeId] ?? SAMPLE_MESSAGES;
}
