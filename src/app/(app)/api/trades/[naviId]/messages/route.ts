import { handleGetMessages, handlePostMessage } from "@/lib/messages/server";

export async function GET(request: Request, { params }: { params: { naviId: string } }) {
  return handleGetMessages(request, params.naviId);
}

export async function POST(request: Request, { params }: { params: { naviId: string } }) {
  return handlePostMessage(request, params.naviId);
}
