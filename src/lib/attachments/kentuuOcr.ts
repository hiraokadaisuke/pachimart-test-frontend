export type KentuuCandidate = {
  id: string;
  board: string;
  frame: string;
  main: string;
};

export const extractKentuuCandidates = async (attachmentId: string): Promise<KentuuCandidate[]> => {
  if (typeof window === "undefined") {
    throw new Error("OCRはブラウザでのみ実行できます。");
  }
  const module = await import("./kentuuOcr.client");
  return module.extractKentuuCandidates(attachmentId);
};
