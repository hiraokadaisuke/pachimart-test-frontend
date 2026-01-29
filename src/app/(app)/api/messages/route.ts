import { handleGetMessages, handlePostMessage } from "@/lib/messages/server";

export async function GET(request: Request) {
  return handleGetMessages(request);
}

export async function POST(request: Request) {
  return handlePostMessage(request);
}
