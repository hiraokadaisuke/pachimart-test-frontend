import { normalizeDisplayCode } from "@/features/inventory/qr-code";

export type OutboundUnitCheckResult = "MATCHED" | "QR_MATCHED" | "MISMATCH" | "NOT_CHECKED" | "NO_UNIT";

export function evaluateOutboundUnitCheck(input: {
  unitDisplayCode?: string | null;
  unitRawQr?: string | null;
  displayCodeInput?: string | null;
  rawQrInput?: string | null;
}): { result: OutboundUnitCheckResult; matchedBy: "DISPLAY_CODE" | "RAW_QR" | null; warning: string | null } {
  if (!input.unitDisplayCode && !input.unitRawQr) {
    return { result: "NO_UNIT", matchedBy: null, warning: "対象Unitが未紐づきです。" };
  }

  const normalizedDisplayInput = normalizeDisplayCode(input.displayCodeInput ?? "");
  const normalizedUnitDisplayCode = normalizeDisplayCode(input.unitDisplayCode ?? "");
  const rawQrInput = String(input.rawQrInput ?? "").trim();
  const unitRawQr = String(input.unitRawQr ?? "").trim();

  if (!normalizedDisplayInput && !rawQrInput) {
    return { result: "NOT_CHECKED", matchedBy: null, warning: "照合用の番号またはQRを入力してください。" };
  }

  if (normalizedDisplayInput && normalizedUnitDisplayCode && normalizedDisplayInput === normalizedUnitDisplayCode) {
    return { result: "MATCHED", matchedBy: "DISPLAY_CODE", warning: null };
  }

  if (rawQrInput && unitRawQr && normalizeDisplayCode(rawQrInput) === normalizeDisplayCode(unitRawQr)) {
    return { result: "QR_MATCHED", matchedBy: "RAW_QR", warning: "QR一致です（補助一致）。可能なら番号も確認してください。" };
  }

  return { result: "MISMATCH", matchedBy: null, warning: "入力内容が対象Unitと一致しません。" };
}
