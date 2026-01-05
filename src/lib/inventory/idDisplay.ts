export const formatShortId = (value: string, suffixLength = 4): string => {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const parts = trimmed.split("-");
  if (parts.length === 1) {
    return trimmed.slice(-suffixLength);
  }
  const suffix = parts[parts.length - 1];
  const prefix = parts.slice(0, -1).join("-");
  return `${prefix}-${suffix.slice(-suffixLength)}`;
};
