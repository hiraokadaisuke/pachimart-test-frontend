export type KentuuCandidate = {
  id: string;
  board: string;
  frame: string;
  main: string;
};

export const extractKentuuCandidates = async (): Promise<KentuuCandidate[]> => {
  if (typeof window === "undefined") {
    throw new Error("OCRはブラウザでのみ実行できます。");
  }
  throw new Error("OCRは現在準備中です。");
};
