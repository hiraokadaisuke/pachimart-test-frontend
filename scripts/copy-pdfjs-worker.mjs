import { mkdir, copyFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const candidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.mjs",
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
];

const resolveCandidate = async () => {
  for (const candidate of candidates) {
    const fullPath = path.join(ROOT, candidate);
    try {
      await access(fullPath, constants.F_OK);
      return fullPath;
    } catch {
      continue;
    }
  }
  return null;
};

const main = async () => {
  const source = await resolveCandidate();
  if (!source) {
    throw new Error(
      "pdfjs-dist worker file not found. Expected one of: " + candidates.join(", "),
    );
  }
  const targetDir = path.join(ROOT, "public", "pdfjs");
  await mkdir(targetDir, { recursive: true });
  const target = path.join(targetDir, "pdf.worker.min.mjs");
  await copyFile(source, target);
  console.log(`[pdfjs] Copied worker from ${source} to ${target}`);
};

await main();
