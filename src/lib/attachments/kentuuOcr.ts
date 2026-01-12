import { getAttachment } from "./attachmentStore";

export type KentuuCandidate = {
  id: string;
  board: string;
  frame: string;
  main: string;
};

type OcrMode = "single" | "list";

const buildCandidateId = (index: number) => `candidate-${index + 1}`;

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
  const record = await getAttachment(attachmentId);
  if (!record) return [];

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
  const workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const arrayBuffer = await record.blob.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const firstPage = await pdf.getPage(1);
  const textContent = await firstPage.getTextContent();
  const firstText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  const hasListPageHint = /別紙|製造番号一覧|別途/.test(firstText);

  const useListPage = hasListPageHint && pdf.numPages > 1;
  const targetPageNumber = useListPage ? pdf.numPages : 1;
  const page = await pdf.getPage(targetPageNumber);

  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return [];

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;

  const region = selectOcrRegion(viewport.width, viewport.height, useListPage ? "list" : "single");
  const cropCanvas = document.createElement("canvas");
  const cropContext = cropCanvas.getContext("2d");
  if (!cropContext) return [];

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

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/",
    preserve_interword_spaces: "1",
  });
  const result = await worker.recognize(cropCanvas);
  await worker.terminate();

  const candidates = buildCandidatesFromText(result.data.text).slice(0, 10);
  return candidates;
};
