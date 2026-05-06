export function buildScanDuplicateWarnings(duplicates: { displayCodeDuplicate: { id: string } | null; rawQrDuplicate: { id: string } | null }) {
  return {
    strongWarning: duplicates.displayCodeDuplicate ? "displayCodeが既存個体と重複しています。現物確認のうえ登録してください。" : null,
    softWarning: duplicates.rawQrDuplicate ? "rawQrが既存個体と重複しています（参考情報）。" : null,
    requiresConfirm: Boolean(duplicates.displayCodeDuplicate),
    existingUnitIds: [duplicates.displayCodeDuplicate?.id, duplicates.rawQrDuplicate?.id].filter((id): id is string => Boolean(id)),
  };
}
