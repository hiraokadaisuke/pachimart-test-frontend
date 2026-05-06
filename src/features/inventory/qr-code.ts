import type { InventoryItemType } from "@prisma/client";

export type QrParseResult = {
  normalizedRawQr: string;
  displayCodeCandidate: string | null;
  parsedQr: Record<string, unknown> | null;
  confidence: "low" | "medium" | "high";
};

export const normalizeDisplayCode = (input: string | null | undefined): string => {
  return String(input ?? "").trim().replace(/\s+/g, " ");
};

export const buildDisplayCodeCandidate = (rawQr: string, itemType: InventoryItemType): string | null => {
  const normalized = normalizeDisplayCode(rawQr);
  if (!normalized) return null;
  if (itemType === "SLOT") return normalized;
  return null;
};

export const parseMachineQr = (rawQr: string, itemType: InventoryItemType): QrParseResult => {
  const normalizedRawQr = normalizeDisplayCode(rawQr);
  if (!normalizedRawQr) {
    return { normalizedRawQr: "", displayCodeCandidate: null, parsedQr: null, confidence: "low" };
  }

  const displayCodeCandidate = buildDisplayCodeCandidate(normalizedRawQr, itemType);

  const p2Match = normalizedRawQr.match(/^P2([A-Z]{2})(\d{3})(\d+)$/);
  if (itemType === "PACHINKO" && p2Match) {
    return {
      normalizedRawQr,
      displayCodeCandidate,
      parsedQr: { family: p2Match[1], lot: p2Match[2], serial_guess: p2Match[3], inferred_format: "P2" },
      confidence: "medium",
    };
  }

  return { normalizedRawQr, displayCodeCandidate, parsedQr: null, confidence: itemType === "SLOT" ? "high" : "low" };
};
