import { TradeNaviDraft } from "./types";

const STORAGE_KEY_PREFIX = "navi_draft_";

export function saveNaviDraft(draft: TradeNaviDraft) {
  if (typeof window === "undefined") return;
  const key = STORAGE_KEY_PREFIX + draft.id;
  window.sessionStorage.setItem(key, JSON.stringify(draft));
}

export function loadNaviDraft(id: string): TradeNaviDraft | null {
  if (typeof window === "undefined") return null;
  const key = STORAGE_KEY_PREFIX + id;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TradeNaviDraft;
  } catch {
    return null;
  }
}
