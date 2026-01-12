import { inflateSync } from "node:zlib";

export type KentuuParseSuccess = {
  numbers: string[];
  detectedFormat: "single" | "multi" | "unknown";
  debug?: {
    pages: number;
    hasText: boolean;
  };
};

export type KentuuParseFailure = {
  errorCode: "NO_TEXT_LAYER" | "PARSE_FAILED" | "UNSUPPORTED";
  message: string;
};

const normalizeDigits = (value: string) =>
  value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));

const KEYWORD_PATTERN =
  /(?:No\.?|番号|遊技盤番号|枠番号|主基板番号)\s*[:：]?\s*([0-9]{4,8})/gi;
const GENERIC_PATTERN = /\b[0-9]{4,8}\b/g;

const extractNumbers = (text: string): string[] => {
  const normalized = normalizeDigits(text);
  const seen = new Set<string>();
  const results: string[] = [];

  const pushUnique = (value: string) => {
    if (!value) return;
    if (seen.has(value)) return;
    seen.add(value);
    results.push(value);
  };

  for (const match of normalized.matchAll(KEYWORD_PATTERN)) {
    pushUnique(match[1] ?? "");
  }

  for (const match of normalized.matchAll(GENERIC_PATTERN)) {
    pushUnique(match[0] ?? "");
  }

  return results;
};

const decodePdfString = (value: string) =>
  value
    .replace(/\\([\\()nrtbf])/g, (_match, char) => {
      switch (char) {
        case "n":
          return "\n";
        case "r":
          return "\r";
        case "t":
          return "\t";
        case "b":
          return "\b";
        case "f":
          return "\f";
        default:
          return char;
      }
    })
    .replace(/\\(\d{1,3})/g, (_match, octal) => String.fromCharCode(Number.parseInt(octal, 8)));

const extractTextFromContent = (content: string) => {
  const textFragments: string[] = [];
  const tjRegex = /\(([^()]*)\)\s*Tj/g;
  const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
  let match: RegExpExecArray | null;

  while ((match = tjRegex.exec(content)) !== null) {
    textFragments.push(decodePdfString(match[1] ?? ""));
  }

  while ((match = tjArrayRegex.exec(content)) !== null) {
    const arrayContent = match[1] ?? "";
    const arrayText = Array.from(arrayContent.matchAll(/\(([^()]*)\)/g))
      .map((item) => decodePdfString(item[1] ?? ""))
      .join("");
    if (arrayText) textFragments.push(arrayText);
  }

  return textFragments.join(" ");
};

const extractTextFromPdf = (buffer: Buffer) => {
  const textSegments: string[] = [];
  let offset = 0;
  const streamToken = Buffer.from("stream");
  const endStreamToken = Buffer.from("endstream");

  while (offset < buffer.length) {
    const streamIndex = buffer.indexOf(streamToken, offset);
    if (streamIndex === -1) break;
    const endStreamIndex = buffer.indexOf(endStreamToken, streamIndex);
    if (endStreamIndex === -1) break;

    let start = streamIndex + streamToken.length;
    if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) {
      start += 2;
    } else if (buffer[start] === 0x0a) {
      start += 1;
    }

    const streamData = buffer.slice(start, endStreamIndex);
    const headerStart = Math.max(0, streamIndex - 2048);
    const header = buffer.slice(headerStart, streamIndex).toString("latin1");
    const isFlate = /\/Filter\s*\/FlateDecode/.test(header);
    let decoded = streamData;
    if (isFlate) {
      try {
        decoded = inflateSync(streamData);
      } catch (error) {
        console.warn("Failed to inflate PDF stream", error);
      }
    }
    const content = decoded.toString("latin1");
    const extracted = extractTextFromContent(content);
    if (extracted.trim()) textSegments.push(extracted);
    offset = endStreamIndex + endStreamToken.length;
  }

  return textSegments.join(" ").trim();
};

export const parseKentuuPdf = async (buffer: Buffer): Promise<KentuuParseSuccess | KentuuParseFailure> => {
  try {
    const text = extractTextFromPdf(buffer);
    const trimmed = text.replace(/\s+/g, " ").trim();
    const hasText = trimmed.length > 10;
    const pages = (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;

    if (!hasText) {
      return {
        errorCode: "NO_TEXT_LAYER",
        message: "PDFに文字情報がありません。",
      };
    }

    const numbers = extractNumbers(trimmed);
    const detectedFormat = numbers.length === 0 ? "unknown" : numbers.length === 1 ? "single" : "multi";

    return {
      numbers,
      detectedFormat,
      debug: {
        pages,
        hasText,
      },
    };
  } catch (error) {
    console.error("Failed to parse kentuu PDF", error);
    return {
      errorCode: "PARSE_FAILED",
      message: "PDFの解析に失敗しました。",
    };
  }
};
