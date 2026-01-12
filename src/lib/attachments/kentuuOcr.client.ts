import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";

import { getAttachment } from "./attachmentStore";
import type { KentuuCandidate } from "./kentuuOcr";

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

const TESSERACT_VERSION = "5.1.0";

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const loadPdfjs = async (): Promise<PdfjsModule> => {
  if (typeof window === "undefined") {
    throw new Error("OCRはブラウザでのみ実行できます。");
  }
  const existing = (window as typeof window & { pdfjsLib?: PdfjsModule }).pdfjsLib;
  if (existing) return existing;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  (window as typeof window & { pdfjsLib?: PdfjsModule }).pdfjsLib = pdfjs;
  return pdfjs;
};

const loadTesseract = async () => {
  const existing = (window as typeof window & { Tesseract?: any }).Tesseract;
  if (existing) return existing;
  const scriptUrl = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;
  await loadScript(scriptUrl);
  const tesseract = (window as typeof window & { Tesseract?: any }).Tesseract;
  if (!tesseract) {
    throw new Error("tesseract.js library failed to load.");
  }
  return tesseract;
};

type OcrMode = "single" | "list";

const buildCandidateId = (index: number) => `candidate-${index + 1}`;

type PdfTextContentItem = TextItem | TextMarkedContent;

const hasStr = (item: PdfTextContentItem): item is TextItem => "str" in item;

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ ]{2,}/g, " ")
    .replace(/　/g, " ")
    .trim();

const extractTokens = (text: string) =>
  (text.match(/[A-Z0-9][A-Z0-9\-/]+/gi) ?? []).map((token) => token.trim());

const dedupeCandidates = (candidates: KentuuCandidate[]) => {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.board}|${candidate.frame}|${candidate.main}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildCandidatesFromText = (text: string): KentuuCandidate[] => {
  const lines = normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const lineCandidates: KentuuCandidate[] = [];
  lines.forEach((line) => {
    const tokens = extractTokens(line);
    if (tokens.length >= 3) {
      lineCandidates.push({
        id: buildCandidateId(lineCandidates.length),
        board: tokens[0] ?? "",
        frame: tokens[1] ?? "",
        main: tokens[2] ?? "",
      });
    }
  });

  if (lineCandidates.length > 0) {
    return dedupeCandidates(lineCandidates);
  }

  const allTokens = extractTokens(text);
  const grouped: KentuuCandidate[] = [];
  for (let index = 0; index < allTokens.length; index += 3) {
    const chunk = allTokens.slice(index, index + 3);
    if (chunk.length < 3) break;
    grouped.push({
      id: buildCandidateId(grouped.length),
      board: chunk[0] ?? "",
      frame: chunk[1] ?? "",
      main: chunk[2] ?? "",
    });
  }
  return dedupeCandidates(grouped);
};

const selectOcrRegion = (width: number, height: number, mode: OcrMode) => {
  if (mode === "list") {
    return {
      x: width * 0.05,
      y: height * 0.2,
      w: width * 0.9,
      h: height * 0.7,
    };
  }
  return {
    x: width * 0.05,
    y: height * 0.6,
    w: width * 0.9,
    h: height * 0.35,
  };
};

export const extractKentuuCandidates = async (attachmentId: string): Promise<KentuuCandidate[]> => {
  if (typeof window === "undefined") {
    throw new Error("OCRはブラウザでのみ実行できます。");
  }
  const record = await getAttachment(attachmentId);
  if (!record) return [];

  let pdfjs: PdfjsModule;
  try {
    pdfjs = await loadPdfjs();
  } catch (error) {
    console.error("Failed to load pdf.js", error);
    throw new Error("PDFライブラリの読み込みに失敗しました。");
  }

  const arrayBuffer = await record.blob.arrayBuffer();
  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  } catch (error) {
    console.error("Failed to load PDF", error);
    throw new Error("PDFの読み込みに失敗しました。");
  }

  let hasListPageHint = false;
  try {
    const firstPage = await pdf.getPage(1);
    const textContent = await firstPage.getTextContent();
    const firstText = (textContent.items as PdfTextContentItem[])
      .map((item) => (hasStr(item) ? item.str : ""))
      .join(" ");
    hasListPageHint = /別紙|製造番号一覧|別途/.test(firstText);
  } catch (error) {
    console.error("Failed to extract text from PDF", error);
    throw new Error("PDFからテキストを抽出できませんでした。");
  }

  const useListPage = hasListPageHint && pdf.numPages > 1;
  const targetPageNumber = useListPage ? pdf.numPages : 1;
  let page: Awaited<ReturnType<typeof pdf.getPage>>;
  try {
    page = await pdf.getPage(targetPageNumber);
  } catch (error) {
    console.error("Failed to load target page", error);
    throw new Error("対象ページの読み込みに失敗しました。");
  }

  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("描画用のキャンバスを生成できませんでした。");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  try {
    await page.render({ canvasContext: context, viewport }).promise;
  } catch (error) {
    console.error("Failed to render PDF page", error);
    throw new Error("PDFの描画に失敗しました。");
  }

  const region = selectOcrRegion(viewport.width, viewport.height, useListPage ? "list" : "single");
  const cropCanvas = document.createElement("canvas");
  const cropContext = cropCanvas.getContext("2d");
  if (!cropContext) {
    throw new Error("OCR用のキャンバスを生成できませんでした。");
  }

  cropCanvas.width = region.w;
  cropCanvas.height = region.h;
  cropContext.drawImage(
    canvas,
    region.x,
    region.y,
    region.w,
    region.h,
    0,
    0,
    region.w,
    region.h,
  );

  let recognizedText = "";
  try {
    const tesseract = await loadTesseract();
    const worker = await tesseract.createWorker("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/",
      preserve_interword_spaces: "1",
    });
    const result = await worker.recognize(cropCanvas);
    await worker.terminate();
    recognizedText = result.data.text ?? "";
  } catch (error) {
    console.error("Failed to run OCR", error);
    throw new Error("OCRエンジンの処理に失敗しました。");
  }

  if (!recognizedText.trim()) {
    throw new Error("画像からテキストを抽出できませんでした。");
  }

  const candidates = buildCandidatesFromText(recognizedText).slice(0, 10);
  return candidates;
};
