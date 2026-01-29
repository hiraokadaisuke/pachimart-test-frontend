import type { InventoryModelMaster } from "../mockMasters";

export type ParsedQrPayload = {
  tokens: string[];
  extracted: {
    makerTokens: string[];
    modelNumbers: string[];
    numericStrings: string[];
  };
};

export type SuggestedModel = {
  id: string;
  maker: string;
  model: string;
  score: number;
  reasons: string[];
};

const normalize = (value: string) => value.trim();
const normalizeUpper = (value: string) => normalize(value).toUpperCase();

export function parseQrRaw(qrRaw: string): ParsedQrPayload {
  const normalized = normalize(qrRaw);
  const upper = normalizeUpper(qrRaw);
  const tokens = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  const modelNumbers = Array.from(upper.matchAll(/[A-Z]{1,4}-?\d{2,5}[A-Z0-9-]*/g)).map(
    (match) => match[0],
  );
  const numericStrings = Array.from(upper.matchAll(/\d{4,}/g)).map((match) => match[0]);

  return {
    tokens,
    extracted: {
      makerTokens: tokens,
      modelNumbers,
      numericStrings,
    },
  };
}

export function suggestModels(qrRaw: string, master: InventoryModelMaster[]): SuggestedModel[] {
  if (!qrRaw.trim()) return [];
  const upperRaw = normalizeUpper(qrRaw);
  const parsed = parseQrRaw(qrRaw);

  const suggestions = master
    .map((entry) => {
      const reasons: string[] = [];
      let score = 0;

      const makerUpper = normalizeUpper(entry.maker);
      if (upperRaw.includes(makerUpper)) {
        score += 4;
        reasons.push(`${entry.maker}一致`);
      }

      const modelUpper = normalizeUpper(entry.model);
      if (upperRaw.includes(modelUpper)) {
        score += 3;
        reasons.push("機種名一致");
      }

      entry.aliases?.forEach((alias) => {
        const aliasUpper = normalizeUpper(alias);
        if (upperRaw.includes(aliasUpper)) {
          score += 2;
          reasons.push(`別名:${alias}`);
        }
      });

      entry.keywords?.forEach((keyword) => {
        const keywordUpper = normalizeUpper(keyword);
        if (upperRaw.includes(keywordUpper)) {
          score += 1;
          reasons.push(`キーワード:${keyword}`);
        }
      });

      entry.modelNumbers?.forEach((modelNumber) => {
        const modelNumberUpper = normalizeUpper(modelNumber);
        if (upperRaw.includes(modelNumberUpper)) {
          score += 2;
          reasons.push(`型番:${modelNumber}`);
        }
      });

      parsed.extracted.modelNumbers.forEach((token) => {
        if (entry.modelNumbers?.some((model) => normalizeUpper(model).includes(token))) {
          score += 1;
          reasons.push(`検出:${token}`);
        }
      });

      parsed.extracted.numericStrings.forEach((token) => {
        if (upperRaw.includes(token)) {
          score += 0.5;
        }
      });

      if (score === 0) return null;

      return {
        id: entry.id,
        maker: entry.maker,
        model: entry.model,
        score,
        reasons: Array.from(new Set(reasons)),
      } as SuggestedModel;
    })
    .filter((entry): entry is SuggestedModel => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return suggestions;
}
