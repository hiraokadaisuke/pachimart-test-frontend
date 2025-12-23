import React from "react";

import type { TradeMessage } from "@/lib/messages/transform";

type Props = {
  open: boolean;
  tradeId?: string | null;
  messages: TradeMessage[];
  onClose: () => void;
};

export function TradeMessageModal({ open, tradeId, messages, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold text-[#142B5E]">取引ID</p>
            <h2 className="text-base font-bold text-neutral-900">{tradeId ?? "-"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-sm font-semibold text-neutral-700 hover:bg-slate-100"
          >
            閉じる
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-4 py-3 text-sm text-neutral-900">
          {messages.length === 0 ? (
            <p className="text-neutral-700">現取引メッセージはまだありません。</p>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.timestamp}-${index}`} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="font-semibold text-[#142B5E]">{message.sender}</span>
                  <span>{message.timestamp}</span>
                </div>
                <p className="mt-1 whitespace-pre-line leading-relaxed text-neutral-900">{message.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
