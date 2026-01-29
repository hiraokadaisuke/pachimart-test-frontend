import { NextResponse } from "next/server";

import { parseKentuuPdf, type KentuuParseFailure } from "@/lib/attachments/kentuuParse.server";

export const runtime = "nodejs";

type RequestBody = {
  fileBase64?: string;
  fileName?: string;
};

const decodeBase64 = (input: string): Buffer | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const base64 = trimmed.includes(",") ? trimmed.split(",").pop() ?? "" : trimmed;
  if (!base64) return null;
  try {
    return Buffer.from(base64, "base64");
  } catch (error) {
    console.error("Failed to decode base64", error);
    return null;
  }
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch (error) {
    console.error("Failed to parse request body", error);
    const failure: KentuuParseFailure = {
      errorCode: "UNSUPPORTED",
      message: "リクエスト形式が正しくありません。",
    };
    return NextResponse.json(failure, { status: 400 });
  }

  if (!body.fileBase64) {
    const failure: KentuuParseFailure = {
      errorCode: "UNSUPPORTED",
      message: "PDFデータが見つかりません。",
    };
    return NextResponse.json(failure, { status: 400 });
  }

  const buffer = decodeBase64(body.fileBase64);
  if (!buffer) {
    const failure: KentuuParseFailure = {
      errorCode: "UNSUPPORTED",
      message: "PDFデータの読み込みに失敗しました。",
    };
    return NextResponse.json(failure, { status: 400 });
  }

  const result = await parseKentuuPdf(buffer);
  if ("errorCode" in result) {
    const status = result.errorCode === "NO_TEXT_LAYER" ? 422 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
